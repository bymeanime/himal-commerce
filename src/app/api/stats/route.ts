import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/stats — dashboard overview
export async function GET() {
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
    db.order.count(),
    db.product.count(),
    db.customer.count(),
    db.order.count({ where: { status: 'pending' } }),
    db.order.count({ where: { status: 'delivered' } }),
    db.order.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    }),
    db.orderItem.groupBy({
      by: ['title', 'thumbnail'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
    db.order.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      select: { total: true, createdAt: true, status: true, paymentStatus: true },
    }),
  ])

  const totalRevenue = await db.order.aggregate({
    _sum: { total: true },
    where: { paymentStatus: 'paid' },
  })

  // Group orders by day for the last 7 days
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
