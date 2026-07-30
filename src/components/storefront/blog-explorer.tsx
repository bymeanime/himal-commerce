'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatDualDate } from '@/lib/bikram-sambat'
import { Search, X, Tag } from 'lucide-react'

type Post = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
  author: string | null
  publishedAt: string | null
  readingMinutes: number
  tags: string[]
}

type Props = {
  storeSlug: string
  posts: Post[]
  allTags: string[]
  initialQuery: string
  initialTag: string
}

export function BlogExplorer({ storeSlug, posts, allTags, initialQuery, initialTag }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialQuery)

  const updateUrl = (updates: { q?: string; tag?: string }) => {
    const params = new URLSearchParams(searchParams.toString())
    if (updates.q !== undefined) {
      if (updates.q) params.set('q', updates.q)
      else params.delete('q')
    }
    if (updates.tag !== undefined) {
      if (updates.tag) params.set('tag', updates.tag)
      else params.delete('tag')
    }
    router.push(`/s/${storeSlug}/blog?${params.toString()}`, { scroll: false })
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return posts
    return posts.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      (p.excerpt || '').toLowerCase().includes(q)
    )
  }, [posts, query])

  return (
    <>
      {/* Search + tag filter */}
      <div className="mb-8 space-y-4">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              updateUrl({ q: e.target.value })
            }}
            placeholder="Search posts…"
            className="pl-9"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); updateUrl({ q: '' }) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
            {initialTag && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => updateUrl({ tag: '' })}
              >
                All posts
              </Button>
            )}
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => updateUrl({ tag: tag === initialTag ? '' : tag })}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  tag === initialTag
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-primary/5 border-border'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Posts grid */}
      {filtered.length > 0 && (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => (
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
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {post.tags.slice(0, 2).map((tag) => (
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
    </>
  )
}
