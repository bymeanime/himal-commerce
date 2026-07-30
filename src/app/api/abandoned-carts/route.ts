import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/abandoned-carts?storeId=...&recovered=false
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('storeId')
  const recovered = searchParams.get('recovered')

  if (!storeId) {
    return NextResponse.json({ error: 'storeId is required' }, { status: 400 })
  }

  const where: Record<string, unknown> = { storeId }
  if (recovered === 'false') {
    where.recoveredAt = null
  } else if (recovered === 'true') {
    where.NOT = { recoveredAt: null }
  }

  const carts = await db.abandonedCart.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  // Summary stats
  const total = await db.abandonedCart.count({ where: { storeId } })
  const recoveredCount = await db.abandonedCart.count({
    where: { storeId, NOT: { recoveredAt: null } },
  })
  const totalValue = await db.abandonedCart.aggregate({
    where: { storeId, recoveredAt: null },
    _sum: { cartValue: true },
  })

  return NextResponse.json({
    carts,
    stats: {
      total,
      recovered: recoveredCount,
      openValue: totalValue._sum.cartValue || 0,
      recoveryRate: total > 0 ? Math.round((recoveredCount / total) * 100) : 0,
    },
  })
}
