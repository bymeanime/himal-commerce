import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyStoreAccess } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('storeId')
  const status = searchParams.get('status') // for admin filtering
  if (!storeId) return NextResponse.json({ error: 'storeId required' }, { status: 400 })

  const posts = await db.blogPost.findMany({
    where: {
      storeId,
      ...(status && status !== 'all' ? { status } : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, title: true, slug: true, excerpt: true, coverImage: true,
      author: true, status: true, publishedAt: true, viewCount: true,
      readingMinutes: true, createdAt: true,
    },
  })
  return NextResponse.json({ posts })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { storeId, ...data } = body
  if (!storeId) return NextResponse.json({ error: 'storeId required' }, { status: 400 })

  const access = await verifyStoreAccess(storeId)
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 })

  // Auto-generate slug if not provided
  if (!data.slug) {
    data.slug = data.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80)
  }

  // Auto-compute reading time if not provided
  if (!data.readingMinutes && data.body) {
    data.readingMinutes = Math.max(1, Math.ceil(data.body.split(/\s+/).length / 200))
  }

  // If status is published, set publishedAt if not already
  if (data.status === 'published' && !data.publishedAt) {
    data.publishedAt = new Date()
  }

  const post = await db.blogPost.create({
    data: { ...data, storeId },
  })
  return NextResponse.json({ post }, { status: 201 })
}
