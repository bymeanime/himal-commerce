'use client'

import { useUI } from '@/lib/ui-store'
import { useCurrentStore } from '@/lib/use-current-store'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Store as StoreIcon,
  Menu,
  X,
  ArrowLeft,
  FolderTree,
  ChevronsUpDown,
  FileText,
  Megaphone,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Store } from '@/lib/types'

type Section = 'dashboard' | 'products' | 'orders' | 'customers' | 'categories' | 'blog' | 'marketing' | 'settings'

const NAV: { id: Section; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'categories', label: 'Categories', icon: FolderTree },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'blog', label: 'Blog', icon: FileText },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const section = useUI((s) => s.adminSection)
  const setSection = useUI((s) => s.setAdminSection)
  const setView = useUI((s) => s.setView)
  const exitToPlatform = useUI((s) => s.exitToPlatform)
  const { store, storeId } = useCurrentStore()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="min-h-screen flex bg-secondary/30">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border/60 bg-sidebar">
        <div className="p-4 border-b border-border/60">
          {/* Store switcher dropdown */}
          <StoreSwitcher current={store} onExit={exitToPlatform} />
          <Badge variant="secondary" className="mt-2 bg-accent/40 text-accent-foreground text-[10px]">
            {store?.plan || 'free'} plan
          </Badge>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                section === item.id
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-border/60 space-y-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setView('storefront')}
          >
            <StoreIcon className="h-3.5 w-3.5 mr-1.5" />
            View storefront
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={exitToPlatform}
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            All stores
          </Button>
        </div>
      </aside>

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur" onClick={() => setMobileNavOpen(false)}>
          <aside
            className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar border-r p-3 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <Logo size="sm" />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMobileNavOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <StoreSwitcher current={store} onExit={exitToPlatform} />
            <nav className="flex-1 space-y-1 mt-3">
              {NAV.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setSection(item.id); setMobileNavOpen(false) }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium',
                    section === item.id
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="space-y-1">
              <Button variant="outline" size="sm" className="w-full" onClick={() => setView('storefront')}>
                <StoreIcon className="h-3.5 w-3.5 mr-1.5" /> View storefront
              </Button>
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => { exitToPlatform(); setMobileNavOpen(false) }}>
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> All stores
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between p-3 border-b border-border/60 bg-background">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setMobileNavOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            {store?.logoUrl ? (
              <img src={store.logoUrl} alt={store.name} className="h-6 w-6 rounded object-cover" />
            ) : null}
            <span className="font-semibold text-sm truncate">{store?.name || 'Admin'}</span>
          </div>
          <Badge variant="secondary" className="bg-accent/40 text-accent-foreground text-[10px]">Admin</Badge>
        </header>

        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}

// Store switcher — lists all stores; click to switch the admin's current store
function StoreSwitcher({ current, onExit }: { current: Store | null; onExit: () => void }) {
  const enterStore = useUI((s) => s.enterStore)
  const [allStores, setAllStores] = useState<Store[] | null>(null)
  const [loading, setLoading] = useState(false)

  const loadStores = async () => {
    if (allStores || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/stores')
      if (res.ok) {
        const data = await res.json()
        setAllStores(data.stores || [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu onOpenChange={(open) => { if (open) loadStores() }}>
      <DropdownMenuTrigger asChild>
        <button
          className="w-full flex items-center gap-2 text-left rounded-md hover:bg-sidebar-accent p-1.5 transition-colors"
          aria-label="Switch store"
        >
          {current?.logoUrl ? (
            <img src={current.logoUrl} alt={current.name} className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <div
              className="h-8 w-8 rounded-lg grid place-items-center"
              style={{ backgroundColor: current?.primaryColor || '#666' }}
            >
              <StoreIcon className="h-4 w-4 text-white" />
            </div>
          )}
          <div className="flex flex-col leading-none min-w-0 flex-1">
            <span className="font-bold tracking-tight text-sm truncate">{current?.name || 'Select store'}</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Store admin</span>
          </div>
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Switch store</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading && <DropdownMenuItem disabled>Loading…</DropdownMenuItem>}
        {allStores?.map((s) => (
          <DropdownMenuItem
            key={s.id}
            onClick={() => enterStore(s.id, 'admin')}
            className={s.id === current?.id ? 'bg-accent/30' : ''}
          >
            {s.logoUrl ? (
              <img src={s.logoUrl} alt="" className="h-5 w-5 rounded object-cover" />
            ) : (
              <div className="h-5 w-5 rounded grid place-items-center" style={{ backgroundColor: s.primaryColor }}>
                <StoreIcon className="h-3 w-3 text-white" />
              </div>
            )}
            <span className="truncate">{s.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onExit}>
          <ArrowLeft className="h-3.5 w-3.5 mr-2" />
          All stores
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
