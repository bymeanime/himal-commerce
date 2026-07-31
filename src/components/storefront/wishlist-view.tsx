'use client'

import { useState, useEffect } from 'react'
import { useWishlist } from '@/lib/wishlist-store'
import { useQuery } from '@tanstack/react-query'
import { ProductCard } from './product-card'
import { Button } from '@/components/ui/button'
import { Heart, Loader2, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import type { Product } from '@/lib/types'

export function WishlistView({ storeId, storeSlug }: { storeId: string; storeSlug: string }) {
  const productIds = useWishlist((s) => s.productIds)
  const clear = useWishlist((s) => s.clear)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => { setHydrated(true) }, [])

  // Fetch all wishlisted products in a single call
  const { data, isLoading } = useQuery<{ products: Product[] }>({
    queryKey: ['wishlist', storeId, productIds.join(',')],
    queryFn: async () => {
      if (productIds.length === 0) return { products: [] }
      const idsParam = productIds.join(',')
      const res = await fetch(`/api/products?storeId=${storeId}&ids=${encodeURIComponent(idsParam)}`)
      if (!res.ok) return { products: [] }
      return res.json()
    },
    enabled: hydrated && productIds.length > 0,
  })

  const products = data?.products ?? []

  if (!hydrated) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (productIds.length === 0) {
    return (
      <div className="text-center py-20 px-4">
        <div className="h-16 w-16 rounded-full bg-secondary grid place-items-center mx-auto mb-4">
          <Heart className="h-7 w-7 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-1">Your wishlist is empty</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Tap the heart icon on any product to save it here for later. Your wishlist is saved on this device.
        </p>
        <Link href={`/s/${storeSlug}`}>
          <Button>
            <ShoppingBag className="h-4 w-4 mr-2" /> Browse products
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {productIds.length} saved {productIds.length === 1 ? 'item' : 'items'}
        </p>
        <Button variant="outline" size="sm" onClick={() => clear()}>
          Clear all
        </Button>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">Could not load wishlist items. They may have been removed from the store.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => clear()}>Clear wishlist</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} storeSlug={storeSlug} />
          ))}
        </div>
      )}
    </div>
  )
}
