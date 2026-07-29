'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatNPR } from '@/lib/nepal'
import type { Product } from '@/lib/types'
import { useCart } from '@/lib/cart-store'
import { useUI } from '@/lib/ui-store'
import { ShoppingCart, MapPin, Hammer, Plus } from 'lucide-react'
import { toast } from 'sonner'

export function ProductCard({ product }: { product: Product }) {
  const add = useCart((s) => s.add)
  const setSelectedProductId = useUI((s) => s.setSelectedProductId)

  const onAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    add(product, 1)
    toast.success('Added to cart', { description: product.title })
  }

  const discount = product.compareAt && product.compareAt > product.price
    ? Math.round((1 - product.price / product.compareAt) * 100)
    : 0

  return (
    <Card
      className="group cursor-pointer overflow-hidden border-border/60 hover:border-primary/40 hover:shadow-md transition-all p-0 gap-0"
      onClick={() => setSelectedProductId(product.id)}
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
        </div>
        {product.inventory <= 0 && (
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
          <span className="font-bold text-primary text-base">{formatNPR(product.price)}</span>
          {product.compareAt && product.compareAt > product.price && (
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
          disabled={product.inventory <= 0}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add to cart
        </Button>
      </div>
    </Card>
  )
}
