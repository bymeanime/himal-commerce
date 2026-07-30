'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { useWishlist } from '@/lib/wishlist-store'
import { useCurrentStore } from '@/lib/use-current-store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Props = {
  productId: string
  variantId?: string | null
  className?: string
  size?: 'default' | 'sm' | 'icon'
}

export function WishlistButton({ productId, variantId = null, className, size = 'icon' }: Props) {
  const qc = useQueryClient()
  const { storeId } = useCurrentStore()
  const sessionKey = useWishlist((s) => s.sessionKey)
  const productIds = useWishlist((s) => s.productIds)
  const toggle = useWishlist((s) => s.toggle)

  const isInWishlist = productIds.includes(productId)

  const mut = useMutation({
    mutationFn: async () => {
      const url = isInWishlist
        ? `/api/wishlist?storeId=${storeId}&sessionKey=${sessionKey}&productId=${productId}${variantId ? `&variantId=${variantId}` : ''}`
        : '/api/wishlist'
      const method = isInWishlist ? 'DELETE' : 'POST'
      const body = isInWishlist ? undefined : {
        storeId,
        sessionKey,
        productId,
        variantId: variantId || undefined,
      }
      const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onMutate: () => {
      // Optimistic update
      toggle(productId)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wishlist'] })
      toast.success(isInWishlist ? 'Removed from wishlist' : 'Added to wishlist', {
        duration: 2000,
      })
    },
    onError: () => {
      // Revert on error
      toggle(productId)
      toast.error('Failed to update wishlist')
    },
  })

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      className={cn(
        'shrink-0',
        isInWishlist && 'text-rose-600 border-rose-300 bg-rose-50 hover:bg-rose-100 hover:text-rose-700',
        className
      )}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        mut.mutate()
      }}
      disabled={mut.isPending}
      aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={isInWishlist}
    >
      <Heart className={cn('h-4 w-4', isInWishlist && 'fill-current')} />
    </Button>
  )
}
