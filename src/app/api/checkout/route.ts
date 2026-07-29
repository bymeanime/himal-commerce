import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calcShippingCost, getProvince } from '@/lib/nepal'

// POST /api/checkout — place an order from the storefront
export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    customerName,
    customerPhone,
    customerEmail,
    shippingAddress,
    shippingCity,
    shippingDistrict,
    paymentMethod,
    items, // [{ productId, title, thumbnail, price (paisa), quantity }]
    notes,
  } = body

  if (!customerName || !customerPhone || !shippingAddress || !shippingCity || !shippingDistrict) {
    return NextResponse.json({ error: 'Missing required shipping fields' }, { status: 400 })
  }
  if (!items?.length) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }
  if (!['cod', 'esewa', 'khalti'].includes(paymentMethod)) {
    return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
  }

  const subtotal = items.reduce((sum: number, it: { price: number; quantity: number }) => sum + it.price * it.quantity, 0)
  const shippingCost = calcShippingCost(shippingDistrict)
  const total = subtotal + shippingCost
  const province = getProvince(shippingDistrict) || 'Bagmati'

  // Find or create customer by phone
  let customer = await db.customer.findUnique({ where: { phone: customerPhone } })
  if (!customer) {
    customer = await db.customer.create({
      data: {
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        address: shippingAddress,
        city: shippingCity,
        district: shippingDistrict,
      },
    })
  }

  const count = await db.order.count()
  const orderNumber = `HC-${String(2024000 + count + 1)}`

  const order = await db.order.create({
    data: {
      orderNumber,
      status: 'pending',
      customerId: customer.id,
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      shippingCity,
      shippingDistrict,
      shippingZone: province,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'unpaid' : 'paid',
      subtotal,
      shippingCost,
      total,
      notes,
      items: {
        create: items.map((it: { productId: string; title: string; thumbnail: string | null; price: number; quantity: number }) => ({
          productId: it.productId,
          title: it.title,
          thumbnail: it.thumbnail,
          price: it.price,
          quantity: it.quantity,
        })),
      },
    },
    include: { items: true, customer: true },
  })

  // Decrement inventory
  for (const it of items) {
    if (it.productId) {
      try {
        await db.product.update({
          where: { id: it.productId },
          data: { inventory: { decrement: it.quantity } },
        })
      } catch {
        // ignore
      }
    }
  }

  return NextResponse.json({ order }, { status: 201 })
}
