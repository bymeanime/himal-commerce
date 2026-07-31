import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

// Multi-tenant ownership check (QA-004 fix)
async function verifyOwnership(id: string, storeId: string) {
  const aff = await db.affiliate.findUnique({
    where: { id },
    select: { id: true, storeId: true },
  })
  if (!aff || aff.storeId !== storeId) return null
  return aff
}

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params
  const storeId = new URL(req.url).searchParams.get('storeId')
  if (!storeId) return NextResponse.json({ error: 'storeId is required' }, { status: 400 })
  const owns = await verifyOwnership(id, storeId)
  if (!owns) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const aff = await db.affiliate.findUnique({ where: { id } })
  if (!aff) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ affiliate: aff })
}

// Allowlist of mutable fields. storeId, clicks, conversions, revenue,
// commissionEarned, totalPaidOut, createdAt are NOT mutable by client.
const ALLOWED_FIELDS = ['name', 'email', 'code', 'commissionRateBps', 'status'] as const

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json()
  const { storeId, ...rest } = body

  if (!storeId) return NextResponse.json({ error: 'storeId is required for authorization' }, { status: 400 })
  const owns = await verifyOwnership(id, storeId)
  if (!owns) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const before = await db.affiliate.findUnique({ where: { id } })

  const data: Record<string, unknown> = {}
  for (const key of ALLOWED_FIELDS) {
    if (rest[key] !== undefined) data[key] = rest[key]
  }

  // Validate
  if (data.commissionRateBps !== undefined) {
    const bps = Number(data.commissionRateBps)
    if (!Number.isFinite(bps) || bps < 0 || bps > 10000) {
      return NextResponse.json({ error: 'commissionRateBps must be 0-10000 (0-100%)' }, { status: 400 })
    }
    data.commissionRateBps = Math.round(bps)
  }
  if (data.status && !['active', 'paused', 'paid_out'].includes(data.status as string)) {
    return NextResponse.json({ error: 'status must be active | paused | paid_out' }, { status: 400 })
  }

  // Code uniqueness within store
  if (typeof data.code === 'string' && data.code !== before?.code) {
    const existing = await db.affiliate.findUnique({
      where: { storeId_code: { storeId, code: data.code } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Affiliate code already exists in this store' }, { status: 409 })
    }
  }

  const aff = await db.affiliate.update({ where: { id }, data })

  await logAudit({
    storeId,
    actorKind: 'user',
    action: 'affiliate.update',
    entityType: 'affiliate',
    entityId: id,
    before: { name: before?.name, code: before?.code, status: before?.status },
    after: { name: aff.name, code: aff.code, status: aff.status },
  })

  return NextResponse.json({ affiliate: aff })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params
  const storeId = new URL(req.url).searchParams.get('storeId')
  if (!storeId) return NextResponse.json({ error: 'storeId is required for authorization' }, { status: 400 })
  const owns = await verifyOwnership(id, storeId)
  if (!owns) return NextResponse.json({ error: 'not found' }, { status: 404 })

  await db.affiliate.delete({ where: { id } })

  await logAudit({
    storeId,
    actorKind: 'user',
    action: 'affiliate.delete',
    entityType: 'affiliate',
    entityId: id,
  })

  return NextResponse.json({ ok: true })
}
