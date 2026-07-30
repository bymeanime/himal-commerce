'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search as SearchIcon } from 'lucide-react'
import type { Product } from '@/lib/types'
import { ProductCard } from './product-card'

export function SsrSearchResults({
  query,
  results,
  storeSlug,
}: {
  query: string
  results: Product[]
  storeSlug: string
}) {
  const router = useRouter()
  const [q, setQ] = useState(query)

  useEffect(() => setQ(query), [query])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim()) {
      router.push(`/s/${storeSlug}/search?q=${encodeURIComponent(q.trim())}`)
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mb-8">
        <div className="relative max-w-2xl">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for pashmina, khukuri, tea…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 h-11"
            autoFocus
          />
        </div>
        <Button type="submit" className="mt-3" disabled={!q.trim()}>Search</Button>
      </form>

      {query && results.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No products found for "{query}".</p>
          <p className="text-xs text-muted-foreground mt-2">
            Try different keywords, or browse{' '}
            <a href={`/s/${storeSlug}`} className="underline">all products</a>.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} storeSlug={storeSlug} />
          ))}
        </div>
      )}
    </>
  )
}
