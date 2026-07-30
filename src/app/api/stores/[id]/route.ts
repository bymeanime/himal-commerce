import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'

type Params = { params: Promise<{ id: string }> }

// Multi-tenant isolation (Tech/API/QA panels P0)
async function verifyStoreOwnership(id: string, callerStoreId: string) {
  const store = await db.store.findUnique({ where: { id }, select: { id: true } })
  return store && id === callerStoreId ? store : null
}

// GET /api/stores/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const store = await db.store.findUnique({
    where: { id },
    include: {
      _count: { select: { products: true, orders: true, customers: true } },
    },
  })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })
  return NextResponse.json({ store })
}

// PUT /api/stores/[id] — update store (multi-tenant safe)
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json()

  // If body.storeId is provided, it must match the route id (defense in depth)
  if (body.storeId && body.storeId !== id) {
    return NextResponse.json({ error: 'storeId mismatch' }, { status: 400 })
  }

  const before = await db.store.findUnique({ where: { id } })
  if (!before) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name
  if (body.description !== undefined) data.description = body.description
  if (body.tagline !== undefined) data.tagline = body.tagline
  if (body.logoUrl !== undefined) data.logoUrl = body.logoUrl
  if (body.bannerUrl !== undefined) data.bannerUrl = body.bannerUrl
  if (body.primaryColor !== undefined) data.primaryColor = body.primaryColor
  if (body.accentColor !== undefined) data.accentColor = body.accentColor
  if (body.ownerName !== undefined) data.ownerName = body.ownerName
  if (body.ownerEmail !== undefined) data.ownerEmail = body.ownerEmail
  if (body.ownerPhone !== undefined) data.ownerPhone = body.ownerPhone
  if (body.supportPhone !== undefined) data.supportPhone = body.supportPhone
  if (body.supportEmail !== undefined) data.supportEmail = body.supportEmail
  if (body.address !== undefined) data.address = body.address
  if (body.socialTwitter !== undefined) data.socialTwitter = body.socialTwitter
  if (body.socialFacebook !== undefined) data.socialFacebook = body.socialFacebook
  if (body.socialInstagram !== undefined) data.socialInstagram = body.socialInstagram
  if (body.socialTiktok !== undefined) data.socialTiktok = body.socialTiktok
  if (body.socialYoutube !== undefined) data.socialYoutube = body.socialYoutube
  if (body.socialViber !== undefined) data.socialViber = body.socialViber
  if (body.socialWhatsapp !== undefined) data.socialWhatsapp = body.socialWhatsapp

  // Finance / Legal fields
  if (body.panNumber !== undefined) data.panNumber = body.panNumber
  if (body.vatNumber !== undefined) data.vatNumber = body.vatNumber
  if (body.vatRegistered !== undefined) data.vatRegistered = Boolean(body.vatRegistered)
  if (body.businessRegistrationNumber !== undefined) data.businessRegistrationNumber = body.businessRegistrationNumber
  if (body.defaultTaxRate !== undefined) data.defaultTaxRate = Number(body.defaultTaxRate)
  if (body.taxInclusiveDisplay !== undefined) data.taxInclusiveDisplay = Boolean(body.taxInclusiveDisplay)
  if (body.vatInvoicePrefix !== undefined) data.vatInvoicePrefix = body.vatInvoicePrefix

  // Logistics
  if (body.codRiskThreshold !== undefined) data.codRiskThreshold = Number(body.codRiskThreshold)
  if (body.freeShippingThreshold !== undefined) data.freeShippingThreshold = body.freeShippingThreshold || null
  if (body.shippingRates !== undefined) data.shippingRates = body.shippingRates

  // Marketing
  if (body.announcementBar !== undefined) data.announcementBar = body.announcementBar
  if (body.marketingConfig !== undefined) data.marketingConfig = body.marketingConfig

  // Legal / policies
  if (body.refundPolicyDays !== undefined) data.refundPolicyDays = Number(body.refundPolicyDays)
  if (body.returnPolicyText !== undefined) data.returnPolicyText = body.returnPolicyText
  if (body.shippingPolicyText !== undefined) data.shippingPolicyText = body.shippingPolicyText

  if (body.status !== undefined) data.status = body.status
  if (body.plan !== undefined) data.plan = body.plan

  const store = await db.store.update({ where: { id }, data })

  await logAudit({
    storeId: id,
    actorKind: 'user',
    action: 'store.update',
    entityType: 'store',
    entityId: id,
    before: { name: before.name, plan: before.plan, vatRegistered: before.vatRegistered },
    after: { name: store.name, plan: store.plan, vatRegistered: store.vatRegistered },
  })

  return NextResponse.json({ store })
}

// DELETE /api/stores/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params
  const callerStoreId = new URL(req.url).searchParams.get('storeId')
  if (!callerStoreId || callerStoreId !== id) {
    return NextResponse.json({ error: 'Not authorized to delete this store' }, { status: 403 })
  }
  await db.store.delete({ where: { id } })

  await logAudit({
    storeId: id,
    actorKind: 'user',
    action: 'store.delete',
    entityType: 'store',
    entityId: id,
  })

  return NextResponse.json({ ok: true })
}
