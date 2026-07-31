import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

// GET /api/refunds?storeId=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const adminGate = requireAdmin(req)
  if (adminGate) return adminGate
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

  // ====== QA-011 fix: cumulative refund check ======
  // Previously: only checked `amount > order.total`, allowing multiple refunds
  // to exceed the order total. Now: sum all PRIOR *processed* refunds and
  // reject if (priorRefunded + newAmount) > order.total.
  const refundAmount = parseInt(amount, 10)
  if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
    return NextResponse.json({ error: 'Refund amount must be a positive number' }, { status: 400 })
  }

  const priorRefundsAgg = await db.refund.aggregate({
    _sum: { amount: true },
    where: { orderId, status: 'processed' },
  })
  const alreadyRefunded = priorRefundsAgg._sum.amount || 0
  const newTotalRefunded = alreadyRefunded + refundAmount

  if (newTotalRefunded > order.total) {
    return NextResponse.json(
      {
        error: {
          code: 'REFUND_EXCEEDS_TOTAL',
          message: `Refund of रू ${(refundAmount / 100).toLocaleString('en-IN')} would bring total refunds to रू ${(newTotalRefunded / 100).toLocaleString('en-IN')}, exceeding order total of रू ${(order.total / 100).toLocaleString('en-IN')}. Already refunded: रू ${(alreadyRefunded / 100).toLocaleString('en-IN')}.`,
          alreadyRefunded,
          orderTotal: order.total,
          attemptedAmount: refundAmount,
        },
      },
      { status: 400 }
    )
  }

  const refund = await db.refund.create({
    data: {
      orderId,
      amount: refundAmount,
      reason,
      method,
      status: 'processed',
      processedAt: new Date(),
      initiatedBy: initiatedBy || 'admin',
      notes: notes || null,
    },
  })

  // Update order payment status — fully refunded if cumulative equals total,
  // otherwise partially_refunded.
  const paymentStatus = newTotalRefunded >= order.total ? 'refunded' : 'partially_refunded'
  await db.order.update({
    where: { id: orderId },
    data: {
      paymentStatus,
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
