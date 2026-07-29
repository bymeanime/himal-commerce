import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/categories
export async function GET() {
  const categories = await db.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ categories })
}

// POST /api/categories
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, slug, icon } = body
  if (!name || !slug) return NextResponse.json({ error: 'name and slug required' }, { status: 400 })
  const category = await db.category.create({ data: { name, slug, icon } })
  return NextResponse.json({ category }, { status: 201 })
}
