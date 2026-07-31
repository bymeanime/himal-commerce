import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Public-safe fields only — never expose owner PII, PAN/VAT, business registration,
// document URLs, or any field an attacker could use for phishing/fraud.
// (QA-007 follow-up: the list endpoint was leaking ownerEmail, ownerPhone,
// supportPhone, supportEmail, address even after the [id] route was fixed.)
const PUBLIC_STORE_FIELDS = {
  id: true,
  name: true,
  slug: true,
  description: true,
  tagline: true,
  logoUrl: true,
  bannerUrl: true,
  primaryColor: true,
  accentColor: true,
  currency: true,
  socialTwitter: true,
  socialFacebook: true,
  socialInstagram: true,
  socialTiktok: true,
  socialYoutube: true,
  socialViber: true,
  socialWhatsapp: true,
  refundPolicyDays: true,
  taxInclusiveDisplay: true,
  createdAt: true,
  updatedAt: true,
} as const

// GET /api/stores — list all stores (public-safe field projection)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')

  if (slug) {
    const store = await db.store.findUnique({
      where: { slug },
      select: {
        ...PUBLIC_STORE_FIELDS,
        _count: { select: { products: true, orders: true, customers: true } },
      },
    })
    return NextResponse.json({ store })
  }

  const stores = await db.store.findMany({
    where: { status: 'active' },
    select: {
      ...PUBLIC_STORE_FIELDS,
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
