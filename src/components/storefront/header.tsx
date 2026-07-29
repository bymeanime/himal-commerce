'use client'

import { ShoppingCart, Mountain, Menu, Search, Phone } from 'lucide-react'
import { useCart } from '@/lib/cart-store'
import { useUI } from '@/lib/ui-store'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useState } from 'react'

export function StorefrontHeader() {
  const cartCount = useCart((s) => s.items.reduce((sum, i) => sum + i.quantity, 0))
  const openCart = useCart((s) => s.open)
  const setView = useUI((s) => s.setView)
  const setStoreSection = useUI((s) => s.setStoreSection)
  const [menuOpen, setMenuOpen] = useState(false)

  const navItems = [
    { id: 'home' as const, label: 'Home' },
    { id: 'products' as const, label: 'Shop All' },
    { id: 'about' as const, label: 'About Himal' },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      {/* Top announcement bar — Nepal-red */}
      <div className="bg-primary text-primary-foreground text-[11px] sm:text-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 gap-4">
          <p className="flex items-center gap-1.5 truncate">
            <Mountain className="h-3 w-3 shrink-0" />
            <span className="truncate">Free shipping inside Kathmandu Valley on orders over रू 5,000</span>
          </p>
          <p className="hidden sm:flex items-center gap-1.5 shrink-0">
            <Phone className="h-3 w-3" />
            <span>+977 1 570 0000</span>
          </p>
        </div>
      </div>

      {/* Main header */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <button onClick={() => { setStoreSection('home'); setView('storefront') }} className="shrink-0">
          <Logo size="md" />
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => setStoreSection(item.id)}
              className="text-foreground/80 hover:text-foreground"
            >
              {item.label}
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex"
            onClick={() => { setView('admin') }}
          >
            Admin Dashboard
          </Button>

          <Button
            variant="default"
            size="icon"
            onClick={openCart}
            className="relative h-9 w-9"
            aria-label={`Cart with ${cartCount} items`}
          >
            <ShoppingCart className="h-4 w-4" />
            {cartCount > 0 && (
              <Badge
                className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 rounded-full bg-accent text-accent-foreground border-2 border-background"
              >
                {cartCount}
              </Badge>
            )}
          </Button>

          {/* Mobile menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden h-9 w-9">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>
                  <Logo size="sm" />
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 px-4 py-4">
                {navItems.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className="justify-start"
                    onClick={() => { setStoreSection(item.id); setMenuOpen(false) }}
                  >
                    {item.label}
                  </Button>
                ))}
                <div className="my-2 border-t" />
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => { setView('admin'); setMenuOpen(false) }}
                >
                  Admin Dashboard
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
