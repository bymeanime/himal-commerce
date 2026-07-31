import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

// GET /api/dashboard?storeId=...&range=7d
// Returns enriched dashboard data: funnel metrics, top products, low-stock alerts,
// recent reviews, abandoned cart stats, conversion rates.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const adminGate = requireAdmin(req)
  if (adminGate) return adminGate
  const storeId = searchParams.get('storeId')
  const range = searchParams.get('range') || '7d'

  if (!storeId) {
    return NextResponse.json({ error: 'storeId is required' }, { status: 400 })
  }

  const days = range === '30d' ? 30 : range === '90d' ? 90 : 7
  const since = new Date(Date.now() - days * 86400000)

  // --- Analytics funnel ---
  const events = await db.analyticsEvent.findMany({
    where: { storeId, createdAt: { gte: since } },
    select: { type: true, createdAt: true },
  })

  const funnel = {
    page_view: 0,
    product_view: 0,
    add_to_cart: 0,
    checkout_start: 0,
    checkout_complete: 0,
    checkout_abandon: 0,
    search: 0,
  }
  events.forEach((e) => {
    if (e.type in funnel) (funnel as Record<string, number>)[e.type]++
  })

  const conversionRate = funnel.checkout_start > 0
    ? Math.round((funnel.checkout_complete / funnel.checkout_start) * 1000) / 10
    : 0
  const cartAbandonRate = funnel.add_to_cart > 0
    ? Math.round(((funnel.add_to_cart - funnel.checkout_complete) / funnel.add_to_cart) * 1000) / 10
    : 0

  // Daily breakdown for chart
  const dailyMap = new Map<string, { date: string; revenue: number; orders: number; views: number }>()
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    dailyMap.set(key, { date: key, revenue: 0, orders: 0, views: 0 })
  }

  const orders = await db.order.findMany({
    where: { storeId, createdAt: { gte: since } },
    select: { total: true, createdAt: true, status: true, paymentStatus: true },
  })
  orders.forEach((o) => {
    const key = o.createdAt.toISOString().slice(0, 10)
    const entry = dailyMap.get(key)
    if (entry) {
      entry.orders++
      if (o.paymentStatus === 'paid') entry.revenue += o.total
    }
  })
  events.forEach((e) => {
    if (e.type === 'page_view') {
      const key = e.createdAt.toISOString().slice(0, 10)
      const entry = dailyMap.get(key)
      if (entry) entry.views++
    }
  })

  // --- Low stock alerts ---
  const lowStockProducts = await db.product.findMany({
    where: {
      storeId,
      status: 'published',
      inventory: { lte: db.product.fields.lowStockThreshold },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      thumbnail: true,
      inventory: true,
      lowStockThreshold: true,
      sku: true,
    },
    take: 20,
    orderBy: { inventory: 'asc' },
  })

  // --- Recent reviews needing moderation ---
  const pendingReviews = await db.productReview.findMany({
    where: { storeId, status: 'pending' },
    include: { product: { select: { title: true, slug: true, thumbnail: true } } },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  // --- Abandoned cart stats ---
  const abandonedCount = await db.abandonedCart.count({
    where: { storeId, recoveredAt: null },
  })
  const abandonedValue = await db.abandonedCart.aggregate({
    where: { storeId, recoveredAt: null },
    _sum: { cartValue: true },
  })

  // --- Pending returns ---
  const pendingReturns = await db.returnRequest.count({
    where: { storeId, status: 'requested' },
  })

  return NextResponse.json({
    funnel,
    conversionRate,
    cartAbandonRate,
    salesByDay: Array.from(dailyMap.values()),
    lowStockProducts,
    pendingReviews,
    abandonedCarts: {
      count: abandonedCount,
      totalValue: abandonedValue._sum.cartValue || 0,
    },
    pendingReturns,
    range: days,
  })
}
