import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/orders?storeId=xxx&status=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('storeId')
  const status = searchParams.get('status')

  if (!storeId) {
    return NextResponse.json({ error: 'storeId is required' }, { status: 400 })
  }

  const where: Record<string, unknown> = { storeId }
  if (status && status !== 'all') where.status = status

  const orders = await db.order.findMany({
    where,
    include: { items: true, customer: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ orders })
}

// POST /api/orders — create order from admin
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { storeId, customerName, customerPhone, customerEmail, shippingAddress, shippingCity, shippingDistrict, paymentMethod, items, notes } = body

  if (!storeId || !customerName || !customerPhone || !shippingAddress || !shippingCity || !shippingDistrict || !paymentMethod || !items?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const subtotal = items.reduce((sum: number, it: { price: number; quantity: number }) => sum + it.price * it.quantity, 0)
  const shippingCost = body.shippingCost ?? 100 * 100
  const total = subtotal + shippingCost

  const count = await db.order.count({ where: { storeId } })
  const orderNumber = `HC-${String(1000 + count + 1)}`

  const order = await db.order.create({
    data: {
      storeId,
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
