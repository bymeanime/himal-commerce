import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'

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

// Helper — multi-tenant isolation check (Tech/API/QA panels P0).
// Every [id] route must verify the entity belongs to the requesting store.
async function verifyOwnership(productId: string, storeId: string) {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { storeId: true },
  })
  if (!product) return null
  if (product.storeId !== storeId) return null  // 404 — don't leak existence
  return product
}

// GET /api/products/[id]?storeId=...
// storeId is MANDATORY — without it the route 400s. (QA-002 regression fix.)
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params
  const storeId = new URL(req.url).searchParams.get('storeId')
  if (!storeId) {
    return NextResponse.json({ error: 'storeId is required for authorization' }, { status: 400 })
  }
  const owns = await verifyOwnership(id, storeId)
  if (!owns) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  const product = await db.product.findUnique({
    where: { id },
    include: {
      category: true,
      store: { select: { id: true, name: true, slug: true, currency: true, primaryColor: true, accentColor: true } },
      variants: { orderBy: { sortOrder: 'asc' } },
      images: { orderBy: { sortOrder: 'asc' } },
      reviews: { where: { status: 'approved' }, orderBy: { createdAt: 'desc' }, take: 10 },
    },
  })
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  return NextResponse.json({ product })
}

// PUT /api/products/[id] — supports variants[] and images[] with _destroy for delete
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json()
  const storeId = body.storeId
  if (!storeId) {
    return NextResponse.json({ error: 'storeId is required for authorization' }, { status: 400 })
  }
  const owns = await verifyOwnership(id, storeId)
  if (!owns) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const before = await db.product.findUnique({ where: { id }, include: { variants: true } })

  const data: Record<string, unknown> = {}
  if (body.title !== undefined) data.title = body.title
  if (body.slug !== undefined) data.slug = body.slug || null
  if (body.subtitle !== undefined) data.subtitle = body.subtitle
  if (body.description !== undefined) data.description = body.description
  if (body.thumbnail !== undefined) data.thumbnail = body.thumbnail
  if (body.price !== undefined) data.price = Math.round(Number(body.price) * 100)
  if (body.compareAt !== undefined) data.compareAt = body.compareAt ? Math.round(Number(body.compareAt) * 100) : null
  if (body.sku !== undefined) data.sku = body.sku
  if (body.gtin !== undefined) data.gtin = body.gtin || null
  if (body.barcode !== undefined) data.barcode = body.barcode || null
  if (body.status !== undefined) data.status = body.status
  if (body.inventory !== undefined) data.inventory = Number(body.inventory)
  if (body.weightGrams !== undefined) data.weightGrams = body.weightGrams ? Number(body.weightGrams) : null
  if (body.lengthMm !== undefined) data.lengthMm = body.lengthMm ? Number(body.lengthMm) : null
  if (body.widthMm !== undefined) data.widthMm = body.widthMm ? Number(body.widthMm) : null
  if (body.heightMm !== undefined) data.heightMm = body.heightMm ? Number(body.heightMm) : null
  if (body.origin !== undefined) data.origin = body.origin
  if (body.isHandmade !== undefined) data.isHandmade = Boolean(body.isHandmade)
  if (body.categoryId !== undefined) data.categoryId = body.categoryId || null
  if (body.lowStockThreshold !== undefined) data.lowStockThreshold = Number(body.lowStockThreshold) || 5
  if (body.specifications !== undefined) data.specifications = body.specifications || null
  if (body.artisanStory !== undefined) data.artisanStory = body.artisanStory || null
  if (body.careGuide !== undefined) data.careGuide = body.careGuide || null
  if (body.restrictedCategory !== undefined) data.restrictedCategory = body.restrictedCategory
  if (body.ageRestricted !== undefined) data.ageRestricted = Boolean(body.ageRestricted)
  if (body.minAge !== undefined) data.minAge = Number(body.minAge) || 0
  if (body.healthWarningText !== undefined) data.healthWarningText = body.healthWarningText || null

  // Variants: diff by id (existing), create (no id), delete (_destroy)
  if (Array.isArray(body.variants)) {
    const incoming = body.variants as VariantInput[]
    const existing = await db.productVariant.findMany({ where: { productId: id }, select: { id: true } })
    const incomingIds = new Set(incoming.filter(v => v.id && !v._destroy).map(v => v.id!))
    const toDelete = existing.filter(e => !incomingIds.has(e.id)).map(e => e.id)
    const toDestroy = incoming.filter(v => v.id && v._destroy).map(v => v.id!)

    const allToDelete = Array.from(new Set([...toDelete, ...toDestroy]))
    if (allToDelete.length) {
      await db.productVariant.deleteMany({ where: { id: { in: allToDelete }, productId: id } })
    }

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

  await logAudit({
    storeId,
    actorKind: 'user',
    action: 'product.update',
    entityType: 'product',
    entityId: id,
    before: before ? { title: before.title, price: before.price, inventory: before.inventory } : null,
    after: { title: product.title, price: product.price, inventory: product.inventory },
  })

  return NextResponse.json({ product })
}

// DELETE /api/products/[id]?storeId=...
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params
  const storeId = new URL(req.url).searchParams.get('storeId')
  if (!storeId) {
    return NextResponse.json({ error: 'storeId is required for authorization' }, { status: 400 })
  }
  const owns = await verifyOwnership(id, storeId)
  if (!owns) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  await db.product.delete({ where: { id } })

  await logAudit({
    storeId,
    actorKind: 'user',
    action: 'product.delete',
    entityType: 'product',
    entityId: id,
  })

  return NextResponse.json({ ok: true })
}
