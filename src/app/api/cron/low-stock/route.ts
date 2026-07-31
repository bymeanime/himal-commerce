import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/cron/low-stock — daily low-stock alert.
// Triggered by Vercel Cron at 10:00 UTC daily.
//
// Ecommerce panel P2. In production this would:
//   1. Find products below their lowStockThreshold for each store
//   2. Send an SMS to the store owner's supportPhone via SparrowSMS
//   3. Optionally create an in-app notification

export async function GET(req: NextRequest) {
  // Fail closed (QA-009 fix) — see abandoned-cart cron for full rationale.
  const authHeader = req.headers.get('authorization')
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return NextResponse.json(
      { error: 'CRON_SECRET env var is not set — cron endpoint is disabled.' },
      { status: 500 }
    )
  }
  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find all products at or below their low-stock threshold
    // (Prisma doesn't support comparing columns directly, so we fetch + filter)
    const products = await db.product.findMany({
      where: { status: 'published' },
      select: {
        id: true,
        title: true,
        inventory: true,
        lowStockThreshold: true,
        sku: true,
        storeId: true,
        store: { select: { name: true, supportPhone: true, ownerPhone: true } },
      },
    })

    const lowStock = products.filter(p => p.inventory <= p.lowStockThreshold)

    // Group by store
    const byStore = new Map<string, { storeName: string; phone?: string | null; items: { title: string; sku: string | null; inventory: number; threshold: number }[] }>()
    for (const p of lowStock) {
      const key = p.storeId
      if (!byStore.has(key)) {
        byStore.set(key, {
          storeName: p.store.name,
          phone: p.store.supportPhone || p.store.ownerPhone,
          items: [],
        })
      }
      byStore.get(key)!.items.push({
        title: p.title,
        sku: p.sku,
        inventory: p.inventory,
        threshold: p.lowStockThreshold,
      })
    }

    // TODO: when SPARROW_SMS_TOKEN is set, iterate byStore and send SMS:
    //   "Himal Commerce alert: 5 products in {storeName} are low on stock.
    //    Login to restock: https://himal-commerce.vercel.app/#store/{id}/admin"

    return NextResponse.json({
      ok: true,
      storesAffected: byStore.size,
      totalLowStock: lowStock.length,
      message: lowStock.length > 0 && !process.env.SPARROW_SMS_TOKEN
        ? `${lowStock.length} low-stock products across ${byStore.size} stores, but SPARROW_SMS_TOKEN is not set — no SMS sent.`
        : `${lowStock.length} low-stock products processed.`,
    })
  } catch (e) {
    return NextResponse.json({ error: 'Cron failed', message: e instanceof Error ? e.message : 'unknown' }, { status: 500 })
  }
}
