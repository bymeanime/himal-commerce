import { safeJsonLd } from '@/lib/jsonld'
import { db } from '@/lib/db'
import type { Metadata } from 'next'
import Link from 'next/link'
import { formatDualDate } from '@/lib/bikram-sambat'
import { BlogExplorer } from '@/components/storefront/blog-explorer'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ storeSlug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { storeSlug } = await params
  const store = await db.store.findUnique({ where: { slug: storeSlug }, select: { name: true } })
  return {
    title: `Blog · ${store?.name ?? 'Store'}`,
    description: 'Stories, guides, and behind-the-scenes from Nepal.',
    alternates: { canonical: `/s/${storeSlug}/blog` },
  }
}

export default async function BlogIndexPage({ params, searchParams }: Params & { searchParams: Promise<{ q?: string; tag?: string }> }) {
  const { storeSlug } = await params
  const sp = await searchParams
  const store = await db.store.findUnique({
    where: { slug: storeSlug },
    select: { id: true, name: true },
  })
  if (!store) return null

  const query = (sp.q || '').trim().toLowerCase()
  const activeTag = (sp.tag || '').trim()

  // Build where clause for search + tag filter
  const where: Record<string, unknown> = { storeId: store.id, status: 'published' }
  if (activeTag) {
    // SQLite doesn't support array contains; we filter in JS below
  }

  let posts = await db.blogPost.findMany({
    where,
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true, title: true, slug: true, excerpt: true,
      coverImage: true, author: true, publishedAt: true,
      readingMinutes: true, tags: true,
    },
  })

  // Parse tags and apply tag + text filters in JS (works for both SQLite + Postgres)
  const allTags = new Set<string>()
  posts.forEach((p) => {
    if (p.tags) {
      try {
        const tags = JSON.parse(p.tags) as string[]
        if (Array.isArray(tags)) tags.forEach((t) => allTags.add(t))
      } catch {
        // ignore malformed tags
      }
    }
  })

  if (activeTag) {
    posts = posts.filter((p) => {
      if (!p.tags) return false
      try {
        const tags = JSON.parse(p.tags) as string[]
        return Array.isArray(tags) && tags.includes(activeTag)
      } catch {
        return false
      }
    })
  }

  if (query) {
    posts = posts.filter((p) =>
      p.title.toLowerCase().includes(query) ||
      (p.excerpt || '').toLowerCase().includes(query)
    )
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${store.name} Blog`,
    url: `/s/${storeSlug}/blog`,
    blogPost: posts.slice(0, 10).map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: `/s/${storeSlug}/blog/${p.slug}`,
      ...(p.coverImage && { image: p.coverImage }),
      ...(p.author && { author: { '@type': 'Person', name: p.author } }),
      ...(p.publishedAt && { datePublished: p.publishedAt.toISOString() }),
    })),
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Stories from {store.name}</h1>
        <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
          Artisan interviews, guides, and behind-the-scenes from across Nepal.
        </p>
      </div>

      <BlogExplorer
        storeSlug={storeSlug}
        posts={posts.map((p) => ({
          ...p,
          tags: p.tags ? ((() => { try { return JSON.parse(p.tags) as string[] } catch { return [] } })()) : [],
          publishedAt: p.publishedAt?.toISOString() || null,
        }))}
        allTags={Array.from(allTags).sort()}
        initialQuery={query}
        initialTag={activeTag}
      />

      {posts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-muted-foreground">
            {query || activeTag
              ? 'No posts match your search. Try a different query or tag.'
              : 'No blog posts yet. Check back soon!'}
          </p>
          <Link
            href={`/s/${storeSlug}/blog`}
            className="inline-block mt-4 text-primary underline"
          >
            Clear filters
          </Link>
        </div>
      )}
    </div>
  )
}
