import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

// GET /api/customers?storeId=xxx
// Admin-only — returns customer PII (name, phone, email, address). (QA-016 regression fix.)
export async function GET(req: NextRequest) {
  const adminGate = requireAdmin(req)
  if (adminGate) return adminGate

  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('storeId')

  if (!storeId) {
    return NextResponse.json({ error: 'storeId is required' }, { status: 400 })
  }

  const customers = await db.customer.findMany({
    where: { storeId },
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

  const totals = await db.order.groupBy({
    by: ['customerId'],
    _sum: { total: true },
    where: { customerId: { in: customers.map((c) => c.id) } },
  })
  const totalMap = new Map(totals.map((t) => [t.customerId, t._sum.total || 0]))

  return NextResponse.json({
    customers: customers.map((c) => ({
      id: c.id,
      storeId: c.storeId,
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      city: c.city,
      district: c.district,
      createdAt: c.createdAt,
      orderCount: c._count.orders,
      totalSpent: totalMap.get(c.id) || 0,
      recentOrders: c.orders,
    })),
  })
}

// POST /api/customers
export async function POST(req: NextRequest) {
  const adminGate = requireAdmin(req)
  if (adminGate) return adminGate

  const body = await req.json()
  const { storeId, name, phone, email, address, city, district } = body
  if (!storeId || !name || !phone) {
    return NextResponse.json({ error: 'storeId, name, phone are required' }, { status: 400 })
  }
  try {
    const customer = await db.customer.create({ data: { storeId, name, phone, email, address, city, district } })
    return NextResponse.json({ customer }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Phone already exists for this store' }, { status: 400 })
  }
}
