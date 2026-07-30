'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Store as StoreIcon,
  Wallet,
  Truck,
  Globe,
  Mountain,
  Banknote,
  Share2,
  FileText,
  Megaphone,
  BarChart3,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCurrentStore } from '@/lib/use-current-store'
import type { Store } from '@/lib/types'

// Social platform display config — all 7 supported socials
const SOCIALS: Array<{
  key:
    | 'socialTwitter'
    | 'socialFacebook'
    | 'socialInstagram'
    | 'socialTiktok'
    | 'socialYoutube'
    | 'socialViber'
    | 'socialWhatsapp'
  label: string
  placeholder: string
  isPhone?: boolean
}> = [
  { key: 'socialFacebook', label: 'Facebook', placeholder: 'https://facebook.com/yourstore' },
  { key: 'socialInstagram', label: 'Instagram', placeholder: 'https://instagram.com/yourstore' },
  { key: 'socialTiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@yourstore' },
  { key: 'socialYoutube', label: 'YouTube', placeholder: 'https://youtube.com/@yourstore' },
  { key: 'socialTwitter', label: 'Twitter / X', placeholder: 'https://twitter.com/yourstore' },
  { key: 'socialWhatsapp', label: 'WhatsApp', placeholder: '+977 98XXXXXXXX (phone)', isPhone: true },
  { key: 'socialViber', label: 'Viber', placeholder: '+977 98XXXXXXXX (phone)', isPhone: true },
]

// Helper: parse a JSON string field safely
function parseJsonField<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

// Announcement bar config type
type AnnouncementConfig = {
  message: string
  textColor: string
  bgColor: string
  link?: string
}

// Marketing config type
type MarketingConfig = {
  ga4Id?: string
  metaPixelId?: string
  tiktokPixelId?: string
}

export function AdminSettings() {
  const { store, storeId, refetch } = useCurrentStore()
  const [form, setForm] = useState<Partial<Store> | null>(null)

  // Initialize form from store once it loads
  const current = form ?? store
  const set = (k: keyof Store, v: string | number | boolean | null) => {
    setForm({ ...(current ?? {}), [k]: v } as Partial<Store>)
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!storeId) throw new Error('No store')
      const res = await fetch(`/api/stores/${storeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(current),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: 'Save failed' }))
        throw new Error(e.error)
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Settings saved')
      setForm(null)
      refetch?.()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (!store || !current) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // Announcement bar editor (JSON field) — must come after null check on `current`
  const announcement = parseJsonField<AnnouncementConfig>(current.announcementBar, {
    message: '',
    textColor: '#FFFFFF',
    bgColor: '#9C1A1A',
    link: '',
  })
  const setAnnouncement = (patch: Partial<AnnouncementConfig>) => {
    const next = { ...announcement, ...patch }
    set('announcementBar', next.message ? JSON.stringify(next) : null)
  }

  // Marketing config editor (JSON field)
  const marketing = parseJsonField<MarketingConfig>(current.marketingConfig, {})
  const setMarketing = (patch: Partial<MarketingConfig>) => {
    const next = { ...marketing, ...patch }
    const hasValue = Boolean(next.ga4Id || next.metaPixelId || next.tiktokPixelId)
    set('marketingConfig', hasValue ? JSON.stringify(next) : null)
  }

  // Detect if there are unsaved changes
  const dirty = form !== null

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your store profile, contact info, social links, tax, shipping, and marketing.
          </p>
        </div>
        {dirty && (
          <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            {saveMut.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        )}
      </div>

      {/* Store profile */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <StoreIcon className="h-4 w-4 text-primary" /> Store profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Store name</Label>
              <Input value={current.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Input value={current.currency} disabled />
              <p className="text-[11px] text-muted-foreground">Currency is fixed at the platform level for now.</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Tagline</Label>
            <Input
              value={current.tagline ?? ''}
              onChange={(e) => set('tagline', e.target.value)}
              placeholder="A short, punchy tagline shown on your storefront hero"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Store description</Label>
            <Textarea
              rows={3}
              value={current.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Logo URL</Label>
              <div className="flex gap-2">
                <Input
                  value={current.logoUrl ?? ''}
                  onChange={(e) => set('logoUrl', e.target.value)}
                  placeholder="https://…"
                />
                {current.logoUrl && (
                  <img src={current.logoUrl} alt="" className="h-9 w-9 rounded object-cover" />
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Banner URL (optional)</Label>
              <Input
                value={current.bannerUrl ?? ''}
                onChange={(e) => set('bannerUrl', e.target.value)}
                placeholder="https://… (storefront hero background)"
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Primary brand color</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={current.primaryColor ?? '#9C1A1A'}
                  onChange={(e) => set('primaryColor', e.target.value)}
                  className="h-9 w-12 rounded border cursor-pointer"
                />
                <Input
                  value={current.primaryColor ?? ''}
                  onChange={(e) => set('primaryColor', e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Accent color</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={current.accentColor ?? '#E8B547'}
                  onChange={(e) => set('accentColor', e.target.value)}
                  className="h-9 w-12 rounded border cursor-pointer"
                />
                <Input
                  value={current.accentColor ?? ''}
                  onChange={(e) => set('accentColor', e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact info */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" /> Contact information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Owner name</Label>
              <Input
                value={current.ownerName ?? ''}
                onChange={(e) => set('ownerName', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Owner phone</Label>
              <Input
                value={current.ownerPhone ?? ''}
                onChange={(e) => set('ownerPhone', e.target.value)}
                placeholder="9801234567"
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Owner email</Label>
              <Input
                type="email"
                value={current.ownerEmail ?? ''}
                onChange={(e) => set('ownerEmail', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Storefront support phone</Label>
              <Input
                value={current.supportPhone ?? ''}
                onChange={(e) => set('supportPhone', e.target.value)}
                placeholder="+977 1 4123 456"
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Storefront support email</Label>
              <Input
                type="email"
                value={current.supportEmail ?? ''}
                onChange={(e) => set('supportEmail', e.target.value)}
                placeholder="namaste@yourstore.np"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Business address</Label>
              <Input
                value={current.address ?? ''}
                onChange={(e) => set('address', e.target.value)}
                placeholder="Patan Dhoka, Lalitpur 44600, Nepal"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social media — now includes Viber + WhatsApp */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary" /> Social media
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            These links appear in your storefront footer, about page, and contact page. Leave blank to hide an icon.
            For WhatsApp and Viber, enter the phone number with country code (e.g. +977 98XXXXXXXX).
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {SOCIALS.map((s) => (
              <div key={s.key} className="space-y-1.5">
                <Label>
                  {s.label}
                  {s.isPhone && <span className="text-[10px] text-muted-foreground ml-1">(phone)</span>}
                </Label>
                <Input
                  value={(current[s.key] as string) ?? ''}
                  onChange={(e) => set(s.key, e.target.value)}
                  placeholder={s.placeholder}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Finance / Legal — VAT, PAN, Tax */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> Tax &amp; legal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Nepal tax registration. Required for VAT invoice generation and IRD compliance.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>PAN number</Label>
              <Input
                value={current.panNumber ?? ''}
                onChange={(e) => set('panNumber', e.target.value)}
                placeholder="PAN-123456789"
              />
            </div>
            <div className="space-y-1.5">
              <Label>VAT number (if VAT-registered)</Label>
              <Input
                value={current.vatNumber ?? ''}
                onChange={(e) => set('vatNumber', e.target.value)}
                placeholder="VAT-123456789"
                disabled={!current.vatRegistered}
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Business registration number</Label>
              <Input
                value={current.businessRegistrationNumber ?? ''}
                onChange={(e) => set('businessRegistrationNumber', e.target.value)}
                placeholder="Company reg # with OCR"
              />
            </div>
            <div className="space-y-1.5">
              <Label>VAT invoice prefix</Label>
              <Input
                value={current.vatInvoicePrefix ?? 'INV'}
                onChange={(e) => set('vatInvoicePrefix', e.target.value)}
                placeholder="INV"
                className="font-mono"
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">VAT registered</p>
              <p className="text-xs text-muted-foreground">Enable if your business is VAT-registered with IRD Nepal.</p>
            </div>
            <Switch
              checked={current.vatRegistered}
              onCheckedChange={(v) => set('vatRegistered', v)}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Default tax rate (basis points)</Label>
              <Input
                type="number"
                value={current.defaultTaxRate ?? 1300}
                onChange={(e) => set('defaultTaxRate', Number(e.target.value))}
                placeholder="1300 (13% Nepal VAT)"
              />
              <p className="text-[11px] text-muted-foreground">1300 = 13% (Nepal standard VAT rate)</p>
            </div>
            <div className="space-y-1.5 flex items-end">
              <div className="flex items-center justify-between rounded-lg border p-3 w-full">
                <div>
                  <p className="text-sm font-medium">Tax-inclusive display</p>
                  <p className="text-xs text-muted-foreground">Show prices including VAT</p>
                </div>
                <Switch
                  checked={current.taxInclusiveDisplay}
                  onCheckedChange={(v) => set('taxInclusiveDisplay', v)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logistics — COD threshold + free shipping */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" /> Shipping &amp; COD
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>COD risk threshold (paisa)</Label>
              <Input
                type="number"
                value={current.codRiskThreshold ?? 500000}
                onChange={(e) => set('codRiskThreshold', Number(e.target.value))}
                placeholder="500000 (रू 5,000)"
              />
              <p className="text-[11px] text-muted-foreground">Orders above this value require COD verification. 500000 paisa = रू 5,000.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Free shipping threshold (paisa, optional)</Label>
              <Input
                type="number"
                value={current.freeShippingThreshold ?? ''}
                onChange={(e) => set('freeShippingThreshold', e.target.value ? Number(e.target.value) : null)}
                placeholder="200000 (रू 2,000) — leave blank to disable"
              />
              <p className="text-[11px] text-muted-foreground">Orders at or above this subtotal ship free.</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 pt-2">
            <div className="rounded-lg border p-3 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Kathmandu Valley</p>
              <p className="font-bold">रू 100</p>
              <p className="text-[10px] text-muted-foreground">1-2 days</p>
            </div>
            <div className="rounded-lg border p-3 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Other districts</p>
              <p className="font-bold">रू 200</p>
              <p className="text-[10px] text-muted-foreground">2-5 days</p>
            </div>
            <div className="rounded-lg border p-3 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Karnali / Sudurpashchim</p>
              <p className="font-bold">रू 300-350</p>
              <p className="text-[10px] text-muted-foreground">4-8 days</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            Platform default rates shown above. Per-store custom zone rates can be configured via the <code>shippingRates</code> JSON field in the API.
          </p>
        </CardContent>
      </Card>

      {/* Policies — refund / return / shipping */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Policies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Override the platform default policies. Shown on storefront trust signals, order lookup, and policy pages.
          </p>
          <div className="space-y-1.5">
            <Label>Refund window (days)</Label>
            <Input
              type="number"
              value={current.refundPolicyDays ?? 7}
              onChange={(e) => set('refundPolicyDays', Number(e.target.value))}
              placeholder="7"
            />
            <p className="text-[11px] text-muted-foreground">Default: 7 days. Shown on PDP trust signals and order lookup.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Custom return policy text (optional)</Label>
            <Textarea
              rows={3}
              value={current.returnPolicyText ?? ''}
              onChange={(e) => set('returnPolicyText', e.target.value)}
              placeholder="Override the default return policy with your own text. Leave blank to use platform default."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Custom shipping policy text (optional)</Label>
            <Textarea
              rows={3}
              value={current.shippingPolicyText ?? ''}
              onChange={(e) => set('shippingPolicyText', e.target.value)}
              placeholder="Override the default shipping policy with your own text. Leave blank to use platform default."
            />
          </div>
        </CardContent>
      </Card>

      {/* Announcement bar editor */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" /> Announcement bar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            A colored banner shown above the storefront header. Clear the message to disable.
          </p>
          <div className="space-y-1.5">
            <Label>Message</Label>
            <Input
              value={announcement.message}
              onChange={(e) => setAnnouncement({ message: e.target.value })}
              placeholder="गाड़ा एकादशी को शुभकामना — 10% off site-wide today!"
            />
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Background color</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={announcement.bgColor}
                  onChange={(e) => setAnnouncement({ bgColor: e.target.value })}
                  className="h-9 w-12 rounded border cursor-pointer"
                />
                <Input
                  value={announcement.bgColor}
                  onChange={(e) => setAnnouncement({ bgColor: e.target.value })}
                  className="font-mono"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Text color</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={announcement.textColor}
                  onChange={(e) => setAnnouncement({ textColor: e.target.value })}
                  className="h-9 w-12 rounded border cursor-pointer"
                />
                <Input
                  value={announcement.textColor}
                  onChange={(e) => setAnnouncement({ textColor: e.target.value })}
                  className="font-mono"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Link (optional)</Label>
              <Input
                value={announcement.link ?? ''}
                onChange={(e) => setAnnouncement({ link: e.target.value })}
                placeholder="/s/yourstore/blog/sale"
              />
            </div>
          </div>
          {announcement.message && (
            <div
              className="rounded-md px-4 py-2 text-sm text-center"
              style={{ background: announcement.bgColor, color: announcement.textColor }}
            >
              {announcement.message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Marketing config — GA4 / Meta Pixel / TikTok Pixel */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Analytics &amp; pixels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Tracking IDs for third-party analytics. Scripts are injected into the storefront only after the visitor accepts the cookie consent banner.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Google Analytics 4 ID</Label>
              <Input
                value={marketing.ga4Id ?? ''}
                onChange={(e) => setMarketing({ ga4Id: e.target.value })}
                placeholder="G-XXXXXXXXXX"
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Meta (Facebook) Pixel ID</Label>
              <Input
                value={marketing.metaPixelId ?? ''}
                onChange={(e) => setMarketing({ metaPixelId: e.target.value })}
                placeholder="123456789012345"
                className="font-mono"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>TikTok Pixel ID</Label>
            <Input
              value={marketing.tiktokPixelId ?? ''}
              onChange={(e) => setMarketing({ tiktokPixelId: e.target.value })}
              placeholder="CXXXXXXXXXXXXXXXXX"
              className="font-mono"
            />
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            First-party analytics (page views, add-to-cart, checkout funnel) are tracked by default — no IDs needed for the in-app dashboard.
          </p>
        </CardContent>
      </Card>

      {/* Payment methods (informational) */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" /> Payment methods
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { id: 'cod', name: 'Cash on Delivery', note: 'Pay with cash on arrival. Most popular in Nepal.', icon: Banknote, popular: true },
            { id: 'esewa', name: 'eSewa', note: "Nepal's #1 digital wallet", icon: Wallet, popular: true },
            { id: 'khalti', name: 'Khalti', note: 'Digital wallet + mobile banking + connect IPS', icon: Wallet, popular: false },
          ].map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 grid place-items-center">
                  <p.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    {p.name}
                    {p.popular && <Badge variant="secondary" className="bg-accent text-accent-foreground text-[10px]">Popular</Badge>}
                  </p>
                  <p className="text-xs text-muted-foreground">{p.note}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px]">Enabled</Badge>
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-1">
            Digital payments (eSewa, Khalti) are marked <strong>pending</strong> on checkout
            and must be confirmed manually in the Orders panel until gateway credentials
            are configured. Cash on Delivery remains <strong>unpaid</strong> until collected.
          </p>
        </CardContent>
      </Card>

      {/* Localization (informational) */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" /> Localization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Default language</Label>
              <Input value="English" disabled />
            </div>
            <div className="space-y-1.5">
              <Label>Additional language</Label>
              <Input value="नेपाली (Nepali)" disabled />
            </div>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            Multi-language storefront support is on the roadmap.
          </p>
        </CardContent>
      </Card>

      {/* About this build */}
      <Card className="border-border/60 bg-secondary/30">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Mountain className="h-4 w-4 text-primary" /> About this build
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Himal Commerce v0.6 — a Nepal-localized multi-tenant commerce platform inspired by Medusa.
            Built with Next.js 16, Prisma, and Tailwind CSS. Uses NPR currency, supports eSewa/Khalti/COD
            payments, ships to all 77 districts of Nepal. Currency is stored in paisa (1 NPR = 100 paisa)
            to avoid floating-point rounding.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
