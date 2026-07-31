import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { requireAdmin } from '@/lib/admin-auth'

type Params = { params: Promise<{ id: string }> }

// Allowed status enums + transition matrix (Ops + QA panels P1).
// Invalid transitions are rejected with 409.
const ALLOWED_STATUS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded', 'on_hold'] as const
const ALLOWED_PAYMENT = ['unpaid', 'pending', 'paid', 'refunded', 'partially_refunded'] as const
const ALLOWED_FULFILLMENT = ['unfulfilled', 'fulfilled', 'returned'] as const

// Transition matrix — currentStatus → allowed next statuses
const STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  pending: ['processing', 'cancelled', 'on_hold'],
  on_hold: ['pending', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'returned'],
  delivered: ['returned', 'refunded'],
  returned: ['refunded'],
  refunded: [],
  cancelled: [],
}

// Multi-tenant isolation (Tech/API/QA panels P0)
async function verifyOrderOwnership(orderId: string, storeId: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, select: { storeId: true } })
  if (!order || order.storeId !== storeId) return null
  return order
}

// GET /api/orders/[id]?storeId=...
// storeId is REQUIRED (QA-001 fix) — prevents cross-tenant IDOR.
// Without it, any caller could enumerate orders by id.
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params
  const adminGate = requireAdmin(req)
  if (adminGate) return adminGate
  const storeId = new URL(req.url).searchParams.get('storeId')
  if (!storeId) {
    return NextResponse.json({ error: 'storeId is required for authorization' }, { status: 400 })
  }
  const owns = await verifyOrderOwnership(id, storeId)
  if (!owns) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  const order = await db.order.findUnique({
    where: { id },
    include: { items: true, customer: true, store: { select: { id: true, name: true, slug: true } }, events: { orderBy: { createdAt: 'desc' }, take: 20 } },
  })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  return NextResponse.json({ order })
}

// PATCH /api/orders/[id]
// Validates status transitions, auto-sets timestamps, writes audit log.
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json()
  const storeId = body.storeId
  if (!storeId) {
    return NextResponse.json({ error: 'storeId is required for authorization' }, { status: 400 })
  }
  const owns = await verifyOrderOwnership(id, storeId)
  if (!owns) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const current = await db.order.findUnique({ where: { id } })
  if (!current) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  // ====== Enum validation ======
  if (body.status !== undefined && !ALLOWED_STATUS.includes(body.status)) {
    return NextResponse.json({ error: { code: 'INVALID_STATUS', message: `Status must be one of: ${ALLOWED_STATUS.join(', ')}` } }, { status: 400 })
  }
  if (body.paymentStatus !== undefined && !ALLOWED_PAYMENT.includes(body.paymentStatus)) {
    return NextResponse.json({ error: { code: 'INVALID_PAYMENT_STATUS', message: `Payment status must be one of: ${ALLOWED_PAYMENT.join(', ')}` } }, { status: 400 })
  }
  if (body.fulfillment !== undefined && !ALLOWED_FULFILLMENT.includes(body.fulfillment)) {
    return NextResponse.json({ error: { code: 'INVALID_FULFILLMENT', message: `Fulfillment must be one of: ${ALLOWED_FULFILLMENT.join(', ')}` } }, { status: 400 })
  }

  // ====== Transition validation ======
  if (body.status !== undefined && body.status !== current.status) {
    const allowed = STATUS_TRANSITIONS[current.status] || []
    if (!allowed.includes(body.status)) {
      return NextResponse.json({
        error: {
          code: 'INVALID_TRANSITION',
          message: `Cannot transition from "${current.status}" to "${body.status}". Allowed: ${allowed.length ? allowed.join(', ') : '(none — terminal state)'}`,
        },
      }, { status: 409 })
    }
  }

  // ====== Auto-set timestamps based on new status ======
  const data: Record<string, unknown> = {}
  if (body.status !== undefined) data.status = body.status
  if (body.paymentStatus !== undefined) data.paymentStatus = body.paymentStatus
  if (body.fulfillment !== undefined) data.fulfillment = body.fulfillment
  if (body.notes !== undefined) data.notes = body.notes
  if (body.internalNotes !== undefined) data.internalNotes = body.internalNotes
  if (body.courier !== undefined) data.courier = body.courier
  if (body.trackingNumber !== undefined) data.trackingNumber = body.trackingNumber
  if (body.courierShipmentId !== undefined) data.courierShipmentId = body.courierShipmentId
  if (body.heldReason !== undefined) data.heldReason = body.heldReason
  // COD verification workflow (STAFF-008) — staff can mark COD verified + method
  if (body.codVerified !== undefined) data.codVerified = Boolean(body.codVerified)
  if (body.codVerificationMethod !== undefined) data.codVerificationMethod = body.codVerificationMethod
  if (body.verificationStatus !== undefined) data.verificationStatus = body.verificationStatus
  // Dispute tracking (CEO panel)
  if (body.disputeStatus !== undefined) data.disputeStatus = body.disputeStatus
  if (body.disputeReason !== undefined) data.disputeReason = body.disputeReason

  // Status → timestamp auto-set
  if (body.status === 'shipped' && !current.shippedAt) data.shippedAt = new Date()
  if (body.status === 'delivered' && !current.deliveredAt) data.deliveredAt = new Date()
  if (body.status === 'cancelled' && !current.cancelledAt) data.cancelledAt = new Date()
  if (body.status === 'refunded' && !current.refundedAt) data.refundedAt = new Date()
  // Payment status → timestamp
  if (body.paymentStatus === 'paid' && !current.paidAt) data.paidAt = new Date()

  const order = await db.order.update({
    where: { id },
    data,
    include: { items: true },
  })

  // ====== Order event — audit trail (Ops panel) ======
  const changes: string[] = []
  if (body.status && body.status !== current.status) changes.push(`status: ${current.status} → ${body.status}`)
  if (body.paymentStatus && body.paymentStatus !== current.paymentStatus) changes.push(`payment: ${current.paymentStatus} → ${body.paymentStatus}`)
  if (body.fulfillment && body.fulfillment !== current.fulfillment) changes.push(`fulfillment: ${current.fulfillment} → ${body.fulfillment}`)
  if (body.trackingNumber && body.trackingNumber !== current.trackingNumber) changes.push(`tracking: ${body.trackingNumber}`)
  if (body.internalNotes !== undefined) changes.push('internal notes updated')
  if (body.codVerified !== undefined && body.codVerified !== current.codVerified) changes.push(`COD verified: ${body.codVerified ? 'yes' : 'no'}`)
  if (body.verificationStatus && body.verificationStatus !== current.verificationStatus) changes.push(`verification: ${current.verificationStatus} → ${body.verificationStatus}`)
  if (body.courier && body.courier !== current.courier) changes.push(`courier: ${body.courier}`)

  if (changes.length) {
    await db.orderEvent.create({
      data: {
        orderId: id,
        type: 'status_change',
        message: changes.join(' · '),
        actorKind: 'user',
      },
    })
  }

  // ====== Audit log (Data panel) ======
  await logAudit({
    storeId,
    actorKind: 'user',
    action: 'order.update',
    entityType: 'order',
    entityId: id,
    before: { status: current.status, paymentStatus: current.paymentStatus },
    after: { status: order.status, paymentStatus: order.paymentStatus },
  })

  return NextResponse.json({ order })
}

// DELETE /api/orders/[id]?storeId=...
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params
  const storeId = new URL(req.url).searchParams.get('storeId')
  if (!storeId) {
    return NextResponse.json({ error: 'storeId is required for authorization' }, { status: 400 })
  }
  const owns = await verifyOrderOwnership(id, storeId)
  if (!owns) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  // Soft behavior — actually delete for now (no soft-delete column on Order).
  // Real production should set status='cancelled' instead of hard-delete.
  await db.order.delete({ where: { id } })

  await logAudit({
    storeId,
    actorKind: 'user',
    action: 'order.delete',
    entityType: 'order',
    entityId: id,
  })

  return NextResponse.json({ ok: true })
}
