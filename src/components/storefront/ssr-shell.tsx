'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { StorefrontHeader } from './header'
import { StorefrontFooter } from './footer'
import { CartDrawer } from './cart-drawer'
import { CheckoutModal } from './checkout-modal'
import { CookieConsent } from './cookie-consent'
import { AnnouncementBar } from './announcement-bar'
import { MarketingPixels } from './marketing-pixels'
import { ExitIntentPopup, SocialProofToast } from './cro-bundle'
import { useUI } from '@/lib/ui-store'
import type { Store, Category } from '@/lib/types'

type SimplifiedStore = Pick<Store,
  | 'id' | 'name' | 'slug' | 'description' | 'tagline'
  | 'logoUrl' | 'bannerUrl' | 'primaryColor' | 'accentColor' | 'currency'
  | 'ownerName' | 'ownerEmail' | 'ownerPhone' | 'supportPhone' | 'supportEmail' | 'address'
  | 'socialTwitter' | 'socialFacebook' | 'socialInstagram' | 'socialTiktok' | 'socialYoutube'
  | 'socialViber' | 'socialWhatsapp'
  | 'vatRegistered' | 'vatNumber'
  | 'codRiskThreshold' | 'freeShippingThreshold' | 'refundPolicyDays'
  | 'announcementBar' | 'marketingConfig'
> & { categories: Pick<Category, 'id' | 'name' | 'slug' | 'icon'>[] }

export function StorefrontShell({
  store,
  children,
}: {
  store: SimplifiedStore
  children: React.ReactNode
}) {
  const qc = useQueryClient()
  const [ready, setReady] = useState(false)

  // Synchronously populate the react-query cache + UI store so that
  // <StorefrontHeader/>, <StorefrontFooter/>, <CartDrawer/> etc. (which all
  // use `useCurrentStore`) get the store data without an extra API call.
  useEffect(() => {
    qc.setQueryData(['store', store.id], { store })
    useUI.setState({ currentStoreId: store.id, view: 'storefront' })
    setReady(true)
  }, [store.id, qc])

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="animate-pulse text-muted-foreground text-sm">Loading…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AnnouncementBar />
      <StorefrontHeader />
      <main className="flex-1">{children}</main>
      <StorefrontFooter />
      <CartDrawer />
      <CheckoutModal />
      <CookieConsent />
      <MarketingPixels />
      <ExitIntentPopup />
      <SocialProofToast />
    </div>
  )
}
