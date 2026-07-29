'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ProductCard } from './product-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, SlidersHorizontal, ChevronRight, ArrowLeft } from 'lucide-react'
import type { Product, Category } from '@/lib/types'
import { useCurrentStore } from '@/lib/use-current-store'
import { useUI } from '@/lib/ui-store'

export function CategoryView() {
  const { storeId } = useCurrentStore()
  const slug = useUI((s) => s.selectedCategorySlug)
  const setStoreSection = useUI((s) => s.setStoreSection)
  const setSelectedCategorySlug = useUI((s) => s.setSelectedCategorySlug)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'newest' | 'low' | 'high'>('newest')

  // Fetch all categories (for breadcrumb + sibling category pills)
  const { data: catData } = useQuery<{ categories: (Category & { _count?: { products: number } })[] }>({
    queryKey: ['categories', storeId],
    queryFn: async () => (await fetch(`/api/categories?storeId=${storeId}`)).json(),
    enabled: !!storeId,
  })
  const categories = catData?.categories ?? []
  const current = categories.find((c) => c.slug === slug) ?? null

  // Fetch products in this category
  const { data: productsData, isLoading } = useQuery<{ products: Product[] }>({
    queryKey: ['products', 'category', storeId, slug, query],
    queryFn: async () => {
      const params = new URLSearchParams({ status: 'published', storeId: storeId!, category: slug! })
      if (query) params.set('q', query)
      const res = await fetch(`/api/products?${params}`)
      return res.json()
    },
    enabled: !!storeId && !!slug,
  })

  const sorted = useMemo(() => {
    const list = productsData?.products ?? []
    if (sort === 'low') return [...list].sort((a, b) => a.price - b.price)
    if (sort === 'high') return [...list].sort((a, b) => b.price - a.price)
    return list
  }, [productsData, sort])

  if (!slug || !current) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <p className="text-muted-foreground">No category selected.</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => setStoreSection('products')}>
          Browse all products
        </Button>
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
        <button onClick={() => setStoreSection('home')} className="hover:text-foreground transition-colors">
          Home
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <button onClick={() => setStoreSection('products')} className="hover:text-foreground transition-colors">
          Shop
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{current.name}</span>
      </nav>

      {/* Category hero (image + name + description) */}
      <div className="mb-8">
        {current.imageUrl && (
          <div className="relative -mx-4 mb-6 h-44 md:h-56 md:rounded-xl overflow-hidden">
            <img src={current.imageUrl} alt={current.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <h1 className="text-2xl md:text-4xl font-bold tracking-tight">{current.name}</h1>
              {current.description && (
                <p className="text-sm md:text-base text-white/85 mt-1 max-w-2xl">
                  {current.description}
                </p>
              )}
            </div>
          </div>
        )}
        {!current.imageUrl && (
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{current.name}</h1>
            {current.description && (
              <p className="text-muted-foreground mt-2 max-w-2xl">{current.description}</p>
            )}
          </div>
        )}
      </div>

      {/* Sibling categories — quick switcher */}
      {categories.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
          {categories.map((c) => (
            <Button
              key={c.id}
              size="sm"
              variant={c.slug === slug ? 'default' : 'outline'}
              onClick={() => setSelectedCategorySlug(c.slug)}
            >
              {c.name}
              <span className="ml-1.5 text-[10px] opacity-60">({c._count?.products ?? 0})</span>
            </Button>
          ))}
        </div>
      )}

      {/* Search + sort row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search in ${current.name}…`}
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
            Low → High
          </Button>
          <Button size="sm" variant={sort === 'high' ? 'secondary' : 'ghost'} onClick={() => setSort('high')}>
            High → Low
          </Button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No products in {current.name} yet.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setStoreSection('products')}>
            Browse all products
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
