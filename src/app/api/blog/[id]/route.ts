import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

// Multi-tenant ownership check (QA-003 fix) — every method must verify the post
// belongs to the caller's storeId before reading or mutating it.
async function verifyBlogOwnership(id: string, storeId: string) {
  const post = await db.blogPost.findUnique({
    where: { id },
    select: { id: true, storeId: true },
  })
  if (!post || post.storeId !== storeId) return null
  return post
}

export async function GET(
  req: NextRequest,
  { params }: Params
) {
  const { id } = await params
  const storeId = new URL(req.url).searchParams.get('storeId')
  if (!storeId) {
    return NextResponse.json({ error: 'storeId is required' }, { status: 400 })
  }
  const owns = await verifyBlogOwnership(id, storeId)
  if (!owns) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const post = await db.blogPost.findUnique({
    where: { id },
    include: { store: { select: { id: true, name: true, slug: true } } },
  })
  if (!post) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ post })
}

// Allowlist of fields the client may mutate (QA-003 fix — was `data: body` mass-assign).
// storeId, createdAt, updatedAt, viewCount are NOT in this list and cannot be overwritten.
const ALLOWED_FIELDS = [
  'title', 'slug', 'excerpt', 'body', 'coverImage', 'author', 'tags',
  'metaTitle', 'metaDescription', 'status', 'publishedAt',
] as const

export async function PUT(
  req: NextRequest,
  { params }: Params
) {
  const { id } = await params
  const body = await req.json()
  const { storeId, ...rest } = body

  if (!storeId) {
    return NextResponse.json({ error: 'storeId is required for authorization' }, { status: 400 })
  }
  const owns = await verifyBlogOwnership(id, storeId)
  if (!owns) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const before = await db.blogPost.findUnique({ where: { id } })

  // Build a safe data object — only allowlisted fields, ignore everything else
  const data: Record<string, unknown> = {}
  for (const key of ALLOWED_FIELDS) {
    if (rest[key] !== undefined) data[key] = rest[key]
  }

  // If transitioning to published, set publishedAt (only once)
  if (data.status === 'published') {
    if (!before?.publishedAt) data.publishedAt = new Date()
  }

  // Auto-compute reading time when body changes
  if (typeof data.body === 'string') {
    data.readingMinutes = Math.max(1, Math.ceil(data.body.split(/\s+/).length / 200))
  }

  // Slug uniqueness check within store (defensive — Prisma would throw P2002 otherwise)
  if (typeof data.slug === 'string' && data.slug !== before?.slug) {
    const existing = await db.blogPost.findUnique({
      where: { storeId_slug: { storeId, slug: data.slug } },
    })
    if (existing) {
      return NextResponse.json({ error: 'A post with that slug already exists in this store' }, { status: 409 })
    }
  }

  const post = await db.blogPost.update({ where: { id }, data })

  await logAudit({
    storeId,
    actorKind: 'user',
    action: 'blogPost.update',
    entityType: 'blogPost',
    entityId: id,
    before: { title: before?.title, status: before?.status },
    after: { title: post.title, status: post.status },
  })

  return NextResponse.json({ post })
}

export async function DELETE(
  req: NextRequest,
  { params }: Params
) {
  const { id } = await params
  const storeId = new URL(req.url).searchParams.get('storeId')
  if (!storeId) {
    return NextResponse.json({ error: 'storeId is required for authorization' }, { status: 400 })
  }
  const owns = await verifyBlogOwnership(id, storeId)
  if (!owns) return NextResponse.json({ error: 'not found' }, { status: 404 })

  await db.blogPost.delete({ where: { id } })

  await logAudit({
    storeId,
    actorKind: 'user',
    action: 'blogPost.delete',
    entityType: 'blogPost',
    entityId: id,
  })

  return NextResponse.json({ ok: true })
}
