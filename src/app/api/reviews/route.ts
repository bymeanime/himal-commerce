import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/reviews?storeId=...&productId=...&status=approved
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('storeId')
  const productId = searchParams.get('productId')
  const status = searchParams.get('status') || 'approved'

  if (!storeId) {
    return NextResponse.json({ error: 'storeId is required' }, { status: 400 })
  }

  const where: Record<string, unknown> = { storeId }
  if (productId) where.productId = productId
  if (status !== 'all') where.status = status

  const reviews = await db.productReview.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { product: { select: { title: true, slug: true, thumbnail: true } } },
  })

  // Aggregate rating stats
  const approved = reviews.filter((r) => r.status === 'approved')
  const avgRating = approved.length > 0
    ? approved.reduce((s, r) => s + r.rating, 0) / approved.length
    : 0
  const distribution = [0, 0, 0, 0, 0]
  approved.forEach((r) => { distribution[r.rating - 1]++ })

  return NextResponse.json({
    reviews,
    stats: {
      total: approved.length,
      pending: reviews.filter((r) => r.status === 'pending').length,
      average: Math.round(avgRating * 10) / 10,
      distribution,
    },
  })
}

// POST /api/reviews — submit a new review (public endpoint)
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { storeId, productId, customerName, customerPhone, rating, title, body: reviewBody, imageUrl } = body

  if (!storeId || !productId || !customerName || !rating) {
    return NextResponse.json(
      { error: 'storeId, productId, customerName, and rating are required' },
      { status: 400 }
    )
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
  }

  // Verify product belongs to store (multi-tenant safety)
  const product = await db.product.findFirst({
    where: { id: productId, storeId },
  })
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // Check if customer has purchased this product (verified buyer badge)
  let verified = false
  if (customerPhone) {
    const existingOrder = await db.order.findFirst({
      where: {
        storeId,
        customerPhone,
        items: { some: { productId } },
        status: { in: ['delivered', 'shipped'] },
      },
    })
    verified = !!existingOrder
  }

  const review = await db.productReview.create({
    data: {
      productId,
      storeId,
      customerName,
      customerPhone: customerPhone || null,
      rating: parseInt(rating, 10),
      title: title || null,
      body: reviewBody || null,
      imageUrl: imageUrl || null,
      status: 'pending', // all new reviews start as pending for moderation
      verified,
    },
  })

  return NextResponse.json({ review }, { status: 201 })
}
