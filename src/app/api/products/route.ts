import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/products?storeId=xxx&category=slug&status=published&q=search
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('storeId')
  const category = searchParams.get('category')
  const status = searchParams.get('status') || 'published'
  const q = searchParams.get('q')

  if (!storeId) {
    return NextResponse.json({ error: 'storeId is required' }, { status: 400 })
  }

  const where: Record<string, unknown> = { storeId }
  if (status && status !== 'all') where.status = status
  if (category && category !== 'all') {
    where.category = { slug: category, storeId }
  }
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { subtitle: { contains: q } },
      { description: { contains: q } },
    ]
  }

  const products = await db.product.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ products })
}

// POST /api/products — create product (storeId in body)
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { storeId, title, subtitle, description, thumbnail, price, compareAt, sku, status, inventory, weightGrams, origin, isHandmade, categoryId } = body

  if (!storeId || !title || !description || price == null) {
    return NextResponse.json({ error: 'storeId, title, description, price are required' }, { status: 400 })
  }

  // Verify category belongs to same store if provided
  if (categoryId) {
    const cat = await db.category.findUnique({ where: { id: categoryId } })
    if (!cat || cat.storeId !== storeId) {
      return NextResponse.json({ error: 'Category does not belong to this store' }, { status: 400 })
    }
  }

  const product = await db.product.create({
    data: {
      storeId,
      title,
      subtitle,
      description,
      thumbnail,
      price: Math.round(Number(price) * 100),
      compareAt: compareAt ? Math.round(Number(compareAt) * 100) : null,
      sku,
      status: status || 'published',
      inventory: Number(inventory) || 0,
      weightGrams: weightGrams ? Number(weightGrams) : null,
      origin,
      isHandmade: Boolean(isHandmade),
      categoryId: categoryId || null,
    },
    include: { category: true },
  })
  return NextResponse.json({ product }, { status: 201 })
}
