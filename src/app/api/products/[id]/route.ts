import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

// GET /api/products/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const product = await db.product.findUnique({
    where: { id },
    include: { category: true, store: true },
  })
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  return NextResponse.json({ product })
}

// PUT /api/products/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json()

  const data: Record<string, unknown> = {}
  if (body.title !== undefined) data.title = body.title
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

  const product = await db.product.update({
    where: { id },
    data,
    include: { category: true },
  })
  return NextResponse.json({ product })
}

// DELETE /api/products/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  await db.product.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
