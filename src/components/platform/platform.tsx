'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Logo } from '@/components/logo'
import { useUI } from '@/lib/ui-store'
import { formatNPR } from '@/lib/nepal'
import type { Store } from '@/lib/types'
import {
  Mountain,
  Plus,
  Store as StoreIcon,
  ArrowRight,
  Settings2,
  TrendingUp,
  Package,
  Users,
  ShoppingCart,
  Sparkles,
  LayoutGrid,
  Wallet,
  Truck,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'

type StoreRow = Store & {
  productCount: number
  orderCount: number
  customerCount: number
  revenue: number
}

type PlatformStats = {
  totals: { stores: number; orders: number; products: number; customers: number; revenue: number }
  stores: StoreRow[]
}

export function Platform() {
  const enterStore = useUI((s) => s.enterStore)
  const [createOpen, setCreateOpen] = useState(false)

  const { data, isLoading } = useQuery<PlatformStats>({
    queryKey: ['stats', 'platform'],
    queryFn: async () => {
      // Pass platformKey if NEXT_PUBLIC_PLATFORM_ADMIN_KEY is configured (QA-006 fix).
      // When unset, the API returns 403 and we show the per-store list only.
      const key = process.env.NEXT_PUBLIC_PLATFORM_ADMIN_KEY
      const url = key
        ? `/api/stats?platform=true&platformKey=${encodeURIComponent(key)}`
        : '/api/stats?platform=true'
      const res = await fetch(url)
      if (!res.ok) return null
      return res.json()
    },
  })

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/85 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => useUI.setState({ platformSection: 'stores' })}>
              <LayoutGrid className="h-3.5 w-3.5 mr-1.5" /> All stores
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Create store
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="absolute inset-0 himal-pattern" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" aria-hidden="true" />

          <div className="relative mx-auto max-w-7xl px-4 py-14 md:py-20">
            <div className="max-w-3xl space-y-5">
              <Badge variant="outline" className="border-accent bg-accent/30 text-accent-foreground">
                <Mountain className="h-3 w-3 mr-1" /> The Medusa of Nepal
              </Badge>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
                One platform.
                <span className="block text-primary">Many stores.</span>
                <span className="block text-muted-foreground text-3xl sm:text-4xl md:text-5xl mt-1">Built for Nepal.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                Himal Commerce is a multi-tenant headless commerce engine. Spin up a new store in
                seconds — each store gets its own catalog, orders, customers, branding, and admin.
                Built Nepali-first: NPR pricing, eSewa &amp; Khalti, COD, all 77 districts.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="h-12 px-6 text-base" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-1.5" /> Create your store
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-6 text-base" onClick={() => useUI.setState({ platformSection: 'stores' })}>
                  Browse stores <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Platform stats */}
        <section className="mx-auto max-w-7xl px-4 py-10 md:py-14 space-y-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Platform overview</h2>
            <p className="text-sm text-muted-foreground mt-1">
              All stores on the platform, aggregated. Click any store to enter its storefront or admin.
            </p>
          </div>

          {isLoading || !data ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  { label: 'Stores', value: String(data.totals.stores), icon: StoreIcon },
                  { label: 'Products', value: String(data.totals.products), icon: Package },
                  { label: 'Orders', value: String(data.totals.orders), icon: ShoppingCart },
                  { label: 'Customers', value: String(data.totals.customers), icon: Users },
                  { label: 'Revenue', value: formatNPR(data.totals.revenue), icon: TrendingUp },
                ].map((c) => (
                  <Card key={c.label} className="border-border/60">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{c.label}</span>
                        <div className="h-7 w-7 rounded-lg bg-primary/10 grid place-items-center">
                          <c.icon className="h-3.5 w-3.5 text-primary" />
                        </div>
                      </div>
                      <p className="text-xl md:text-2xl font-bold mt-2 tracking-tight">{c.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Store grid */}
              <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">All stores on the platform</h3>
                  <span className="text-xs text-muted-foreground">{data.stores.length} stores</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.stores.map((s) => (
                    <StoreCard key={s.id} store={s} onEnter={(as) => enterStore(s.id, as)} />
                  ))}
                </div>
              </div>
            </>
          )}
        </section>

        {/* How it works */}
        <section className="border-t border-border/60 bg-secondary/30">
          <div className="mx-auto max-w-7xl px-4 py-12 md:py-16 space-y-6">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <Badge variant="outline" className="border-accent bg-accent/30 text-accent-foreground">
                <Sparkles className="h-3 w-3 mr-1" /> How it works
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">From zero to launched store in 60 seconds.</h2>
              <p className="text-sm text-muted-foreground">
                Each store is fully isolated — its own products, orders, customers, branding, and admin.
                One platform, many merchants. Just like Medusa, but built for Nepal.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mt-8">
              {[
                { icon: Plus, title: '1. Create a store', body: 'Pick a name, slug, and branding colors. We instantly provision a separate tenant with its own catalog and admin.' },
                { icon: Package, title: '2. Add products', body: 'Upload your products with NPR pricing, photos, origin district, and handmade badges. Categories are scoped per store.' },
                { icon: ShoppingCart, title: '3. Start selling', body: 'Customers browse your store, pay with eSewa/Khalti/COD, ship to any of 77 districts. You manage orders from the store admin.' },
              ].map((s) => (
                <Card key={s.title} className="border-border/60">
                  <CardContent className="p-5 space-y-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center">
                      <s.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid sm:grid-cols-3 gap-3 pt-6 border-t">
              {[
                { icon: Wallet, title: 'NPR-native payments', body: 'eSewa, Khalti, and cash-on-delivery built in.' },
                { icon: Truck, title: '77-district shipping', body: 'Tiered rates: KTM valley, hill districts, Karnali.' },
                { icon: ShieldCheck, title: 'Full data isolation', body: 'Each store has its own products, orders, customers.' },
              ].map((f) => (
                <div key={f.title} className="flex items-start gap-3 rounded-lg border bg-card p-4">
                  <f.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{f.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-secondary/40 mt-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Logo size="sm" />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Himal Commerce · Multi-tenant commerce for Nepal · Medusa-inspired
          </p>
        </div>
      </footer>

      {/* Create store modal */}
      <CreateStoreModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}

// ====== Store card ======
function StoreCard({ store, onEnter }: { store: StoreRow; onEnter: (as: 'storefront' | 'admin') => void }) {
  return (
    <Card className="border-border/60 overflow-hidden hover:shadow-md hover:border-primary/40 transition-all">
      <div
        className="h-20 relative"
        style={{ background: `linear-gradient(135deg, ${store.primaryColor} 0%, ${store.accentColor} 100%)` }}
      >
        <div className="absolute -bottom-6 left-4 h-12 w-12 rounded-xl border-4 border-card bg-card overflow-hidden shadow-sm">
          {store.logoUrl ? (
            <img src={store.logoUrl} alt={store.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full grid place-items-center" style={{ backgroundColor: store.primaryColor }}>
              <StoreIcon className="h-5 w-5 text-white" />
            </div>
          )}
        </div>
        <Badge
          className="absolute top-2 right-2 text-[10px] capitalize"
          variant="secondary"
        >
          {store.plan}
        </Badge>
      </div>
      <CardContent className="p-4 pt-8 space-y-3">
        <div>
          <h3 className="font-bold tracking-tight">{store.name}</h3>
          <p className="text-xs text-muted-foreground">{store.slug}.himalcommerce.np</p>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
          {store.description}
        </p>
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div>
            <p className="text-base font-bold">{store.productCount}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Products</p>
          </div>
          <div>
            <p className="text-base font-bold">{store.orderCount}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Orders</p>
          </div>
          <div>
            <p className="text-base font-bold text-primary">{formatNPR(store.revenue).replace('रू ', 'रू')}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Revenue</p>
          </div>
        </div>
        <Separator />
        <div className="flex gap-2">
          <a
            href={`/s/${store.slug}`}
            className="flex-1 inline-flex items-center justify-center gap-1 h-8 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <StoreIcon className="h-3.5 w-3.5" /> Visit store
          </a>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onEnter('admin')}>
            <Settings2 className="h-3.5 w-3.5 mr-1" /> Admin
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ====== Create store modal ======
function CreateStoreModal({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const qc = useQueryClient()
  const enterStore = useUI((s) => s.enterStore)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    logoUrl: '',
    primaryColor: '#9C1A1A',
    accentColor: '#E8B547',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
  })

  const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          slug: form.slug || slugify(form.name),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create store')
      }
      return res.json()
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['stats', 'platform'] })
      qc.invalidateQueries({ queryKey: ['stores'] })
      toast.success('Store created!')
      onOpenChange(false)
      // Reset form
      setForm({ name: '', slug: '', description: '', logoUrl: '', primaryColor: '#9C1A1A', accentColor: '#E8B547', ownerName: '', ownerEmail: '', ownerPhone: '' })
      // Enter the new store's admin
      enterStore(data.store.id, 'admin')
    },
    onError: (e) => toast.error('Failed to create store', { description: (e as Error).message }),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto nice-scroll">
        <DialogHeader>
          <DialogTitle>Create a new store</DialogTitle>
          <DialogDescription>
            Spin up a new tenant on the platform. Each store has its own catalog, orders, and branding.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Store name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({
                ...form,
                name: e.target.value,
                slug: slugify(e.target.value),
              })}
              placeholder="e.g. Yeti Outfitters"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Slug (URL)</Label>
            <div className="flex items-center gap-1">
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="yeti-outfitters"
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground shrink-0">.himalcommerce.np</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What does your store sell?"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Logo URL (optional)</Label>
            <Input
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              placeholder="https://…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Primary color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="h-9 w-12 rounded border cursor-pointer"
                />
                <Input
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="flex-1 font-mono text-xs"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Accent color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.accentColor}
                  onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                  className="h-9 w-12 rounded border cursor-pointer"
                />
                <Input
                  value={form.accentColor}
                  onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                  className="flex-1 font-mono text-xs"
                />
              </div>
            </div>
          </div>
          <Separator />
          <div className="space-y-1.5">
            <Label>Owner name *</Label>
            <Input
              value={form.ownerName}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
              placeholder="Your name"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Owner email</Label>
              <Input
                type="email"
                value={form.ownerEmail}
                onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Owner phone</Label>
              <Input
                value={form.ownerPhone}
                onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })}
                placeholder="98XXXXXXXX"
              />
            </div>
          </div>

          {/* Live preview */}
          {form.name && (
            <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Preview</p>
              <div className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded-lg grid place-items-center"
                  style={{ background: `linear-gradient(135deg, ${form.primaryColor} 0%, ${form.accentColor} 100%)` }}
                >
                  <StoreIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold">{form.name}</p>
                  <p className="text-[10px] text-muted-foreground">{form.slug || slugify(form.name)}.himalcommerce.np</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => createMut.mutate()}
            disabled={!form.name || !form.ownerName || createMut.isPending}
          >
            {createMut.isPending ? 'Creating…' : 'Create store & enter admin'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
