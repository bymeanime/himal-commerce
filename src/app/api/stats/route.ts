import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/stats?storeId=xxx  → per-store dashboard
// GET /api/stats?platform=true → super-admin cross-store dashboard
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('storeId')
  const platform = searchParams.get('platform') === 'true'

  // ====== Platform super-admin stats ======
  if (platform) {
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
