import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/customers
export async function GET() {
  const customers = await db.customer.findMany({
    include: {
      _count: { select: { orders: true } },
      orders: {
        select: { total: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const enriched = customers.map((c) => ({
    ...c,
    orderCount: c._count.orders,
  }))

  // Aggregate total spent per customer
  const totals = await db.order.groupBy({
    by: ['customerId'],
    _sum: { total: true },
    where: { customerId: { in: enriched.map((c) => c.id) } },
  })
  const totalMap = new Map(totals.map((t) => [t.customerId, t._sum.total || 0]))

  return NextResponse.json({
    customers: enriched.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      city: c.city,
      district: c.district,
      createdAt: c.createdAt,
      orderCount: c.orderCount,
      totalSpent: totalMap.get(c.id) || 0,
      recentOrders: c.orders,
    })),
  })
}

// POST /api/customers
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, phone, email, address, city, district } = body
  if (!name || !phone) return NextResponse.json({ error: 'name and phone required' }, { status: 400 })

  try {
    const customer = await db.customer.create({ data: { name, phone, email, address, city, district } })
    return NextResponse.json({ customer }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Phone number already exists' }, { status: 400 })
  }
}
