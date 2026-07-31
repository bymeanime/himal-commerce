import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/stats?storeId=xxx  → per-store dashboard (caller must own storeId)
// GET /api/stats?platform=true&platformKey=xxx → super-admin cross-store dashboard
//
// SECURITY (QA-006 fix): platform mode requires a `platformKey` query param
// matching the `PLATFORM_ADMIN_KEY` env var. If the env var is unset, the
// endpoint returns 403 — fail-closed — so that platform-wide revenue figures
// are never exposed on a public deployment by default.
//
// To enable the platform dashboard: set `PLATFORM_ADMIN_KEY` in Vercel env
// vars, then pass the same value as `?platformKey=` from the Platform
// component (read via `NEXT_PUBLIC_PLATFORM_ADMIN_KEY`).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('storeId')
  const platform = searchParams.get('platform') === 'true'

  // ====== Platform super-admin stats ======
  if (platform) {
    const platformKey = searchParams.get('platformKey')
    const expectedKey = process.env.PLATFORM_ADMIN_KEY
    if (!expectedKey || platformKey !== expectedKey) {
      return NextResponse.json(
        {
          error: {
            code: 'PLATFORM_AUTH_REQUIRED',
            message: expectedKey
              ? 'Invalid or missing platformKey. Platform stats require authentication.'
              : 'Platform stats are disabled. Set PLATFORM_ADMIN_KEY env var and pass ?platformKey= to enable.',
          },
        },
        { status: 403 }
      )
    }
    const [totalStores, totalOrders, totalProducts, totalCustomers, totalRevenueAgg, stores] = await Promise.all([
      db.store.count(),
      db.order.count(),
      db.product.count(),
      db.customer.count(),
      db.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'paid' } }),
      db.store.findMany({
        include: {
          _count: { select: { products: true, orders: true, customers: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    // Per-store revenue
    const revenueByStore = await db.order.groupBy({
      by: ['storeId'],
      _sum: { total: true },
      where: { paymentStatus: 'paid' },
    })
    const revMap = new Map(revenueByStore.map((r) => [r.storeId, r._sum.total || 0]))

    const storeStats = stores.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      logoUrl: s.logoUrl,
      plan: s.plan,
      status: s.status,
      ownerName: s.ownerName,
      createdAt: s.createdAt,
      productCount: s._count.products,
      orderCount: s._count.orders,
      customerCount: s._count.customers,
      revenue: revMap.get(s.id) || 0,
    }))

    return NextResponse.json({
      totals: {
        stores: totalStores,
        orders: totalOrders,
        products: totalProducts,
        customers: totalCustomers,
        revenue: totalRevenueAgg._sum.total || 0,
      },
      stores: storeStats,
    })
  }

  // ====== Per-store stats ======
  if (!storeId) {
    return NextResponse.json({ error: 'storeId is required (or use ?platform=true)' }, { status: 400 })
  }

  const [
    totalOrders,
    totalProducts,
    totalCustomers,
    pendingOrders,
    deliveredOrders,
    recentOrders,
    topProductsRaw,
    last7DaysOrders,
    // STAFF-001: triage queue counts — surface orders needing staff action
    onHoldOrders,
    unverifiedCodOrders,
    processingOrders,
    lowStockCount,
  ] = await Promise.all([
    db.order.count({ where: { storeId } }),
    db.product.count({ where: { storeId } }),
    db.customer.count({ where: { storeId } }),
    db.order.count({ where: { storeId, status: 'pending' } }),
    db.order.count({ where: { storeId, status: 'delivered' } }),
    db.order.findMany({
      where: { storeId },
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    }),
    db.orderItem.groupBy({
      by: ['title', 'thumbnail'],
      _sum: { quantity: true },
      where: { order: { storeId } },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
    db.order.findMany({
      where: { storeId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      select: { total: true, createdAt: true, status: true, paymentStatus: true },
    }),
    // STAFF-001: triage counts
    db.order.count({ where: { storeId, status: 'on_hold' } }),
    db.order.count({ where: { storeId, paymentMethod: 'cod', codVerified: false, status: { in: ['pending', 'on_hold'] } } }),
    db.order.count({ where: { storeId, status: 'processing' } }),
    db.product.count({ where: { storeId, status: 'published', inventory: { lte: 5 } } }),
  ])

  const totalRevenue = await db.order.aggregate({
    _sum: { total: true },
    where: { storeId, paymentStatus: 'paid' },
  })

  const days: { date: string; revenue: number; orders: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const dateStr = d.toISOString().split('T')[0]
    const dayOrders = last7DaysOrders.filter((o) => o.createdAt.toISOString().split('T')[0] === dateStr)
    const revenue = dayOrders
      .filter((o) => o.paymentStatus !== 'unpaid')
      .reduce((sum, o) => sum + o.total, 0)
    days.push({
      date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      revenue,
      orders: dayOrders.length,
    })
  }

  const categories = await db.category.findMany({
    where: { storeId },
    include: { _count: { select: { products: true } } },
  })

  return NextResponse.json({
    totals: {
      orders: totalOrders,
      products: totalProducts,
      customers: totalCustomers,
      pendingOrders,
      deliveredOrders,
      revenue: totalRevenue._sum.total || 0,
    },
    // STAFF-001: triage queue — counts of orders needing staff action
    triage: {
      onHold: onHoldOrders,
      unverifiedCod: unverifiedCodOrders,
      processing: processingOrders,
      lowStock: lowStockCount,
    },
    recentOrders,
    topProducts: topProductsRaw.map((p) => ({
      title: p.title,
      thumbnail: p.thumbnail,
      quantitySold: p._sum.quantity,
    })),
    salesByDay: days,
    categories: categories.map((c) => ({ name: c.name, productCount: c._count.products })),
  })
}
