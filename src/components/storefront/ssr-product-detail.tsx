'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useCart } from '@/lib/cart-store'
import { useUI } from '@/lib/ui-store'
import { useCurrentStore } from '@/lib/use-current-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatNPR } from '@/lib/nepal'
import { ShareRow } from '@/components/storefront/share-row'
import { ProductReviews } from '@/components/storefront/product-reviews'
import { WishlistButton } from '@/components/storefront/wishlist-button'
import { track, captureUTM } from '@/lib/analytics-client'
import { UrgencyTimer } from '@/components/storefront/cro-bundle'
import type { Product, ProductVariant, ProductReview } from '@/lib/types'
import {
  Minus, Plus, ShoppingCart, MapPin, Hammer, Package, X, Layers,
  RotateCcw, Shield, ChevronRight, Home as HomeIcon, Heart,
} from 'lucide-react'
import { toast } from 'sonner'

type ProductWithRelations = Product & {
  store: { id: string; name: string; slug: string; refundPolicyDays: number }
  category: { name: string; slug: string } | null
  variants: ProductVariant[]
  images: { id: string; url: string; altText: string | null; sortOrder: number }[]
  reviews?: ProductReview[]
}

export function SsrProductDetail({ product }: { product: ProductWithRelations }) {
  const { storeId } = useCurrentStore()
  const openCart = useCart((s) => s.open)
  const add = useCart((s) => s.add)
  const setSelectedProductId = useUI((s) => s.setSelectedProductId)
  const [qty, setQty] = useState(1)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)

  const variants = product.variants ?? []
  const hasVariants = variants.length > 0
  const selectedVariant: ProductVariant | null = useMemo(() => {
    if (!hasVariants) return null
    return variants.find(v => v.id === selectedVariantId) ?? variants[0] ?? null
  }, [variants, selectedVariantId, hasVariants])

  useEffect(() => {
    setQty(1)
    setSelectedVariantId(null)
  }, [product.id])

  useEffect(() => { captureUTM() }, [])

  useEffect(() => {
    if (product && storeId) {
      track('product_view', { storeId, productId: product.id, cartValue: product.price })
    }
  }, [product, storeId])

  const effectivePrice = selectedVariant?.price ?? product.price
  const effectiveInventory = hasVariants
    ? (selectedVariant?.inventory ?? 0)
    : (product.inventory ?? 0)

  const handleAdd = () => {
    if (!product) return
    if (hasVariants && !selectedVariant) {
      toast.error('Please select an option')
      return
    }
    add(product, qty, selectedVariant)
    if (storeId) {
      track('add_to_cart', {
        storeId,
        productId: product.id,
        variantId: selectedVariant?.id,
        cartValue: effectivePrice * qty,
      })
    }
    toast.success('Added to cart', {
      description: selectedVariant
        ? `${qty} × ${product.title} — ${selectedVariant.title}`
        : `${qty} × ${product.title}`,
    })
    setQty(1)
    setSelectedVariantId(null)
    openCart()
  }

  const variantAttrKeys = useMemo(() => {
    const keys = new Set<string>()
    variants.forEach(v => {
      Object.keys(v.attributes ?? {}).forEach(k => keys.add(k))
    })
    return Array.from(keys)
  }, [variants])

  const storeSlug = product.store.slug

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
      {/* Breadcrumbs (SEO) */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground mb-6">
        <Link href={`/s/${storeSlug}`} className="hover:text-foreground flex items-center gap-1">
          <HomeIcon className="h-3 w-3" /> Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/s/${storeSlug}`} className="hover:text-foreground">Shop</Link>
        {product.category && (
          <>
            <ChevronRight className="h-3 w-3" />
            <Link href={`/s/${storeSlug}/c/${product.category.slug}`} className="hover:text-foreground">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground truncate">{product.title}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
        {/* Image gallery */}
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-2xl bg-muted">
            {product.thumbnail ? (
              <img
                src={product.thumbnail}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center text-muted-foreground">
                <Package className="h-16 w-16 opacity-50" />
              </div>
            )}
          </div>
          {product.images && product.images.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img) => (
                <div key={img.id} className="aspect-square overflow-hidden rounded-lg bg-muted">
                  <img
                    src={img.url}
                    alt={img.altText || product.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="space-y-5">
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
                  <Layers className="h-3 w-3 mr-1" /> {variants.length} options
                </Badge>
              ) : effectiveInventory > 0 ? (
                <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50">
                  <Package className="h-3 w-3 mr-1" /> In stock ({effectiveInventory})
                </Badge>
              ) : (
                <Badge variant="destructive">Out of stock</Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{product.title}</h1>
            {product.subtitle && (
              <p className="text-base text-muted-foreground italic">{product.subtitle}</p>
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
                        isSel ? 'border-primary bg-primary/5 ring-1 ring-primary'
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
            </div>
          )}

          <Separator />

          <div>
            <h2 className="text-sm font-semibold mb-2">Description</h2>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {product.specifications && (
            <div>
              <h2 className="text-sm font-semibold mb-2">Specifications</h2>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans bg-secondary/40 p-3 rounded-lg">
                {product.specifications}
              </pre>
            </div>
          )}

          {product.artisanStory && (
            <div>
              <h2 className="text-sm font-semibold mb-2">Artisan story</h2>
              <p className="text-sm text-foreground/80 leading-relaxed italic">
                {product.artisanStory}
              </p>
            </div>
          )}

          <Separator />

          {/* Quantity + add to cart */}
          <div className="flex items-center gap-3">
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
            <WishlistButton
              productId={product.id}
              variantId={selectedVariant?.id}
              size="default"
              className="h-11 w-11"
            />
          </div>

          {product.sku && (
            <p className="text-xs text-muted-foreground">
              SKU: {selectedVariant?.sku || product.sku}
            </p>
          )}

          <Separator />

          {/* Share buttons */}
          <ShareRow
            title={product.title}
            url={`/s/${storeSlug}/p/${product.slug}`}
          />

          {/* Urgency timer — encourages faster checkout (CRO panel) */}
          <UrgencyTimer />

          {/* Trust signals */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="text-center p-2 rounded-md bg-secondary/50">
              <Package className="h-4 w-4 mx-auto text-emerald-600" />
              <p className="text-[10px] text-muted-foreground mt-1">Ships in 24h</p>
            </div>
            <div className="text-center p-2 rounded-md bg-secondary/50">
              <RotateCcw className="h-4 w-4 mx-auto text-blue-600" />
              <p className="text-[10px] text-muted-foreground mt-1">{product.store.refundPolicyDays}-day returns</p>
            </div>
            <div className="text-center p-2 rounded-md bg-secondary/50">
              <Shield className="h-4 w-4 mx-auto text-purple-600" />
              <p className="text-[10px] text-muted-foreground mt-1">Secure checkout</p>
            </div>
          </div>

          {/* Restricted product warning */}
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

          {/* Care guide */}
          {product.careGuide && (
            <div className="rounded-md border border-border p-3 bg-secondary/30">
              <h3 className="text-xs font-semibold mb-1">Care guide</h3>
              <p className="text-xs text-muted-foreground whitespace-pre-line">{product.careGuide}</p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews section — interactive (submit + display) */}
      <ProductReviews
        productId={product.id}
        storeId={product.store.id}
        initialReviews={product.reviews?.filter((r) => r.status === 'approved')}
      />
    </div>
  )
}
