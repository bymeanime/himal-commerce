import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'

type Params = { params: Promise<{ id: string }> }

// Multi-tenant isolation (Tech/API/QA panels P0)
async function verifyCategoryOwnership(categoryId: string, storeId: string) {
  const cat = await db.category.findUnique({ where: { id: categoryId }, select: { storeId: true } })
  if (!cat || cat.storeId !== storeId) return null
  return cat
}

// GET /api/categories/[id]?storeId=...
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params
  const storeId = new URL(req.url).searchParams.get('storeId')
  if (storeId) {
    const owns = await verifyCategoryOwnership(id, storeId)
    if (!owns) return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  }
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

// PUT /api/categories/[id]?storeId=...
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json()
  const storeId = body.storeId
  if (!storeId) {
    return NextResponse.json({ error: 'storeId is required for authorization' }, { status: 400 })
  }
  const owns = await verifyCategoryOwnership(id, storeId)
  if (!owns) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name
  if (body.slug !== undefined) data.slug = body.slug
  if (body.icon !== undefined) data.icon = body.icon || null
  if (body.description !== undefined) data.description = body.description || null
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl || null
  if (body.editorialMd !== undefined) data.editorialMd = body.editorialMd || null
  if (body.parentId !== undefined) data.parentId = body.parentId || null
  if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder) || 0

  try {
    const category = await db.category.update({ where: { id }, data })
    await logAudit({
      storeId,
      actorKind: 'user',
      action: 'category.update',
      entityType: 'category',
      entityId: id,
    })
    return NextResponse.json({ category })
  } catch {
    return NextResponse.json({ error: 'Update failed (slug clash?)' }, { status: 400 })
  }
}

// DELETE /api/categories/[id]?storeId=...&reassignTo=...&force=true
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('storeId')
  const reassignTo = searchParams.get('reassignTo')
  const force = searchParams.get('force') === 'true'

  if (!storeId) {
    return NextResponse.json({ error: 'storeId is required for authorization' }, { status: 400 })
  }
  const owns = await verifyCategoryOwnership(id, storeId)
  if (!owns) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

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
      await db.product.updateMany({
        where: { categoryId: id },
        data: { categoryId: null },
      })
    }
  }

  await db.category.delete({ where: { id } })

  await logAudit({
    storeId,
    actorKind: 'user',
    action: 'category.delete',
    entityType: 'category',
    entityId: id,
  })

  return NextResponse.json({ ok: true })
}
