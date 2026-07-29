import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Generate a URL-safe slug from a title, ensuring uniqueness within a store
async function generateProductSlug(title: string, storeId: string, excludeId?: string): Promise<string> {
  const base = title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'product'
  let slug = base
  let i = 1
  while (true) {
    const existing = await db.product.findFirst({
      where: { storeId, slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    })
    if (!existing) return slug
    slug = `${base}-${++i}`
  }
}

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
    include: { category: true, variants: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ products })
}

// POST /api/products — create product (storeId in body)
// Supports variants[] and images[] (both optional)
type VariantInput = {
  title: string
  sku?: string | null
  price?: number | null
  inventory?: number
  attributes?: Record<string, string>
  sortOrder?: number
}

type ImageInput = {
  url: string
  altText?: string | null
  sortOrder?: number
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    storeId, title, subtitle, description, thumbnail, price, compareAt,
    sku, status, inventory, weightGrams, origin, isHandmade, categoryId,
    slug, variants, images,
  } = body

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

  // Resolve slug: explicit > generated
  const finalSlug = slug ? String(slug) : await generateProductSlug(title, storeId)
  // Ensure uniqueness if user supplied a slug
  const slugClash = await db.product.findFirst({ where: { storeId, slug: finalSlug }, select: { id: true } })
  if (slugClash) {
    return NextResponse.json({ error: 'Slug already in use in this store' }, { status: 400 })
  }

  const product = await db.product.create({
    data: {
      storeId,
      title,
      slug: finalSlug,
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
      variants: Array.isArray(variants) && variants.length
        ? { create: (variants as VariantInput[]).map((v, i) => ({
            title: v.title,
            sku: v.sku ?? null,
            price: v.price != null ? Math.round(Number(v.price) * 100) : null,
            inventory: Number(v.inventory) || 0,
            attributes: v.attributes ?? {},
            sortOrder: v.sortOrder ?? i,
          })) }
        : undefined,
      images: Array.isArray(images) && images.length
        ? { create: (images as ImageInput[]).map((im, i) => ({
            url: im.url,
            altText: im.altText ?? null,
            sortOrder: im.sortOrder ?? i,
          })) }
        : undefined,
    },
    include: {
      category: true,
      variants: { orderBy: { sortOrder: 'asc' } },
      images: { orderBy: { sortOrder: 'asc' } },
    },
  })
  return NextResponse.json({ product }, { status: 201 })
}
