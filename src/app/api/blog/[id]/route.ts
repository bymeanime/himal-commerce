import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const post = await db.blogPost.findUnique({
    where: { id },
    include: { store: { select: { id: true, name: true, slug: true } } },
  })
  if (!post) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ post })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()

  // If transitioning to published, set publishedAt
  if (body.status === 'published') {
    const existing = await db.blogPost.findUnique({ where: { id }, select: { publishedAt: true } })
    if (!existing?.publishedAt) {
      body.publishedAt = new Date()
    }
  }

  // Auto-compute reading time when body changes
  if (body.body) {
    body.readingMinutes = Math.max(1, Math.ceil(body.body.split(/\s+/).length / 200))
  }

  const post = await db.blogPost.update({
    where: { id },
    data: body,
  })
  return NextResponse.json({ post })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db.blogPost.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
