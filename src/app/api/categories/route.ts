import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/categories?storeId=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('storeId')

  if (!storeId) {
    return NextResponse.json({ error: 'storeId is required' }, { status: 400 })
  }

  const categories = await db.category.findMany({
    where: { storeId },
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ categories })
}

// POST /api/categories
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { storeId, name, slug, icon } = body
  if (!storeId || !name || !slug) {
    return NextResponse.json({ error: 'storeId, name, slug are required' }, { status: 400 })
  }
  try {
    const category = await db.category.create({ data: { storeId, name, slug, icon } })
    return NextResponse.json({ category }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Slug already exists for this store' }, { status: 400 })
  }
}
