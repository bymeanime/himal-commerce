import { safeJsonLd } from '@/lib/jsonld'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ContactView } from '@/components/storefront/contact-view'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ storeSlug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { storeSlug } = await params
  const store = await db.store.findUnique({
    where: { slug: storeSlug },
    select: { name: true, description: true },
  })
  if (!store) return {}
  return {
    title: `Contact · ${store.name}`,
    description: `Get in touch with ${store.name}. Phone, email, social media, and contact form.`,
    alternates: { canonical: `/s/${storeSlug}/contact` },
  }
}

export default async function ContactPage({ params }: Params) {
  const { storeSlug } = await params
  const store = await db.store.findUnique({
    where: { slug: storeSlug },
    select: {
      id: true, name: true, slug: true,
      supportPhone: true, supportEmail: true, address: true,
      ownerName: true, ownerEmail: true, ownerPhone: true,
      socialTwitter: true, socialFacebook: true, socialInstagram: true,
      socialTiktok: true, socialYoutube: true, socialViber: true, socialWhatsapp: true,
      primaryColor: true, accentColor: true,
    },
  })
  if (!store) notFound()

  // JSON-LD for the store's contact info
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: store.name,
    ...(store.supportPhone && { telephone: store.supportPhone }),
    ...(store.supportEmail && { email: store.supportEmail }),
    ...(store.address && { address: { '@type': 'PostalAddress', streetAddress: store.address } }),
    url: `/s/${storeSlug}/contact`,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <ContactView store={store} />
    </>
  )
}
