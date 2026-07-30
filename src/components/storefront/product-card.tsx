'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatNPR } from '@/lib/nepal'
import type { Product } from '@/lib/types'
import { useCart } from '@/lib/cart-store'
import { useUI } from '@/lib/ui-store'
import { useCurrentStore } from '@/lib/use-current-store'
import { MapPin, Hammer, Plus, Layers } from 'lucide-react'
import { toast } from 'sonner'

export function ProductCard({
  product,
  storeSlug,
}: {
  product: Product
  storeSlug?: string
}) {
  const add = useCart((s) => s.add)
  const setSelectedProductId = useUI((s) => s.setSelectedProductId)
  const { store } = useCurrentStore()

  // Prefer explicit prop, fall back to current store's slug
  const slug = storeSlug ?? store?.slug

  const variantCount = product.variants?.length ?? 0
  const hasVariants = variantCount > 0

  // For products with variants, "Add to cart" should open the detail drawer
  // (so the user can pick the variant). For products without, add directly.
  const onAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (hasVariants) {
      if (slug && product.slug) {
        // On SSR routes, navigate to product page instead of drawer
        window.location.href = `/s/${slug}/p/${product.slug}`
      } else {
        setSelectedProductId(product.id)
        toast.info('Choose an option', { description: `${product.title} has ${variantCount} variants` })
      }
    } else {
      add(product, 1, null)
      toast.success('Added to cart', { description: product.title })
    }
  }

  const discount = product.compareAt && product.compareAt > product.price
    ? Math.round((1 - product.price / product.compareAt) * 100)
    : 0

  // Compute price range if variants have different prices
  const variantPrices = (product.variants ?? [])
    .map(v => v.price ?? product.price)
    .filter(p => p > 0)
  const minPrice = variantPrices.length ? Math.min(...variantPrices) : product.price
  const maxPrice = variantPrices.length ? Math.max(...variantPrices) : product.price
  const hasPriceRange = hasVariants && minPrice !== maxPrice

  // Wrap card in Link if we have a slug (SSR mode)
  const cardContent = (
    <Card
      className="group cursor-pointer overflow-hidden border-border/60 hover:border-primary/40 hover:shadow-md transition-all p-0 gap-0 h-full"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-muted-foreground">No image</div>
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isHandmade && (
            <Badge variant="secondary" className="bg-accent text-accent-foreground shadow-sm">
              <Hammer className="h-3 w-3 mr-0.5" /> Handmade
            </Badge>
          )}
          {discount > 0 && (
            <Badge className="bg-primary text-primary-foreground shadow-sm">
              -{discount}%
            </Badge>
          )}
          {hasVariants && (
            <Badge variant="outline" className="bg-background/85 shadow-sm">
              <Layers className="h-3 w-3 mr-0.5" /> {variantCount} option{variantCount === 1 ? '' : 's'}
            </Badge>
          )}
        </div>
        {product.inventory <= 0 && !hasVariants && (
          <div className="absolute inset-0 bg-background/70 grid place-items-center">
            <Badge variant="destructive">Out of stock</Badge>
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        {product.origin && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {product.origin}, Nepal
          </p>
        )}
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
          {product.title}
        </h3>
        {product.subtitle && (
          <p className="text-xs text-muted-foreground line-clamp-1">{product.subtitle}</p>
        )}
        <div className="flex items-center gap-2 pt-1">
          {hasPriceRange ? (
            <span className="font-bold text-primary text-base">
              {formatNPR(minPrice)} – {formatNPR(maxPrice)}
            </span>
          ) : (
            <span className="font-bold text-primary text-base">{formatNPR(minPrice)}</span>
          )}
          {!hasPriceRange && product.compareAt && product.compareAt > product.price && (
            <span className="text-xs text-muted-foreground line-through">
              {formatNPR(product.compareAt)}
            </span>
          )}
        </div>
        <Button
          size="sm"
          className="w-full mt-2"
          variant="outline"
          onClick={onAdd}
          disabled={!hasVariants && product.inventory <= 0}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          {hasVariants ? 'Choose option' : 'Add to cart'}
        </Button>
      </div>
    </Card>
  )

  // In SSR mode (slug available), wrap in Link to product page
  if (slug && product.slug) {
    return (
      <Link href={`/s/${slug}/p/${product.slug}`} className="block h-full">
        {cardContent}
      </Link>
    )
  }

  // SPA mode — clicking the card opens the detail drawer
  return (
    <div onClick={() => setSelectedProductId(product.id)} className="h-full">
      {cardContent}
    </div>
  )
}
