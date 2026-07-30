import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH /api/reviews/[id] — approve / reject / delete a review
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { storeId, status } = body

  if (!storeId) {
    return NextResponse.json({ error: 'storeId is required' }, { status: 400 })
  }

  // Multi-tenant safety: verify the review belongs to this store
  const review = await db.productReview.findFirst({
    where: { id, storeId },
  })
  if (!review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 })
  }

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const updated = await db.productReview.update({
    where: { id },
    data: { status },
  })

  return NextResponse.json({ review: updated })
}

// DELETE /api/reviews/[id] — permanently delete a review
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

  const review = await db.productReview.findFirst({
    where: { id, storeId },
  })
  if (!review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 })
  }

  await db.productReview.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
