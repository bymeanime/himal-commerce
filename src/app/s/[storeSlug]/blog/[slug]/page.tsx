import { safeJsonLd } from '@/lib/jsonld'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { formatDualDate } from '@/lib/bikram-sambat'
import { ChevronRight, Home as HomeIcon, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

type Params = {
  params: Promise<{ storeSlug: string; slug: string }>
}

// Simple markdown-to-HTML renderer (no external dep)
// SECURITY (QA-010 fix): after rendering, we sanitize dangerous URL schemes
// (javascript:, data:, vbscript:) from href/src attributes. HTML is already
// escaped at the top so raw <script> tags are inert, but markdown link/image
// syntax can still inject dangerous URLs.
function sanitizeUrl(url: string): string {
  const trimmed = url.trim().toLowerCase()
  // Allow http, https, mailto, tel, and relative URLs (/, #, ?)
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('?')
  ) {
    return url
  }
  // Block everything else (javascript:, data:, vbscript:, file:, etc.)
  return '#'
}

function renderMarkdown(md: string): string {
  // Escape HTML
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Code blocks ```
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
    `<pre class="bg-secondary p-4 rounded-lg overflow-x-auto"><code>${code.trim()}</code></pre>`
  )

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold mt-6 mb-2">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mt-8 mb-3">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')

  // Bold and italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')

  // Images — sanitize URL (QA-010)
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (_match, alt, url) => `<img src="${sanitizeUrl(url)}" alt="${alt}" class="rounded-lg w-full my-4" />`
  )

  // Links — sanitize URL (QA-010)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_match, text, url) => `<a href="${sanitizeUrl(url)}" class="text-primary underline hover:opacity-80" target="_blank" rel="noopener noreferrer">${text}</a>`
  )

  // Lists (basic — supports - and *)
  html = html.replace(/(?:^|\n)[-*] (.+)/g, (_match, content) => `<li>${content}</li>`)
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, (m) => `<ul class="list-disc pl-6 my-3 space-y-1">${m}</ul>`)

  // Blockquotes
  html = html.replace(
    /^&gt; (.+)$/gm,
    '<blockquote class="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">$1</blockquote>'
  )

  // Paragraphs (lines not part of other blocks)
  html = html
    .split(/\n\n+/)
    .map((block) => {
      if (block.startsWith('<')) return block
      return `<p class="my-3 leading-relaxed">${block.replace(/\n/g, '<br/>')}</p>`
    })
    .join('\n')

  return html
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { storeSlug, slug } = await params
  const post = await db.blogPost.findFirst({
    where: { slug, store: { slug: storeSlug }, status: 'published' },
    include: { store: { select: { name: true } } },
  })
  if (!post) return { title: 'Post not found' }

  return {
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt ?? post.body.slice(0, 160),
    alternates: { canonical: `/s/${storeSlug}/blog/${slug}` },
    openGraph: {
      type: 'article',
      siteName: post.store.name,
      title: post.title,
      description: post.metaDescription ?? post.excerpt ?? '',
      url: `/s/${storeSlug}/blog/${slug}`,
      ...(post.coverImage && { images: [{ url: post.coverImage }] }),
      ...(post.publishedAt && { publishedTime: post.publishedAt.toISOString() }),
      ...(post.author && { authors: [post.author] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.metaDescription ?? post.excerpt ?? '',
      ...(post.coverImage && { images: [post.coverImage] }),
    },
  }
}

export default async function BlogPostPage({ params }: Params) {
  const { storeSlug, slug } = await params
  const post = await db.blogPost.findFirst({
    where: { slug, store: { slug: storeSlug }, status: 'published' },
    include: { store: { select: { id: true, name: true, slug: true } } },
  })
  if (!post) notFound()

  // Increment view count async
  db.blogPost.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {})

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription ?? post.excerpt,
    image: post.coverImage,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: post.author ? { '@type': 'Person', name: post.author } : undefined,
    publisher: { '@type': 'Organization', name: post.store.name },
    mainEntityOfPage: `/s/${storeSlug}/blog/${slug}`,
  }

  const related = await db.blogPost.findMany({
    where: {
      storeId: post.store.id,
      status: 'published',
      NOT: { id: post.id },
    },
    orderBy: { publishedAt: 'desc' },
    take: 3,
    select: { id: true, title: true, slug: true, coverImage: true, publishedAt: true },
  })

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground mb-8">
        <Link href={`/s/${storeSlug}`} className="hover:text-foreground flex items-center gap-1">
          <HomeIcon className="h-3 w-3" /> Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/s/${storeSlug}/blog`} className="hover:text-foreground">Blog</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground truncate">{post.title}</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        {post.tags && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {JSON.parse(post.tags).map((tag: string) => (
              <span
                key={tag}
                className="text-[10px] uppercase tracking-wider text-primary bg-primary/5 px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-4">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="text-lg text-muted-foreground">{post.excerpt}</p>
        )}
        <div className="flex items-center gap-3 mt-4 text-sm text-muted-foreground">
          {post.author && <span className="font-medium text-foreground">{post.author}</span>}
          {post.publishedAt && (
            <>
              <span>·</span>
              <span>{formatDualDate(new Date(post.publishedAt))}</span>
            </>
          )}
          <span>·</span>
          <span>{post.readingMinutes} min read</span>
        </div>
      </header>

      {/* Cover image */}
      {post.coverImage && (
        <div className="aspect-video overflow-hidden rounded-xl mb-8 bg-muted">
          <img
            src={post.coverImage}
            alt={post.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Body */}
      <div
        className="prose prose-lg dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }}
      />

      {/* Footer */}
      <div className="mt-12 pt-8 border-t">
        <Link href={`/s/${storeSlug}/blog`}>
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> All posts
          </Button>
        </Link>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Read more</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/s/${storeSlug}/blog/${r.slug}`}
                className="group block"
              >
                {r.coverImage && (
                  <div className="aspect-video overflow-hidden rounded-lg bg-muted mb-3">
                    <img
                      src={r.coverImage}
                      alt={r.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <h3 className="font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  {r.title}
                </h3>
                {r.publishedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDualDate(new Date(r.publishedAt))}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  )
}
