'use client'

import { Logo } from '@/components/logo'
import { useUI } from '@/lib/ui-store'
import { useCurrentStore } from '@/lib/use-current-store'
import { NewsletterSignup } from '@/components/storefront/newsletter-signup'
import { Mountain, Mail, Phone, MapPin, Github, Facebook, Instagram, Twitter, Youtube, Shield, FileText, Truck, RotateCcw, Cookie } from 'lucide-react'
import Link from 'next/link'

// TikTok doesn't have a lucide icon — use a simple SVG
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  )
}

function ViberIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M11.4 0C6.62 0 2.85 3.04 2.85 6.78v3.42c0 .94.21 1.84.6 2.66L2.4 16.2l3.46-1.06c.78.42 1.65.72 2.58.86.34 1.65 1.94 2.94 3.86 2.94.6 0 1.18-.13 1.69-.36.95.65 2.18 1.04 3.5 1.04 1.6 0 3.04-.59 4.04-1.54V6.78C21.53 3.04 16.18 0 11.4 0z"/>
    </svg>
  )
}

function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  )
}

export function StorefrontFooter() {
  const setStoreSection = useUI((s) => s.setStoreSection)
  const exitToPlatform = useUI((s) => s.exitToPlatform)
  const { store, storeId } = useCurrentStore()

  // Filter to only non-empty social links — include Viber + WhatsApp (Nepal)
  const socials = store ? ([
    { url: store.socialFacebook, Icon: Facebook, label: 'Facebook' },
    { url: store.socialInstagram, Icon: Instagram, label: 'Instagram' },
    { url: store.socialTiktok, Icon: TikTokIcon, label: 'TikTok' },
    { url: store.socialYoutube, Icon: Youtube, label: 'YouTube' },
    { url: store.socialTwitter, Icon: Twitter, label: 'X' },
    { url: store.socialViber, Icon: ViberIcon, label: 'Viber' },
    { url: store.socialWhatsapp, Icon: WhatsappIcon, label: 'WhatsApp' },
  ]).filter(s => s.url) : []

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
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {socials.map(({ url, Icon, label }) => {
                  // Sanitize URL — only allow http(s), drop javascript: etc (Security panel)
                  const safeHref = url && /^https?:\/\//.test(url) ? url : '#'
                  return (
                    <a
                      key={label}
                      href={safeHref}
                      target="_blank"
                      rel="noopener noreferrer ugc nofollow"
                      aria-label={label}
                      className="h-8 w-8 rounded-full grid place-items-center border border-border/60 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </a>
                  )
                })}
              </div>
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
