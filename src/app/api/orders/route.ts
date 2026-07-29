import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/orders — list orders, optional ?status=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (status && status !== 'all') where.status = status

  const orders = await db.order.findMany({
    where,
    include: { items: true, customer: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ orders })
}

// POST /api/orders — create order manually from admin
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { customerName, customerPhone, customerEmail, shippingAddress, shippingCity, shippingDistrict, paymentMethod, items, notes } = body

  if (!customerName || !customerPhone || !shippingAddress || !shippingCity || !shippingDistrict || !paymentMethod || !items?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const subtotal = items.reduce((sum: number, it: { price: number; quantity: number }) => sum + it.price * it.quantity, 0)
  const shippingCost = body.shippingCost ?? 100 * 100
  const total = subtotal + shippingCost

  // Generate order number
  const count = await db.order.count()
  const orderNumber = `HC-${String(2024000 + count + 1)}`

  const order = await db.order.create({
    data: {
      orderNumber,
      status: 'pending',
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      shippingCity,
      shippingDistrict,
      shippingZone: body.shippingZone || 'Bagmati',
      paymentMethod,
      paymentStatus: 'unpaid',
      subtotal,
      shippingCost,
      total,
      notes,
      items: { create: items },
    },
    include: { items: true },
  })
  return NextResponse.json({ order }, { status: 201 })
}
