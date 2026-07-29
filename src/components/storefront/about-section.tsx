'use client'

import { Mountain, Leaf, HandHeart, Truck, Banknote, Wallet, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const VALUES = [
  {
    icon: HandHeart,
    title: 'Artisan-direct, always',
    body: 'We buy straight from the people who make things — the weavers in Palpa, the smiths in Bhojpur, the tea-growers in Ilam. No middlemen, no markups, fair prices for the makers.',
  },
  {
    icon: Leaf,
    title: 'Low-impact by tradition',
    body: 'Nepali crafts have always been sustainable: natural dyes, handlooms, local materials, no electricity. We just make sure they stay that way as we scale.',
  },
  {
    icon: MapPin,
    title: 'Every district, every home',
    body: 'From Darchula in the far west to Taplejung in the east, from the Terai plains to the high Himal — we ship to all 77 districts of Nepal.',
  },
]

const PAYMENTS = [
  { icon: Banknote, name: 'Cash on Delivery', note: 'Pay when it arrives — the most popular way in Nepal.' },
  { icon: Wallet, name: 'eSewa', note: 'Pay instantly with the #1 Nepali digital wallet.' },
  { icon: Wallet, name: 'Khalti', note: 'Mobile banking, connect IPS, or Khalti wallet.' },
]

export function AboutSection() {
  return (
    <section className="border-t border-border/60 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 py-14 md:py-20 space-y-12">
        <div className="max-w-3xl space-y-4">
          <Badge variant="outline" className="border-accent bg-accent/30 text-accent-foreground">
            <Mountain className="h-3 w-3 mr-1" /> Our story
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Built in Nepal, for Nepal.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Himal Commerce started with a simple frustration: it was easier to buy a Nepali-made
            pashmina in New York than in Kathmandu. We are changing that. We work directly with
            artisans across the country, list their goods at fair prices, and ship to every
            district — paying out the makers within seven days of sale.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed">
            We are inspired by what Medusa and Shopify have done for global commerce — but Nepal
            is not the world. We need NPR pricing, eSewa and Khalti at checkout, cash on delivery
            for the 60% of Nepalis who still prefer it, and shipping rates that reflect the
            reality of sending a package up to Mustang in winter. That is what we built.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-xl border bg-card p-5 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center">
                <v.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">{v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.body}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-card border p-6 md:p-8 space-y-5">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" /> Shipping &amp; payment, the Nepali way
            </h3>
            <p className="text-sm text-muted-foreground">
              Three payment methods, 77 districts, transparent rates.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {PAYMENTS.map((p) => (
              <div key={p.name} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <p.icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{p.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{p.note}</p>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t text-xs text-muted-foreground grid sm:grid-cols-3 gap-3">
            <div>
              <p className="font-medium text-foreground mb-1">Inside KTM Valley</p>
              <p>रू 100 flat · 1-2 day delivery</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Other districts</p>
              <p>रू 200 flat · 2-5 day delivery</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Karnali &amp; Sudurpashchim</p>
              <p>रू 300-350 · 4-8 day delivery</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
