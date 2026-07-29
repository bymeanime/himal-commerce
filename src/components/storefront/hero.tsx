'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mountain, Truck, ShieldCheck, Wallet } from 'lucide-react'
import { useUI } from '@/lib/ui-store'

export function Hero() {
  const setStoreSection = useUI((s) => s.setStoreSection)

  return (
    <section className="relative overflow-hidden border-b border-border/60">
      {/* Decorative Himalayan pattern */}
      <div className="absolute inset-0 himal-pattern" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:py-16 md:py-24">
        <div className="grid gap-8 md:grid-cols-2 items-center">
          <div className="space-y-6">
            <Badge variant="outline" className="border-accent bg-accent/30 text-accent-foreground">
              <Mountain className="h-3 w-3 mr-1" />
              Made in the Himalayas
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.05]">
              Authentic Nepali goods,
              <span className="block text-primary">from mountain to your door.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
              Hand-loomed pashmina from Mustang, hand-forged khukuris from Bhojpur, single-estate Ilam tea.
              Sourced direct from Nepali artisans. Pay with eSewa, Khalti, or cash on delivery. Shipped to all 77 districts.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={() => setStoreSection('products')} className="h-12 px-6 text-base">
                Shop the collection
              </Button>
              <Button size="lg" variant="outline" onClick={() => setStoreSection('about')} className="h-12 px-6 text-base">
                Our story
              </Button>
            </div>

            {/* Trust signals */}
            <div className="grid grid-cols-3 gap-3 pt-4 max-w-md">
              <div className="flex flex-col gap-1">
                <Truck className="h-5 w-5 text-primary" />
                <p className="text-xs font-medium">All 77 districts</p>
                <p className="text-[11px] text-muted-foreground">Nationwide shipping</p>
              </div>
              <div className="flex flex-col gap-1">
                <Wallet className="h-5 w-5 text-primary" />
                <p className="text-xs font-medium">eSewa · Khalti · COD</p>
                <p className="text-[11px] text-muted-foreground">Local payment</p>
              </div>
              <div className="flex flex-col gap-1">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <p className="text-xs font-medium">Artisan-direct</p>
                <p className="text-[11px] text-muted-foreground">Fair-trade pricing</p>
              </div>
            </div>
          </div>

          {/* Visual collage */}
          <div className="relative hidden md:block">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-3">
                <img
                  src="https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&q=80"
                  alt="Handwoven Dhaka topi"
                  className="w-full h-48 object-cover rounded-xl shadow-md"
                />
                <img
                  src="https://images.unsplash.com/photo-1611689342806-0863700ce1e4?w=400&q=80"
                  alt="Tibetan singing bowl"
                  className="w-full h-32 object-cover rounded-xl shadow-md"
                />
              </div>
              <div className="space-y-3 pt-8">
                <img
                  src="https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=400&q=80"
                  alt="Ilam tea"
                  className="w-full h-32 object-cover rounded-xl shadow-md"
                />
                <img
                  src="https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&q=80"
                  alt="Pashmina shawl"
                  className="w-full h-48 object-cover rounded-xl shadow-md"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
