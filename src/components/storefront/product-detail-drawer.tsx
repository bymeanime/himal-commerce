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
import type { Product, ProductVariant } from '@/lib/types'
import { Minus, Plus, ShoppingCart, MapPin, Hammer, Package, X, Layers, RotateCcw, Shield } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { ShareRow } from '@/components/storefront/share-row'
import { track } from '@/lib/analytics-client'
import { captureUTM } from '@/lib/analytics-client'
import { useCurrentStore } from '@/lib/use-current-store'

export function ProductDetailDrawer() {
  const productId = useUI((s) => s.selectedProductId)
  const setSelectedProductId = useUI((s) => s.setSelectedProductId)
  const { storeId } = useCurrentStore()
  const openCart = useCart((s) => s.open)
  const add = useCart((s) => s.add)
  const [qty, setQty] = useState(1)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)

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
  const variants = product?.variants ?? []
  const hasVariants = variants.length > 0
  const selectedVariant: ProductVariant | null = useMemo(() => {
    if (!hasVariants) return null
    return variants.find(v => v.id === selectedVariantId) ?? variants[0] ?? null
  }, [variants, selectedVariantId, hasVariants])

  // Reset selections when product changes
  useEffect(() => {
    setQty(1)
    setSelectedVariantId(null)
  }, [productId])

  // Capture UTM params on first load (Marketing panel)
  useEffect(() => {
    captureUTM()
  }, [])

  // Fire product_view analytics event when drawer opens (Marketing panel P0)
  useEffect(() => {
    if (product && storeId) {
      track('product_view', { storeId, productId: product.id, cartValue: product.price })
    }
  }, [product, storeId])

  // Effective price + inventory for the add-to-cart action
  const effectivePrice = selectedVariant?.price ?? product?.price ?? 0
  const effectiveInventory = hasVariants
    ? (selectedVariant?.inventory ?? 0)
    : (product?.inventory ?? 0)

  const handleAdd = () => {
    if (!product) return
    if (hasVariants && !selectedVariant) {
      toast.error('Please select an option')
      return
    }
    add(product, qty, selectedVariant)
    // Fire add_to_cart analytics event (Marketing panel P0)
    if (storeId) {
      track('add_to_cart', {
        storeId,
        productId: product.id,
        variantId: selectedVariant?.id,
        cartValue: effectivePrice * qty,
      })
    }
    const label = selectedVariant
      ? `${qty} × ${product.title} — ${selectedVariant.title}`
      : `${qty} × ${product.title}`
    toast.success('Added to cart', { description: label })
    setSelectedProductId(null)
    setQty(1)
    setSelectedVariantId(null)
    openCart()
  }

  // Group variants by their primary attribute (size/color/weight) for nicer UI
  // Each variant becomes a button in a single row.
  const variantAttrKeys = useMemo(() => {
    const keys = new Set<string>()
    variants.forEach(v => {
      Object.keys(v.attributes ?? {}).forEach(k => keys.add(k))
    })
    return Array.from(keys)
  }, [variants])

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
                  {hasVariants ? (
                    <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                      <Layers className="h-3 w-3 mr-1" /> {variants.length} option{variants.length === 1 ? '' : 's'}
                    </Badge>
                  ) : effectiveInventory > 0 ? (
                    <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50">
                      <Package className="h-3 w-3 mr-1" /> In stock ({effectiveInventory})
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
                <span className="text-3xl font-bold text-primary">{formatNPR(effectivePrice)}</span>
                {!hasVariants && product.compareAt && product.compareAt > product.price && (
                  <span className="text-base text-muted-foreground line-through mb-1">
                    {formatNPR(product.compareAt)}
                  </span>
                )}
              </div>

              {/* Variant picker */}
              {hasVariants && (
                <div className="space-y-3">
                  {variantAttrKeys.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(selectedVariant?.attributes ?? {}).map(([k, v]) => (
                        <Badge key={k} variant="secondary" className="text-xs">
                          <span className="font-medium text-muted-foreground mr-1">{k}:</span> {v}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {variants.map((v) => {
                      const isSel = v.id === selectedVariant?.id
                      const vPrice = v.price ?? product.price
                      const out = v.inventory <= 0
                      return (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariantId(v.id)}
                          disabled={out}
                          className={`text-left rounded-md border p-2.5 transition-colors ${
                            isSel
                              ? 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'border-border hover:border-primary/40'
                          } ${out ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="text-sm font-medium line-clamp-1">{v.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {formatNPR(vPrice)}
                            {out && <span className="text-destructive ml-1">· out of stock</span>}
                            {!out && v.inventory <= 5 && <span className="text-amber-600 ml-1">· only {v.inventory} left</span>}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  {selectedVariant && (
                    <p className="text-xs text-muted-foreground">
                      <Package className="inline h-3 w-3 mr-1" />
                      {selectedVariant.inventory > 0
                        ? `${selectedVariant.inventory} in stock`
                        : 'Out of stock — choose another option'}
                    </p>
                  )}
                </div>
              )}

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
                    onClick={() => setQty(Math.min(effectiveInventory || 99, qty + 1))}
                    disabled={effectiveInventory > 0 && qty >= effectiveInventory}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Button
                  className="flex-1 h-11"
                  size="lg"
                  onClick={handleAdd}
                  disabled={effectiveInventory <= 0 || (hasVariants && !selectedVariant)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add {qty} to cart · {formatNPR(effectivePrice * qty)}
                </Button>
              </div>

              {product.sku && (
                <p className="text-xs text-muted-foreground">
                  SKU: {selectedVariant?.sku || product.sku}
                </p>
              )}

              <Separator />

              {/* Share buttons (Social panel P1) — Viber + WhatsApp prioritized for Nepal */}
              {typeof window !== 'undefined' && (
                <ShareRow
                  title={product.title}
                  url={product.slug ? `/p/${product.slug}` : `/api/products/${product.id}`}
                />
              )}

              {/* Trust signals (CRO panel P1) */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="text-center p-2 rounded-md bg-secondary/50">
                  <Package className="h-4 w-4 mx-auto text-emerald-600" />
                  <p className="text-[10px] text-muted-foreground mt-1">Ships in 24h</p>
                </div>
                <div className="text-center p-2 rounded-md bg-secondary/50">
                  <RotateCcw className="h-4 w-4 mx-auto text-blue-600" />
                  <p className="text-[10px] text-muted-foreground mt-1">7-day returns</p>
                </div>
                <div className="text-center p-2 rounded-md bg-secondary/50">
                  <Shield className="h-4 w-4 mx-auto text-purple-600" />
                  <p className="text-[10px] text-muted-foreground mt-1">Secure checkout</p>
                </div>
              </div>

              {/* Restricted product warning (Legal panel P1) */}
              {product.restrictedCategory && product.restrictedCategory !== 'none' && (
                <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3">
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                    Age-restricted product · 18+ only
                  </p>
                  {product.healthWarningText && (
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                      {product.healthWarningText}
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
