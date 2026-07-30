import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/wishlist?storeId=...&sessionKey=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('storeId')
  const sessionKey = searchParams.get('sessionKey')

  if (!storeId || !sessionKey) {
    return NextResponse.json({ error: 'storeId and sessionKey are required' }, { status: 400 })
  }

  const items = await db.wishlist.findMany({
    where: { storeId, sessionKey },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          price: true,
          compareAt: true,
          status: true,
          inventory: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ items })
}

// POST /api/wishlist — add to wishlist
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { storeId, sessionKey, productId, variantId } = body

  if (!storeId || !sessionKey || !productId) {
    return NextResponse.json(
      { error: 'storeId, sessionKey, and productId are required' },
      { status: 400 }
    )
  }

  // Verify product belongs to store
  const product = await db.product.findFirst({ where: { id: productId, storeId } })
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // Upsert (ignore if already in wishlist)
  const existing = await db.wishlist.findFirst({
    where: { storeId, sessionKey, productId, variantId: variantId || null },
  })
  if (existing) {
    return NextResponse.json({ item: existing, alreadyInWishlist: true })
  }

  const item = await db.wishlist.create({
    data: {
      storeId,
      sessionKey,
      productId,
      variantId: variantId || null,
    },
  })

  return NextResponse.json({ item, alreadyInWishlist: false }, { status: 201 })
}

// DELETE /api/wishlist — remove from wishlist
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('storeId')
  const sessionKey = searchParams.get('sessionKey')
  const productId = searchParams.get('productId')
  const variantId = searchParams.get('variantId')

  if (!storeId || !sessionKey || !productId) {
    return NextResponse.json(
      { error: 'storeId, sessionKey, and productId are required' },
      { status: 400 }
    )
  }

  await db.wishlist.deleteMany({
    where: {
      storeId,
      sessionKey,
      productId,
      variantId: variantId || null,
    },
  })

  return NextResponse.json({ success: true })
}
