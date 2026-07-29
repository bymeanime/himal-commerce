import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

type VariantInput = {
  id?: string
  title: string
  sku?: string | null
  price?: number | null
  inventory?: number
  attributes?: Record<string, string>
  sortOrder?: number
  _destroy?: boolean
}

type ImageInput = {
  id?: string
  url: string
  altText?: string | null
  sortOrder?: number
  _destroy?: boolean
}

// GET /api/products/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const product = await db.product.findUnique({
    where: { id },
    include: {
      category: true,
      store: true,
      variants: { orderBy: { sortOrder: 'asc' } },
      images: { orderBy: { sortOrder: 'asc' } },
    },
  })
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  return NextResponse.json({ product })
}

// PUT /api/products/[id] — supports variants[] and images[] with _destroy for delete
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json()

  const data: Record<string, unknown> = {}
  if (body.title !== undefined) data.title = body.title
  if (body.slug !== undefined) data.slug = body.slug || null
  if (body.subtitle !== undefined) data.subtitle = body.subtitle
  if (body.description !== undefined) data.description = body.description
  if (body.thumbnail !== undefined) data.thumbnail = body.thumbnail
  if (body.price !== undefined) data.price = Math.round(Number(body.price) * 100)
  if (body.compareAt !== undefined) data.compareAt = body.compareAt ? Math.round(Number(body.compareAt) * 100) : null
  if (body.sku !== undefined) data.sku = body.sku
  if (body.status !== undefined) data.status = body.status
  if (body.inventory !== undefined) data.inventory = Number(body.inventory)
  if (body.weightGrams !== undefined) data.weightGrams = body.weightGrams ? Number(body.weightGrams) : null
  if (body.origin !== undefined) data.origin = body.origin
  if (body.isHandmade !== undefined) data.isHandmade = Boolean(body.isHandmade)
  if (body.categoryId !== undefined) data.categoryId = body.categoryId || null

  // Variants: diff by id (existing), create (no id), delete (_destroy)
  if (Array.isArray(body.variants)) {
    const incoming = body.variants as VariantInput[]
    const existing = await db.productVariant.findMany({ where: { productId: id }, select: { id: true } })
    const incomingIds = new Set(incoming.filter(v => v.id && !v._destroy).map(v => v.id!))
    const toDelete = existing.filter(e => !incomingIds.has(e.id)).map(e => e.id)
    const toDestroy = incoming.filter(v => v.id && v._destroy).map(v => v.id!)

    // Delete variants that are no longer in the list or explicitly marked
    const allToDelete = Array.from(new Set([...toDelete, ...toDestroy]))
    if (allToDelete.length) {
      await db.productVariant.deleteMany({ where: { id: { in: allToDelete }, productId: id } })
    }

    // Update existing + create new
    data.variants = {
      update: incoming.filter(v => v.id && !v._destroy).map(v => ({
        where: { id: v.id },
        data: {
          title: v.title,
          sku: v.sku ?? null,
          price: v.price != null ? Math.round(Number(v.price) * 100) : null,
          inventory: Number(v.inventory) || 0,
          attributes: v.attributes ?? {},
          sortOrder: v.sortOrder ?? 0,
        },
      })),
      create: incoming.filter(v => !v.id && !v._destroy).map((v, idx) => ({
        title: v.title,
        sku: v.sku ?? null,
        price: v.price != null ? Math.round(Number(v.price) * 100) : null,
        inventory: Number(v.inventory) || 0,
        attributes: v.attributes ?? {},
        sortOrder: v.sortOrder ?? idx,
      })),
    }
  }

  // Images: same diff pattern
  if (Array.isArray(body.images)) {
    const incoming = body.images as ImageInput[]
    const existing = await db.productImage.findMany({ where: { productId: id }, select: { id: true } })
    const incomingIds = new Set(incoming.filter(im => im.id && !im._destroy).map(im => im.id!))
    const toDelete = existing.filter(e => !incomingIds.has(e.id)).map(e => e.id)
    const toDestroy = incoming.filter(im => im.id && im._destroy).map(im => im.id!)

    const allToDelete = Array.from(new Set([...toDelete, ...toDestroy]))
    if (allToDelete.length) {
      await db.productImage.deleteMany({ where: { id: { in: allToDelete }, productId: id } })
    }

    data.images = {
      update: incoming.filter(im => im.id && !im._destroy).map(im => ({
        where: { id: im.id },
        data: {
          url: im.url,
          altText: im.altText ?? null,
          sortOrder: im.sortOrder ?? 0,
        },
      })),
      create: incoming.filter(im => !im.id && !im._destroy).map((im, idx) => ({
        url: im.url,
        altText: im.altText ?? null,
        sortOrder: im.sortOrder ?? idx,
      })),
    }
  }

  const product = await db.product.update({
    where: { id },
    data,
    include: {
      category: true,
      variants: { orderBy: { sortOrder: 'asc' } },
      images: { orderBy: { sortOrder: 'asc' } },
    },
  })
  return NextResponse.json({ product })
}

// DELETE /api/products/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  await db.product.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
