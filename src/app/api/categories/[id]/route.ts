import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

// GET /api/categories/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const category = await db.category.findUnique({
    where: { id },
    include: {
      _count: { select: { products: true } },
      parent: true,
      children: true,
    },
  })
  if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  return NextResponse.json({ category })
}

// PUT /api/categories/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json()

  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name
  if (body.slug !== undefined) data.slug = body.slug
  if (body.icon !== undefined) data.icon = body.icon || null
  if (body.description !== undefined) data.description = body.description || null
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl || null
  if (body.parentId !== undefined) data.parentId = body.parentId || null
  if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder) || 0

  try {
    const category = await db.category.update({ where: { id }, data })
    return NextResponse.json({ category })
  } catch {
    return NextResponse.json({ error: 'Update failed (slug clash?)' }, { status: 400 })
  }
}

// DELETE /api/categories/[id]
// Behavior: if the category has products, refuse unless `reassignTo` is provided
// (which moves all products to another category) or `force=true` is set (which
// unsets categoryId on all products, leaving them uncategorized).
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const reassignTo = searchParams.get('reassignTo')
  const force = searchParams.get('force') === 'true'

  const category = await db.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  })
  if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

  if (category._count.products > 0) {
    if (reassignTo) {
      // Verify target belongs to same store
      const target = await db.category.findUnique({ where: { id: reassignTo } })
      if (!target || target.storeId !== category.storeId) {
        return NextResponse.json({ error: 'reassignTo category not found in this store' }, { status: 400 })
      }
      await db.product.updateMany({
        where: { categoryId: id },
        data: { categoryId: reassignTo },
      })
    } else if (!force) {
      return NextResponse.json({
        error: `Category has ${category._count.products} product(s). Pass ?reassignTo=<id> or ?force=true to proceed.`,
      }, { status: 409 })
    } else {
      // Force: null out categoryId on all attached products
      await db.product.updateMany({
        where: { categoryId: id },
        data: { categoryId: null },
      })
    }
  }

  await db.category.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
