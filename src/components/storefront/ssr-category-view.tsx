'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ProductCard } from './product-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, SlidersHorizontal } from 'lucide-react'
import type { Product } from '@/lib/types'

export function SsrCategoryView({
  products,
  storeSlug,
}: {
  products: Product[]
  storeSlug: string
}) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'newest' | 'low' | 'high'>('newest')

  const sorted = useMemo(() => {
    let list = products
    if (query) {
      const q = query.toLowerCase()
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      )
    }
    if (sort === 'low') return [...list].sort((a, b) => a.price - b.price)
    if (sort === 'high') return [...list].sort((a, b) => b.price - a.price)
    return list
  }, [products, query, sort])

  return (
    <>
      {/* Search + sort row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search within this category…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <Button size="sm" variant={sort === 'newest' ? 'secondary' : 'ghost'} onClick={() => setSort('newest')}>Newest</Button>
          <Button size="sm" variant={sort === 'low' ? 'secondary' : 'ghost'} onClick={() => setSort('low')}>Low → High</Button>
          <Button size="sm" variant={sort === 'high' ? 'secondary' : 'ghost'} onClick={() => setSort('high')}>High → Low</Button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No products match your search.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setQuery('')}>Reset</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {sorted.map((p) => (
            <ProductCard key={p.id} product={p} storeSlug={storeSlug} />
          ))}
        </div>
      )}
    </>
  )
}
