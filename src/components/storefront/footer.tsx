'use client'

import { Logo } from '@/components/logo'
import { useUI } from '@/lib/ui-store'
import { Mountain, Mail, Phone, MapPin, Github } from 'lucide-react'

export function StorefrontFooter() {
  const setStoreSection = useUI((s) => s.setStoreSection)
  const setView = useUI((s) => s.setView)

  return (
    <footer className="border-t border-border/60 bg-secondary/40 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-3 md:col-span-2">
            <Logo size="md" />
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Nepal&apos;s headless commerce platform. Authentic Nepali-made goods, shipped from
              mountain to your door — anywhere in the country.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mountain className="h-3.5 w-3.5 text-primary" />
              <span>Inspired by Medusa · Built for Nepal</span>
            </div>
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
                <button onClick={() => setView('admin')} className="hover:text-foreground transition-colors">
                  Admin dashboard
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Contact</h4>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" />
                <span>+977 1 570 0000</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                <span>namaste@himalcommerce.np</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>Putali Sadak, Kathmandu 44600, Nepal</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Himal Commerce. Made with 🙏 in Kathmandu.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>NPR · Nepali Rupee</span>
            <span className="flex items-center gap-1">
              <Github className="h-3 w-3" /> Open-source inspired
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
