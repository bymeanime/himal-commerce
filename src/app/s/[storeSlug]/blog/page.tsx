import { db } from '@/lib/db'
import type { Metadata } from 'next'
import Link from 'next/link'
import { formatDualDate } from '@/lib/bikram-sambat'

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

export default async function BlogIndexPage({ params }: Params) {
  const { storeSlug } = await params
  const store = await db.store.findUnique({
    where: { slug: storeSlug },
    select: { id: true, name: true },
  })
  if (!store) return null

  const posts = await db.blogPost.findMany({
    where: { storeId: store.id, status: 'published' },
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true, title: true, slug: true, excerpt: true,
      coverImage: true, author: true, publishedAt: true,
      readingMinutes: true, tags: true,
    },
  })

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Stories from {store.name}</h1>
        <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
          Artisan interviews, guides, and behind-the-scenes from across Nepal.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No blog posts yet. Check back soon!</p>
          <Link
            href={`/s/${storeSlug}`}
            className="inline-block mt-4 text-primary underline"
          >
            ← Back to {store.name}
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/s/${storeSlug}/blog/${post.slug}`}
              className="group block overflow-hidden rounded-xl border border-border/60 hover:border-primary/40 hover:shadow-md transition-all"
            >
              {post.coverImage && (
                <div className="aspect-video overflow-hidden bg-muted">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="p-5 space-y-2">
                {post.tags && (
                  <div className="flex flex-wrap gap-1">
                    {JSON.parse(post.tags).slice(0, 2).map((tag: string) => (
                      <span
                        key={tag}
                        className="text-[10px] uppercase tracking-wider text-primary bg-primary/5 px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <h2 className="text-lg font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                )}
                <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                  {post.author && <span>{post.author}</span>}
                  {post.author && post.publishedAt && <span>·</span>}
                  {post.publishedAt && (
                    <span>{formatDualDate(new Date(post.publishedAt))}</span>
                  )}
                  <span>·</span>
                  <span>{post.readingMinutes} min read</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
