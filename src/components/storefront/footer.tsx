'use client'

import { Logo } from '@/components/logo'
import { useUI } from '@/lib/ui-store'
import { useCurrentStore } from '@/lib/use-current-store'
import { Mountain, Mail, Phone, MapPin, Github, Facebook, Instagram, Twitter, Youtube } from 'lucide-react'

// TikTok doesn't have a lucide icon — use a simple SVG
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  )
}

export function StorefrontFooter() {
  const setStoreSection = useUI((s) => s.setStoreSection)
  const exitToPlatform = useUI((s) => s.exitToPlatform)
  const { store } = useCurrentStore()

  // Filter to only non-empty social links
  const socials = store ? ([
    { url: store.socialFacebook, Icon: Facebook, label: 'Facebook' },
    { url: store.socialInstagram, Icon: Instagram, label: 'Instagram' },
    { url: store.socialTiktok, Icon: TikTokIcon, label: 'TikTok' },
    { url: store.socialYoutube, Icon: Youtube, label: 'YouTube' },
    { url: store.socialTwitter, Icon: Twitter, label: 'Twitter' },
  ]).filter(s => s.url) : []

  return (
    <footer className="border-t border-border/60 bg-secondary/40 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-3 md:col-span-2">
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
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              {store?.description || "Nepal's headless commerce platform. Authentic Nepali-made goods, shipped from mountain to your door — anywhere in the country."}
            </p>
            {socials.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                {socials.map(({ url, Icon, label }) => (
                  <a
                    key={label}
                    href={url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="h-8 w-8 rounded-full grid place-items-center border border-border/60 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            )}
          </div>

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

        <div className="mt-10 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {store?.name || 'Himal Commerce'}. Made with 🙏 in Kathmandu.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{store?.currency || 'NPR'} · Nepali Rupee</span>
            <span className="flex items-center gap-1">
              <Github className="h-3 w-3" /> Open-source inspired
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
