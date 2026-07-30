import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { trackEvent } from '@/lib/analytics-server'

// POST /api/orders/lookup
// Public endpoint — customers look up their orders by phone + order number.
// This is the storefront "Find my order" portal.
//
// Security: requires BOTH phone AND orderNumber (so an attacker can't
// enumerate by phone alone). Returns only the matching order with items + events.
// Rate-limit by IP is handled by middleware (/api/* is rate-limited).
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { storeId, phone, orderNumber } = body

  if (!storeId || !phone || !orderNumber) {
    return NextResponse.json(
      { error: 'Phone number and order number are required' },
      { status: 400 }
    )
  }

  // Normalize phone — strip spaces/dashes, keep digits and leading +
  const normalizedPhone = phone.replace(/[\s\-()]/g, '')
  if (!normalizedPhone) {
    return NextResponse.json(
      { error: 'Phone number and order number are required' },
      { status: 400 }
    )
  }

  // Try exact match first, then suffix match (in case the stored phone has a +977 prefix
  // but the customer typed the local number, or vice versa)
  const order = await db.order.findFirst({
    where: {
      storeId,
      orderNumber: orderNumber.toUpperCase().trim(),
      OR: [
        { customerPhone: normalizedPhone },
        { customerPhone: { contains: normalizedPhone } },
        // If the customer typed +977, try matching the last 10 digits
        { customerPhone: { contains: normalizedPhone.replace(/^\+977/, '') } },
      ],
    },
    include: {
      items: true,
      events: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  })

  if (!order) {
    return NextResponse.json(
      { error: 'No order found. Please check your phone number and order number.' },
      { status: 404 }
    )
  }

  // Don't expose internal notes, risk scores, or affiliate IDs to the customer
  const safeOrder = {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    fulfillment: order.fulfillment,
    customerName: order.customerName,
    shippingAddress: order.shippingAddress,
    shippingCity: order.shippingCity,
    shippingDistrict: order.shippingDistrict,
    shippingZone: order.shippingZone,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    taxTotal: order.taxTotal,
    discountAmount: order.discountAmount,
    total: order.total,
    courier: order.courier,
    trackingNumber: order.trackingNumber,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    cancelledAt: order.cancelledAt,
    refundedAt: order.refundedAt,
    items: order.items.map((it) => ({
      id: it.id,
      title: it.title,
      variantTitle: it.variantTitle,
      thumbnail: it.thumbnail,
      price: it.price,
      quantity: it.quantity,
    })),
    events: order.events.map((e) => ({
      type: e.type,
      message: e.message,
      actorKind: e.actorKind,
      createdAt: e.createdAt,
    })),
  }

  // Record analytics event (fire-and-forget; never blocks the response)
  await trackEvent(storeId, 'order_lookup', {
    sessionId: req.headers.get('x-session-id') || 'anon',
    meta: { orderNumber: order.orderNumber },
  }).catch(() => {})

  return NextResponse.json({ order: safeOrder })
}
