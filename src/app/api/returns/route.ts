import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/returns?storeId=...&status=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('storeId')
  const status = searchParams.get('status')

  if (!storeId) {
    return NextResponse.json({ error: 'storeId is required' }, { status: 400 })
  }

  const where: Record<string, unknown> = { storeId }
  if (status && status !== 'all') where.status = status

  const returns = await db.returnRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          customerPhone: true,
          total: true,
          items: true,
        },
      },
    },
  })

  return NextResponse.json({ returns })
}

// POST /api/returns — create a return request (public endpoint, called from order lookup)
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { orderId, storeId, reason, reasonCode, itemsRequested } = body

  if (!orderId || !storeId || !reason || !reasonCode) {
    return NextResponse.json(
      { error: 'orderId, storeId, reason, and reasonCode are required' },
      { status: 400 }
    )
  }

  // Verify order belongs to store
  const order = await db.order.findFirst({ where: { id: orderId, storeId } })
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const returnRequest = await db.returnRequest.create({
    data: {
      orderId,
      storeId,
      reason,
      reasonCode,
      itemsRequested: itemsRequested || null,
      status: 'requested',
    },
  })

  // Log an order event
  await db.orderEvent.create({
    data: {
      orderId,
      type: 'return_requested',
      message: `Return requested: ${reason}`,
      actorKind: 'customer',
    },
  })

  return NextResponse.json({ returnRequest }, { status: 201 })
}

// PATCH /api/returns — update return status (approve/reject/refunded)
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, storeId, status, refundAmount, refundMethod, trackingNumber } = body

  if (!id || !storeId || !status) {
    return NextResponse.json({ error: 'id, storeId, and status are required' }, { status: 400 })
  }

  const returnReq = await db.returnRequest.findFirst({ where: { id, storeId } })
  if (!returnReq) {
    return NextResponse.json({ error: 'Return request not found' }, { status: 404 })
  }

  if (!['requested', 'approved', 'rejected', 'received', 'refunded', 'exchanged'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const data: Record<string, unknown> = { status }
  if (refundAmount !== undefined) data.refundAmount = parseInt(refundAmount, 10)
  if (refundMethod) data.refundMethod = refundMethod
  if (trackingNumber) data.trackingNumber = trackingNumber
  if (['refunded', 'exchanged', 'rejected'].includes(status)) {
    data.resolvedAt = new Date()
  }

  const updated = await db.returnRequest.update({ where: { id }, data })

  // Log an order event
  await db.orderEvent.create({
    data: {
      orderId: returnReq.orderId,
      type: 'return_status_change',
      message: `Return ${status}`,
      actorKind: 'user',
    },
  })

  return NextResponse.json({ returnRequest: updated })
}
