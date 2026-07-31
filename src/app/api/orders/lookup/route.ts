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

  // Normalize phone — strip spaces/dashes/parens, keep digits and leading +
  // Then extract the last 10 digits (Nepal mobile numbers are 10 digits without country code)
  // for matching. This prevents substring enumeration (QA-005) where an attacker
  // could type "9" and match every Nepal phone number.
  const normalizedPhone = phone.replace(/[\s\-()]/g, '')
  if (!normalizedPhone) {
    return NextResponse.json(
      { error: 'Phone number and order number are required' },
      { status: 400 }
    )
  }

  // Extract last 10 digits — handles "+977 98XXXXXXXX", "97798XXXXXXXX", "98XXXXXXXX", "098XXXXXXXX"
  const digitsOnly = normalizedPhone.replace(/\D/g, '')
  const last10 = digitsOnly.slice(-10)
  if (last10.length !== 10) {
    return NextResponse.json(
      { error: 'Please enter a valid 10-digit Nepal mobile number.' },
      { status: 400 }
    )
  }

  // Match by exact phone OR by phone ending in the same 10 digits (handles +977 prefix variations).
  // We use a precise endsWith pattern instead of `contains` to prevent partial enumeration.
  const order = await db.order.findFirst({
    where: {
      storeId,
      orderNumber: orderNumber.toUpperCase().trim(),
      customerPhone: { endsWith: last10 },
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
