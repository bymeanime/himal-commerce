'use client'

import { ShoppingCart, Mountain, Menu, Search, Phone, ArrowLeft, Store as StoreIcon } from 'lucide-react'
import { useCart } from '@/lib/cart-store'
import { useUI } from '@/lib/ui-store'
import { useCurrentStore } from '@/lib/use-current-store'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Category } from '@/lib/types'

export function StorefrontHeader() {
  const cartCount = useCart((s) => s.items.reduce((sum, i) => sum + i.quantity, 0))
  const openCart = useCart((s) => s.open)
  const setStoreSection = useUI((s) => s.setStoreSection)
  const setSelectedCategorySlug = useUI((s) => s.setSelectedCategorySlug)
  const exitToPlatform = useUI((s) => s.exitToPlatform)
  const { store, storeId } = useCurrentStore()
  const [menuOpen, setMenuOpen] = useState(false)

  // Fetch categories for the nav
  const { data: catData } = useQuery<{ categories: Category[] }>({
    queryKey: ['categories', storeId],
    queryFn: async () => (await fetch(`/api/categories?storeId=${storeId}`)).json(),
    enabled: !!storeId,
  })
  const categories = catData?.categories ?? []

  const navItems = [
    { id: 'home' as const, label: 'Home' },
    { id: 'products' as const, label: 'Shop All' },
    { id: 'about' as const, label: 'About Himal' },
  ]

  const goToCategory = (slug: string) => {
    setSelectedCategorySlug(slug)
    setStoreSection('category')
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      {/* Top announcement bar — store-colored */}
      <div className="bg-primary text-primary-foreground text-[11px] sm:text-xs" style={store ? { backgroundColor: store.primaryColor } : undefined}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 gap-4">
          <p className="flex items-center gap-1.5 truncate">
            <button onClick={exitToPlatform} className="flex items-center gap-1 hover:opacity-80 shrink-0">
              <ArrowLeft className="h-3 w-3" />
              <span>All stores</span>
            </button>
            <span className="text-primary-foreground/40">·</span>
            <span className="truncate">Free shipping inside Kathmandu Valley on orders over रू 5,000</span>
          </p>
          {store?.supportPhone && (
            <p className="hidden sm:flex items-center gap-1.5 shrink-0">
              <Phone className="h-3 w-3" />
              <span>{store.supportPhone}</span>
            </p>
          )}
        </div>
      </div>

      {/* Main header */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3 shrink-0">
          {/* Show store logo + name when in a store, otherwise show platform logo */}
          {store ? (
            <button onClick={() => setStoreSection('home')} className="flex items-center gap-2.5">
              {store.logoUrl ? (
                <img src={store.logoUrl} alt={store.name} className="h-9 w-9 rounded-lg object-cover" />
              ) : (
                <div className="h-9 w-9 rounded-lg grid place-items-center" style={{ backgroundColor: store.primaryColor }}>
                  <StoreIcon className="h-4 w-4 text-white" />
                </div>
              )}
              <div className="flex flex-col leading-none text-left">
                <span className="font-bold tracking-tight text-foreground">{store.name}</span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{store.currency} · Himal Commerce</span>
              </div>
            </button>
          ) : (
            <Logo size="md" />
          )}
        </div>

        {/* Desktop nav — main items + categories dropdown */}
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
          {categories.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-foreground/80 hover:text-foreground">
                  Categories
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {categories.map((c) => (
                  <DropdownMenuItem key={c.id} onClick={() => goToCategory(c.slug)}>
                    {c.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex"
            onClick={() => useUI.setState({ view: 'admin' })}
          >
            Store admin
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
            <SheetContent side="right" className="w-72 overflow-y-auto">
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
                {categories.length > 0 && (
                  <>
                    <div className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      Categories
                    </div>
                    {categories.map((c) => (
                      <Button
                        key={c.id}
                        variant="ghost"
                        size="sm"
                        className="justify-start text-sm text-foreground/70"
                        onClick={() => { goToCategory(c.slug); setMenuOpen(false) }}
                      >
                        {c.name}
                      </Button>
                    ))}
                  </>
                )}
                <div className="my-2 border-t" />
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => { useUI.setState({ view: 'admin' }); setMenuOpen(false) }}
                >
                  Store admin
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => { exitToPlatform(); setMenuOpen(false) }}
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to all stores
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
