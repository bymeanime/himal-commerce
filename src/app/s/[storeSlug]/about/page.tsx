import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { AboutSection } from '@/components/storefront/about-section'
import { buildSocialLinks, SocialIconsRow } from '@/components/storefront/social-links'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Mountain } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ storeSlug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { storeSlug } = await params
  const store = await db.store.findUnique({
    where: { slug: storeSlug },
    select: { name: true, description: true, ownerName: true },
  })
  if (!store) return {}
  return {
    title: `About ${store.name}`,
    description: store.description ?? `Learn more about ${store.name}.`,
    alternates: { canonical: `/s/${storeSlug}/about` },
  }
}

export default async function AboutPage({ params }: Params) {
  const { storeSlug } = await params
  const store = await db.store.findUnique({
    where: { slug: storeSlug },
    select: {
      id: true, name: true, description: true, tagline: true,
      ownerName: true, address: true, supportEmail: true, supportPhone: true,
      vatRegistered: true, vatNumber: true, panNumber: true,
      socialFacebook: true, socialInstagram: true, socialTiktok: true,
      socialYoutube: true, socialTwitter: true, socialViber: true, socialWhatsapp: true,
    },
  })
  if (!store) notFound()

  const socials = buildSocialLinks(store)

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:py-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent/30 px-4 py-1.5 text-sm mb-4">
          <Mountain className="h-4 w-4 text-primary" />
          <span>About</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{store.name}</h1>
        {store.tagline && (
          <p className="text-lg text-muted-foreground mt-3">{store.tagline}</p>
        )}
      </div>

      {store.description && (
        <div className="prose prose-lg dark:prose-invert max-w-none mb-10">
          <p className="text-foreground/80 leading-relaxed">{store.description}</p>
        </div>
      )}

      <AboutSection />

      <div className="mt-12 pt-8 border-t grid gap-6 md:grid-cols-3">
        <div>
          <h3 className="text-sm font-semibold mb-2">Founder</h3>
          <p className="text-sm text-muted-foreground">{store.ownerName}</p>
        </div>
        {store.address && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Address</h3>
            <p className="text-sm text-muted-foreground">{store.address}</p>
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold mb-2">Contact</h3>
          <p className="text-sm text-muted-foreground">
            {store.supportPhone && <span className="block">{store.supportPhone}</span>}
            {store.supportEmail && <span className="block">{store.supportEmail}</span>}
          </p>
          {socials.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Follow us</p>
              <SocialIconsRow socials={socials} size="sm" />
            </div>
          )}
        </div>
      </div>

      {store.vatRegistered && (
        <div className="mt-8 p-4 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30">
          <p className="text-sm text-emerald-800 dark:text-emerald-300">
            ✓ VAT-registered business · PAN: {store.panNumber ?? 'N/A'} · VAT: {store.vatNumber ?? 'N/A'}
          </p>
        </div>
      )}

      <div className="mt-12 text-center">
        <Link href={`/s/${storeSlug}`}>
          <Button size="lg">
            <Mountain className="h-4 w-4 mr-2" /> Shop the collection
          </Button>
        </Link>
      </div>
    </div>
  )
}
