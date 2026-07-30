'use client'

import { Logo } from '@/components/logo'
import { useUI } from '@/lib/ui-store'
import { useCurrentStore } from '@/lib/use-current-store'
import { NewsletterSignup } from '@/components/storefront/newsletter-signup'
import { buildSocialLinks, SocialIconsRow } from '@/components/storefront/social-links'
import { Mountain, Mail, Phone, MapPin, Github, Shield, FileText, Truck, RotateCcw, Cookie } from 'lucide-react'
import Link from 'next/link'

export function StorefrontFooter() {
  const setStoreSection = useUI((s) => s.setStoreSection)
  const exitToPlatform = useUI((s) => s.exitToPlatform)
  const { store, storeId } = useCurrentStore()

  // Build sanitized social links (handles phone-number format for Viber/WhatsApp)
  const socials = store ? buildSocialLinks(store) : []

  return (
    <footer className="border-t border-border/60 bg-secondary/40 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand + newsletter */}
          <div className="space-y-4 md:col-span-1">
            {store ? (
              <div className="flex items-center gap-2">
                {store.logoUrl ? (
                  <img src={store.logoUrl} alt={store.name} className="h-9 w-9 rounded-lg object-cover" />
                ) : (
                  <div className="h-9 w-9 rounded-lg grid place-items-center" style={{ backgroundColor: store.primaryColor }}>
                    <Mountain className="h-4 w-4 text-white" />
                  </div>
                )}
                <div className="flex flex-col leading-none">
                  <span className="font-bold tracking-tight">{store.name}</span>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">A store on Himal Commerce</span>
                </div>
              </div>
            ) : (
              <Logo size="md" />
            )}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {store?.description || "Nepal's headless commerce platform. Authentic Nepali-made goods, shipped from mountain to your door — anywhere in the country."}
            </p>
            {socials.length > 0 && (
              <SocialIconsRow socials={socials} size="md" className="pt-1" />
            )}
          </div>

          {/* Shop links */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Shop</h4>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li>
                <button onClick={() => setStoreSection('home')} className="hover:text-foreground transition-colors">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => setStoreSection('products')} className="hover:text-foreground transition-colors">
                  All products
                </button>
              </li>
              <li>
                <button onClick={() => setStoreSection('about')} className="hover:text-foreground transition-colors">
                  About us
                </button>
              </li>
              {store && (
                <>
                  <li>
                    <Link href={`/s/${store.slug}/wishlist`} className="hover:text-foreground transition-colors">
                      Wishlist
                    </Link>
                  </li>
                  <li>
                    <Link href={`/s/${store.slug}/orders`} className="hover:text-foreground transition-colors">
                      Find my order
                    </Link>
                  </li>
                  <li>
                    <Link href={`/s/${store.slug}/contact`} className="hover:text-foreground transition-colors">
                      Contact us
                    </Link>
                  </li>
                </>
              )}
              <li>
                <button onClick={() => useUI.setState({ view: 'admin' })} className="hover:text-foreground transition-colors">
                  Store admin
                </button>
              </li>
              <li>
                <button onClick={exitToPlatform} className="hover:text-foreground transition-colors">
                  All stores (platform)
                </button>
              </li>
            </ul>
          </div>

          {/* Legal links (Legal panel P0) */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Legal & policies</h4>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                  <Shield className="h-3 w-3" /> Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                  <FileText className="h-3 w-3" /> Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                  <RotateCcw className="h-3 w-3" /> Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                  <Truck className="h-3 w-3" /> Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                  <Cookie className="h-3 w-3" /> Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  About Himal Commerce
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter + Contact */}
          <div className="space-y-4">
            {storeId && <NewsletterSignup storeId={storeId} />}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Contact</h4>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {store?.supportPhone && (
                  <li className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span>{store.supportPhone}</span>
                  </li>
                )}
                {store?.supportEmail && (
                  <li className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <a href={`mailto:${store.supportEmail}`} className="hover:text-foreground transition-colors">
                      {store.supportEmail}
                    </a>
                  </li>
                )}
                {store?.address && (
                  <li className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{store.address}</span>
                  </li>
                )}
                {!store?.supportPhone && !store?.supportEmail && !store?.address && (
                  <li className="text-xs italic">No contact info set — update in store admin → Settings.</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {store?.name || 'Himal Commerce'}. Made with 🙏 in Kathmandu.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{store?.currency || 'NPR'} · Nepali Rupee</span>
            <span className="flex items-center gap-1">
              <Github className="h-3 w-3" /> Open-source inspired
            </span>
            {store?.vatRegistered && store?.vatNumber && (
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                <Shield className="h-3 w-3" /> VAT: {store.vatNumber}
              </span>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
