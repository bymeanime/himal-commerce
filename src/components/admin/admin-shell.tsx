'use client'

import { useUI } from '@/lib/ui-store'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Store,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

type Section = 'dashboard' | 'products' | 'orders' | 'customers' | 'settings'

const NAV: { id: Section; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const section = useUI((s) => s.adminSection)
  const setSection = useUI((s) => s.setAdminSection)
  const setView = useUI((s) => s.setView)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="min-h-screen flex bg-secondary/30">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border/60 bg-sidebar">
        <div className="p-4 border-b border-border/60">
          <Logo size="sm" />
          <Badge variant="secondary" className="mt-2 bg-accent/40 text-accent-foreground text-[10px]">
            Admin Dashboard
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
        <div className="p-3 border-t border-border/60">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setView('storefront')}
          >
            <Store className="h-3.5 w-3.5 mr-1.5" />
            View storefront
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
            <nav className="flex-1 space-y-1">
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
            <Button variant="outline" size="sm" className="w-full" onClick={() => setView('storefront')}>
              <Store className="h-3.5 w-3.5 mr-1.5" /> View storefront
            </Button>
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
          <Logo size="sm" showText={false} />
          <Badge variant="secondary" className="bg-accent/40 text-accent-foreground text-[10px]">Admin</Badge>
        </header>

        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
