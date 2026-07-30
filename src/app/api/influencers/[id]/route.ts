import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const inf = await db.influencer.findUnique({ where: { id } })
  if (!inf) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ influencer: inf })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const inf = await db.influencer.update({ where: { id }, data: body })
  return NextResponse.json({ influencer: inf })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db.influencer.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
