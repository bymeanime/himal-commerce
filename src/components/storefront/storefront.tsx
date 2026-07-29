'use client'

import { StorefrontHeader } from './header'
import { Hero } from './hero'
import { ProductGrid } from './product-grid'
import { AboutSection } from './about-section'
import { StorefrontFooter } from './footer'
import { ProductDetailDrawer } from './product-detail-drawer'
import { CartDrawer } from './cart-drawer'
import { CheckoutModal } from './checkout-modal'
import { useUI } from '@/lib/ui-store'
import { useCurrentStore } from '@/lib/use-current-store'
import { Button } from '@/components/ui/button'
import { Mountain, Sparkles, ArrowLeft } from 'lucide-react'

export function Storefront() {
  const section = useUI((s) => s.storeSection)
  const setSection = useUI((s) => s.setStoreSection)
  const exitToPlatform = useUI((s) => s.exitToPlatform)
  const { store, storeId } = useCurrentStore()

  // Safety: if no store selected, bounce to platform
  if (!storeId || !store) {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-6">
        <div className="text-center space-y-3">
          <Mountain className="h-10 w-10 text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">No store selected.</p>
          <Button onClick={exitToPlatform}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to all stores
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StorefrontHeader />
      <main className="flex-1">
        {section === 'home' && (
          <>
            <Hero />
            <ProductGrid />
          </>
        )}
        {section === 'products' && (
          <div className="pt-4">
            <ProductGrid />
          </div>
        )}
        {section === 'about' && (
          <>
            <AboutSection />
            <div className="mx-auto max-w-7xl px-4 py-12 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/30 px-4 py-1.5 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Ready to explore?</span>
              </div>
              <h2 className="text-2xl font-bold mt-4">Discover authentic Nepali craftsmanship.</h2>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                From the looms of Palpa to the forges of Bhojpur — every product has a story.
              </p>
              <Button size="lg" className="mt-6" onClick={() => setSection('products')}>
                <Mountain className="h-4 w-4 mr-1.5" /> Shop the collection
              </Button>
            </div>
          </>
        )}
      </main>
      <StorefrontFooter />

      {/* Floating drawers/modals */}
      <ProductDetailDrawer />
      <CartDrawer />
      <CheckoutModal />
    </div>
  )
}
