import { db } from '@/lib/db'
import { Hero } from '@/components/storefront/hero'
import { ProductGrid } from '@/components/storefront/product-grid'
import { AboutSection } from '@/components/storefront/about-section'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ storeSlug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { storeSlug } = await params
  const store = await db.store.findUnique({
    where: { slug: storeSlug },
    select: { name: true, tagline: true, description: true },
  })
  if (!store) return {}
  const title = store.tagline ? `${store.name} — ${store.tagline}` : `${store.name} · Shop authentic Nepali products`
  return {
    title,
    description: store.description ?? `${store.name} — authentic Nepali-made products, delivered nationwide.`,
    alternates: { canonical: `/s/${storeSlug}` },
  }
}

export default async function StoreHomePage({ params }: Params) {
  const { storeSlug } = await params
  const store = await db.store.findUnique({
    where: { slug: storeSlug },
    select: { id: true, name: true, tagline: true, description: true, primaryColor: true, accentColor: true },
  })
  if (!store) return null

  // Prefetch products — pass to client ProductGrid via initial data
  const products = await db.product.findMany({
    where: { storeId: store.id, status: 'published' },
    orderBy: [{ createdAt: 'desc' }],
    take: 24,
    include: {
      category: { select: { name: true, slug: true } },
      variants: { select: { id: true, title: true, price: true, inventory: true }, orderBy: { sortOrder: 'asc' } },
    },
  })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: store.name,
    description: store.description ?? undefined,
    url: `/s/${storeSlug}`,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Hero />
      <ProductGrid ssrProducts={JSON.parse(JSON.stringify(products))} ssrStoreId={store.id} />
      <AboutSection />
    </>
  )
}
