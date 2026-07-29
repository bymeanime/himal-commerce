import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

// GET /api/orders/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const order = await db.order.findUnique({
    where: { id },
    include: { items: true, customer: true },
  })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  return NextResponse.json({ order })
}

// PATCH /api/orders/[id] — update status, paymentStatus, fulfillment, notes
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.status !== undefined) data.status = body.status
  if (body.paymentStatus !== undefined) data.paymentStatus = body.paymentStatus
  if (body.fulfillment !== undefined) data.fulfillment = body.fulfillment
  if (body.notes !== undefined) data.notes = body.notes

  const order = await db.order.update({ where: { id }, data, include: { items: true } })
  return NextResponse.json({ order })
}

// DELETE /api/orders/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  await db.order.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
