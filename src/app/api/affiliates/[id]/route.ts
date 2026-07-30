import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const aff = await db.affiliate.findUnique({ where: { id } })
  if (!aff) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ affiliate: aff })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const aff = await db.affiliate.update({ where: { id }, data: body })
  return NextResponse.json({ affiliate: aff })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db.affiliate.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
