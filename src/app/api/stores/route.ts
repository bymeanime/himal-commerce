import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/stores — list all stores
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')

  if (slug) {
    const store = await db.store.findUnique({
      where: { slug },
      include: {
        _count: { select: { products: true, orders: true, customers: true } },
      },
    })
    return NextResponse.json({ store })
  }

  const stores = await db.store.findMany({
    where: { status: 'active' },
    include: {
      _count: { select: { products: true, orders: true, customers: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({ stores })
}

// POST /api/stores — create a new store
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, slug, description, logoUrl, primaryColor, accentColor, currency, ownerName, ownerEmail, ownerPhone } = body

  if (!name || !slug || !ownerName) {
    return NextResponse.json({ error: 'name, slug, and ownerName are required' }, { status: 400 })
  }

  // Check slug uniqueness
  const existing = await db.store.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json({ error: 'Store slug already taken' }, { status: 400 })
  }

  try {
    const store = await db.store.create({
      data: {
        name,
        slug,
        description,
        logoUrl,
        primaryColor: primaryColor || '#9C1A1A',
        accentColor: accentColor || '#E8B547',
        currency: currency || 'NPR',
        ownerName,
        ownerEmail,
        ownerPhone,
        status: 'active',
        plan: 'free',
      },
    })
    return NextResponse.json({ store }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create store' }, { status: 500 })
  }
}
