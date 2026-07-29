'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ProductCard } from './product-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, SlidersHorizontal, Leaf, Shirt, Hammer, Gem, Home, Book, Package } from 'lucide-react'
import type { Product, Category } from '@/lib/types'
import { useCurrentStore } from '@/lib/use-current-store'

const CAT_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  shirt: Shirt,
  hammer: Hammer,
  leaf: Leaf,
  gem: Gem,
  home: Home,
  book: Book,
  package: Package,
}

export function ProductGrid() {
  const { storeId } = useCurrentStore()
  const [category, setCategory] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'newest' | 'low' | 'high'>('newest')

  const { data: productsData, isLoading: loadingProducts } = useQuery<{ products: Product[] }>({
    queryKey: ['products', 'storefront', storeId, category, query],
    queryFn: async () => {
      const params = new URLSearchParams({ status: 'published', storeId: storeId! })
      if (category !== 'all') params.set('category', category)
      if (query) params.set('q', query)
      const res = await fetch(`/api/products?${params}`)
      return res.json()
    },
    enabled: !!storeId,
  })

  const { data: catData } = useQuery<{ categories: (Category & { _count?: { products: number } })[] }>({
    queryKey: ['categories', storeId],
    queryFn: async () => {
      const res = await fetch(`/api/categories?storeId=${storeId}`)
      return res.json()
    },
    enabled: !!storeId,
  })

  const sorted = useMemo(() => {
    const list = productsData?.products ?? []
    if (sort === 'low') return [...list].sort((a, b) => a.price - b.price)
    if (sort === 'high') return [...list].sort((a, b) => b.price - a.price)
    return list
  }, [productsData, sort])

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:py-14">
      <div className="space-y-2 mb-8">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Shop the collection
        </h2>
        <p className="text-muted-foreground">
          Every piece is sourced directly from Nepali artisans. Filter by category, sort by price, search by name.
        </p>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <Button
          size="sm"
          variant={category === 'all' ? 'default' : 'outline'}
          onClick={() => setCategory('all')}
        >
          All products
        </Button>
        {(catData?.categories ?? []).map((c) => {
          const Icon = CAT_ICON[c.icon || ''] ?? Leaf
          return (
            <Button
              key={c.id}
              size="sm"
              variant={category === c.slug ? 'default' : 'outline'}
              onClick={() => setCategory(c.slug)}
            >
              <Icon className="h-3.5 w-3.5 mr-1.5" />
              {c.name}
            </Button>
          )
        })}
      </div>

      {/* Search + sort row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for pashmina, khukuri, tea…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <Button size="sm" variant={sort === 'newest' ? 'secondary' : 'ghost'} onClick={() => setSort('newest')}>
            Newest
          </Button>
          <Button size="sm" variant={sort === 'low' ? 'secondary' : 'ghost'} onClick={() => setSort('low')}>
            Price: Low → High
          </Button>
          <Button size="sm" variant={sort === 'high' ? 'secondary' : 'ghost'} onClick={() => setSort('high')}>
            Price: High → Low
          </Button>
        </div>
      </div>

      {/* Grid */}
      {loadingProducts || !storeId ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No products match your search.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => { setQuery(''); setCategory('all') }}>
            Reset filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {sorted.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  )
}
