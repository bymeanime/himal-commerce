'use client'

import { useQuery } from '@tanstack/react-query'
import { useUI } from '@/lib/ui-store'
import { useCart } from '@/lib/cart-store'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatNPR } from '@/lib/nepal'
import type { Product } from '@/lib/types'
import { Minus, Plus, ShoppingCart, MapPin, Hammer, Package, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export function ProductDetailDrawer() {
  const productId = useUI((s) => s.selectedProductId)
  const setSelectedProductId = useUI((s) => s.setSelectedProductId)
  const openCart = useCart((s) => s.open)
  const add = useCart((s) => s.add)
  const [qty, setQty] = useState(1)

  const { data, isLoading } = useQuery<{ product: Product }>({
    queryKey: ['product', productId],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}`)
      if (!res.ok) throw new Error('not found')
      return res.json()
    },
    enabled: !!productId,
  })

  const product = data?.product

  const handleAdd = () => {
    if (!product) return
    add(product, qty)
    toast.success('Added to cart', { description: `${qty} × ${product.title}` })
    setSelectedProductId(null)
    setQty(1)
    openCart()
  }

  return (
    <Sheet
      open={!!productId}
      onOpenChange={(o) => !o && setSelectedProductId(null)}
    >
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto nice-scroll">
        <SheetClose className="absolute right-4 top-4 z-10 rounded-md opacity-70 ring-offset-background transition-opacity hover:opacity-100">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </SheetClose>

        {isLoading || !product ? (
          <div className="p-8 text-muted-foreground">Loading…</div>
        ) : (
          <>
            <SheetHeader className="space-y-3 text-left">
              <SheetTitle className="sr-only">{product.title}</SheetTitle>
              <SheetDescription className="sr-only">Product details</SheetDescription>
              {product.thumbnail && (
                <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted -mx-1">
                  <img src={product.thumbnail} alt={product.title} className="h-full w-full object-cover" />
                </div>
              )}
            </SheetHeader>

            <div className="px-1 pb-8 space-y-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {product.isHandmade && (
                    <Badge variant="secondary" className="bg-accent text-accent-foreground">
                      <Hammer className="h-3 w-3 mr-1" /> Handmade
                    </Badge>
                  )}
                  {product.origin && (
                    <Badge variant="outline">
                      <MapPin className="h-3 w-3 mr-1" /> {product.origin}
                    </Badge>
                  )}
                  {product.inventory > 0 ? (
                    <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50">
                      <Package className="h-3 w-3 mr-1" /> In stock ({product.inventory})
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Out of stock</Badge>
                  )}
                </div>
                <h2 className="text-2xl font-bold tracking-tight">{product.title}</h2>
                {product.subtitle && (
                  <p className="text-sm text-muted-foreground italic">{product.subtitle}</p>
                )}
              </div>

              <div className="flex items-end gap-3">
                <span className="text-3xl font-bold text-primary">{formatNPR(product.price)}</span>
                {product.compareAt && product.compareAt > product.price && (
                  <span className="text-base text-muted-foreground line-through mb-1">
                    {formatNPR(product.compareAt)}
                  </span>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-semibold mb-2">Description</h3>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              <Separator />

              {/* Quantity + add */}
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-r-none"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    disabled={qty <= 1}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-10 text-center text-sm font-medium">{qty}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-l-none"
                    onClick={() => setQty(Math.min(product.inventory, qty + 1))}
                    disabled={qty >= product.inventory}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Button
                  className="flex-1 h-11"
                  size="lg"
                  onClick={handleAdd}
                  disabled={product.inventory <= 0}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add {qty} to cart · {formatNPR(product.price * qty)}
                </Button>
              </div>

              {product.sku && (
                <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
