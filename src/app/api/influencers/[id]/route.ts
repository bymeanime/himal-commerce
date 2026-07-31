import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

// Multi-tenant ownership check (QA-004 fix)
async function verifyOwnership(id: string, storeId: string) {
  const inf = await db.influencer.findUnique({
    where: { id },
    select: { id: true, storeId: true },
  })
  if (!inf || inf.storeId !== storeId) return null
  return inf
}

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params
  const storeId = new URL(req.url).searchParams.get('storeId')
  if (!storeId) return NextResponse.json({ error: 'storeId is required' }, { status: 400 })
  const owns = await verifyOwnership(id, storeId)
  if (!owns) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const inf = await db.influencer.findUnique({ where: { id } })
  if (!inf) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ influencer: inf })
}

// Allowlist of mutable fields. storeId, conversions, revenue, commissionEarned,
// totalPaidOut, createdAt are NOT in this list — they're system-managed.
const ALLOWED_FIELDS = [
  'name', 'handle', 'email', 'phone', 'code', 'commissionType',
  'commissionValue', 'status',
] as const

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json()
  const { storeId, ...rest } = body

  if (!storeId) return NextResponse.json({ error: 'storeId is required for authorization' }, { status: 400 })
  const owns = await verifyOwnership(id, storeId)
  if (!owns) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const before = await db.influencer.findUnique({ where: { id } })

  const data: Record<string, unknown> = {}
  for (const key of ALLOWED_FIELDS) {
    if (rest[key] !== undefined) data[key] = rest[key]
  }

  // Validate enums
  if (data.commissionType && !['percent', 'fixed'].includes(data.commissionType as string)) {
    return NextResponse.json({ error: 'commissionType must be "percent" or "fixed"' }, { status: 400 })
  }
  if (data.status && !['active', 'paused', 'paid_out'].includes(data.status as string)) {
    return NextResponse.json({ error: 'status must be active | paused | paid_out' }, { status: 400 })
  }

  // Code uniqueness within store (if changing code)
  if (typeof data.code === 'string' && data.code !== before?.code) {
    const existing = await db.influencer.findUnique({
      where: { storeId_code: { storeId, code: data.code } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Influencer code already exists in this store' }, { status: 409 })
    }
  }

  const inf = await db.influencer.update({ where: { id }, data })

  await logAudit({
    storeId,
    actorKind: 'user',
    action: 'influencer.update',
    entityType: 'influencer',
    entityId: id,
    before: { name: before?.name, code: before?.code, status: before?.status },
    after: { name: inf.name, code: inf.code, status: inf.status },
  })

  return NextResponse.json({ influencer: inf })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params
  const storeId = new URL(req.url).searchParams.get('storeId')
  if (!storeId) return NextResponse.json({ error: 'storeId is required for authorization' }, { status: 400 })
  const owns = await verifyOwnership(id, storeId)
  if (!owns) return NextResponse.json({ error: 'not found' }, { status: 404 })

  await db.influencer.delete({ where: { id } })

  await logAudit({
    storeId,
    actorKind: 'user',
    action: 'influencer.delete',
    entityType: 'influencer',
    entityId: id,
  })

  return NextResponse.json({ ok: true })
}
