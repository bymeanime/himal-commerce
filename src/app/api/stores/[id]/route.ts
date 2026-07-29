import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

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

// PUT /api/stores/[id] — update store
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name
  if (body.description !== undefined) data.description = body.description
  if (body.logoUrl !== undefined) data.logoUrl = body.logoUrl
  if (body.primaryColor !== undefined) data.primaryColor = body.primaryColor
  if (body.accentColor !== undefined) data.accentColor = body.accentColor
  if (body.ownerName !== undefined) data.ownerName = body.ownerName
  if (body.ownerEmail !== undefined) data.ownerEmail = body.ownerEmail
  if (body.ownerPhone !== undefined) data.ownerPhone = body.ownerPhone
  if (body.status !== undefined) data.status = body.status
  if (body.plan !== undefined) data.plan = body.plan

  const store = await db.store.update({ where: { id }, data })
  return NextResponse.json({ store })
}

// DELETE /api/stores/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  await db.store.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
