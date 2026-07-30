import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/refunds?storeId=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('storeId')

  if (!storeId) {
    return NextResponse.json({ error: 'storeId is required' }, { status: 400 })
  }

  // Refunds are scoped via Order.storeId
  const refunds = await db.refund.findMany({
    where: { order: { storeId } },
    orderBy: { createdAt: 'desc' },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          customerPhone: true,
          total: true,
          paymentMethod: true,
          paymentStatus: true,
        },
      },
    },
  })

  return NextResponse.json({ refunds })
}

// POST /api/refunds — issue a refund
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { orderId, storeId, amount, reason, method, initiatedBy, notes } = body

  if (!orderId || !storeId || amount === undefined || !reason || !method) {
    return NextResponse.json(
      { error: 'orderId, storeId, amount, reason, and method are required' },
      { status: 400 }
    )
  }

  // Verify order belongs to store (multi-tenant safety)
  const order = await db.order.findFirst({ where: { id: orderId, storeId } })
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (amount > order.total) {
    return NextResponse.json(
      { error: 'Refund amount cannot exceed order total' },
      { status: 400 }
    )
  }

  const refund = await db.refund.create({
    data: {
      orderId,
      amount: parseInt(amount, 10),
      reason,
      method,
      status: 'processed',
      processedAt: new Date(),
      initiatedBy: initiatedBy || 'admin',
      notes: notes || null,
    },
  })

  // Update order payment status
  const totalRefunded = (order.total - amount) <= 0 ? 'refunded' : 'partially_refunded'
  await db.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: totalRefunded,
      refundedAt: new Date(),
    },
  })

  // Log an order event
  await db.orderEvent.create({
    data: {
      orderId,
      type: 'refund_issued',
      message: `Refund of रू ${(amount / 100).toLocaleString('en-IN')} issued via ${method}: ${reason}`,
      actorKind: 'user',
    },
  })

  return NextResponse.json({ refund }, { status: 201 })
}
