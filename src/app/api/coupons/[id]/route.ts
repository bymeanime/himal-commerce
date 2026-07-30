import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH /api/coupons/[id] — update a coupon (status, etc.)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { storeId, status, ...rest } = body

  if (!storeId) {
    return NextResponse.json({ error: 'storeId is required' }, { status: 400 })
  }

  const coupon = await db.coupon.findFirst({ where: { id, storeId } })
  if (!coupon) {
    return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
  }

  const data: Record<string, unknown> = {}
  if (status) data.status = status
  if (rest.code) data.code = String(rest.code).toUpperCase()
  if (rest.value !== undefined) data.value = parseInt(rest.value, 10)
  if (rest.minSubtotal !== undefined) data.minSubtotal = rest.minSubtotal ? parseInt(rest.minSubtotal, 10) : null
  if (rest.maxRedemptions !== undefined) data.maxRedemptions = rest.maxRedemptions ? parseInt(rest.maxRedemptions, 10) : null
  if (rest.startsAt !== undefined) data.startsAt = rest.startsAt ? new Date(rest.startsAt) : null
  if (rest.endsAt !== undefined) data.endsAt = rest.endsAt ? new Date(rest.endsAt) : null

  const updated = await db.coupon.update({ where: { id }, data })
  return NextResponse.json({ coupon: updated })
}

// DELETE /api/coupons/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('storeId')

  if (!storeId) {
    return NextResponse.json({ error: 'storeId is required' }, { status: 400 })
  }

  const coupon = await db.coupon.findFirst({ where: { id, storeId } })
  if (!coupon) {
    return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
  }

  await db.coupon.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
