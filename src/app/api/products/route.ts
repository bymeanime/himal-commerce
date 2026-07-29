import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/products — list products, optional ?category=slug&status=published
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const status = searchParams.get('status') || 'published'
  const q = searchParams.get('q')

  const where: Record<string, unknown> = {}
  if (status && status !== 'all') where.status = status
  if (category && category !== 'all') {
    where.category = { slug: category }
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

// POST /api/products — create product
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, subtitle, description, thumbnail, price, compareAt, sku, barcode, status, inventory, weightGrams, origin, isHandmade, categoryId } = body

  if (!title || !description || price == null) {
    return NextResponse.json({ error: 'Missing required fields: title, description, price' }, { status: 400 })
  }

  const product = await db.product.create({
    data: {
      title,
      subtitle,
      description,
      thumbnail,
      price: Math.round(Number(price) * 100), // NPR to paisa
      compareAt: compareAt ? Math.round(Number(compareAt) * 100) : null,
      sku,
      barcode,
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
