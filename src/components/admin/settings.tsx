'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Store,
  Wallet,
  Truck,
  Bell,
  Globe,
  Mountain,
  Banknote,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'

export function AdminSettings() {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your store, payments, shipping, and localization.
        </p>
      </div>

      {/* Store profile */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" /> Store profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Store name</Label>
              <Input defaultValue="Himal Commerce" />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Input defaultValue="NPR (Nepali Rupee)" disabled />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Tagline</Label>
            <Input defaultValue="Authentic Nepali goods, from mountain to your door." />
          </div>
          <div className="space-y-1.5">
            <Label>Store description</Label>
            <Textarea
              rows={3}
              defaultValue="Himal Commerce is Nepal's headless commerce platform. We connect artisans across all 77 districts with customers nationwide, supporting local payment methods and cash on delivery."
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Support phone</Label>
              <Input defaultValue="+977 1 570 0000" />
            </div>
            <div className="space-y-1.5">
              <Label>Support email</Label>
              <Input defaultValue="namaste@himalcommerce.np" />
            </div>
          </div>
          <Button onClick={() => toast.success('Settings saved')}>Save changes</Button>
        </CardContent>
      </Card>

      {/* Payment methods */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" /> Payment methods
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { id: 'cod', name: 'Cash on Delivery', note: 'Pay with cash on arrival. Most popular in Nepal.', icon: Banknote, enabled: true, popular: true },
            { id: 'esewa', name: 'eSewa', note: "Nepal's #1 digital wallet", icon: Wallet, enabled: true, popular: true },
            { id: 'khalti', name: 'Khalti', note: 'Digital wallet + mobile banking + connect IPS', icon: Wallet, enabled: true, popular: false },
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
              <Switch defaultChecked={p.enabled} />
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-1">
            eSewa merchant ID: <span className="font-mono">HC-ES-2024</span> · Khalti API key: <span className="font-mono">live_khal_••••</span>
          </p>
        </CardContent>
      </Card>

      {/* Shipping */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" /> Shipping rates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-lg border p-3 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Kathmandu Valley</p>
              <Input defaultValue="100" className="font-bold" />
              <p className="text-[10px] text-muted-foreground">NPR · 1-2 days</p>
            </div>
            <div className="rounded-lg border p-3 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Other districts</p>
              <Input defaultValue="200" className="font-bold" />
              <p className="text-[10px] text-muted-foreground">NPR · 2-5 days</p>
            </div>
            <div className="rounded-lg border p-3 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Karnali / Sudurpashchim</p>
              <Input defaultValue="350" className="font-bold" />
              <p className="text-[10px] text-muted-foreground">NPR · 4-8 days</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Free shipping over</Label>
              <p className="text-xs text-muted-foreground">Inside Kathmandu Valley only</p>
            </div>
            <Input defaultValue="5000" className="w-32" />
          </div>
          <Button onClick={() => toast.success('Shipping rates saved')}>Save shipping rates</Button>
        </CardContent>
      </Card>

      {/* Localization */}
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
              <Input defaultValue="English" disabled />
            </div>
            <div className="space-y-1.5">
              <Label>Additional language</Label>
              <Input defaultValue="नेपाली (Nepali)" disabled />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Show Nepali translation on storefront</Label>
              <p className="text-xs text-muted-foreground">Display product names and key UI in Nepali alongside English</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Use Nepali numbering format</Label>
              <p className="text-xs text-muted-foreground">रू 12,34,567 instead of रू 1,234,567</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>New order SMS alert</Label>
              <p className="text-xs text-muted-foreground">Send SMS to store owner on every new order</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Customer order confirmation via SMS</Label>
              <p className="text-xs text-muted-foreground">Auto-SMS customer when order is placed (Ncell / NTC)</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Low inventory alert</Label>
              <p className="text-xs text-muted-foreground">Email when any product drops below 5 units</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* About this build */}
      <Card className="border-border/60 bg-secondary/30">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Mountain className="h-4 w-4 text-primary" /> About this build
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Himal Commerce v0.1 — a Nepal-localized headless commerce platform inspired by Medusa.
            Built with Next.js 16, Prisma, and Tailwind CSS. Uses NPR currency, supports eSewa/Khalti/COD
            payments, ships to all 77 districts of Nepal. Currency is stored in paisa (1 NPR = 100 paisa)
            to avoid floating-point rounding.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <ShieldCheck className="h-3.5 w-3.5" /> Open-source inspired · MIT-friendly
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
