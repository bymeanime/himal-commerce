import { safeJsonLd } from '@/lib/jsonld'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { SsrProductDetail } from '@/components/storefront/ssr-product-detail'
import { formatNPR } from '@/lib/nepal'

export const dynamic = 'force-dynamic'

type Params = {
  params: Promise<{ storeSlug: string; productSlug: string }>
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { storeSlug, productSlug } = await params
  const product = await db.product.findFirst({
    where: { slug: productSlug, store: { slug: storeSlug }, status: 'published' },
    include: {
      store: { select: { name: true, currency: true, primaryColor: true } },
      category: { select: { name: true, slug: true } },
    },
  })
  if (!product) return { title: 'Product not found' }

  const title = `${product.title} · ${product.store.name}`
  const description = product.subtitle ?? product.description.slice(0, 160)

  return {
    title,
    description,
    alternates: { canonical: `/s/${storeSlug}/p/${productSlug}` },
    openGraph: {
      type: 'website',
      siteName: product.store.name,
      title,
      description,
      url: `/s/${storeSlug}/p/${productSlug}`,
      ...(product.thumbnail && { images: [{ url: product.thumbnail, alt: product.title }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(product.thumbnail && { images: [product.thumbnail] }),
    },
  }
}

export default async function ProductPage({ params }: Params) {
  const { storeSlug, productSlug } = await params
  const product = await db.product.findFirst({
    where: { slug: productSlug, store: { slug: storeSlug }, status: 'published' },
    include: {
      store: {
        select: {
          id: true, name: true, slug: true, currency: true, primaryColor: true,
          accentColor: true, refundPolicyDays: true, freeShippingThreshold: true,
        },
      },
      category: { select: { name: true, slug: true } },
      variants: { orderBy: { sortOrder: 'asc' } },
      images: { orderBy: { sortOrder: 'asc' } },
      reviews: { where: { status: 'approved' }, orderBy: { createdAt: 'desc' }, take: 10 },
    },
  })

  if (!product) notFound()

  // Increment view count asynchronously (fire-and-forget)
  db.product.update({
    where: { id: product.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {})

  // Build JSON-LD structured data (SEO panel)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.thumbnail ? [product.thumbnail] : undefined,
    sku: product.sku ?? undefined,
    gtin13: product.gtin ?? undefined,
    brand: { '@type': 'Brand', name: product.store.name },
    category: product.category?.name,
    offers: {
      '@type': 'Offer',
      priceCurrency: product.store.currency,
      price: (product.price / 100).toFixed(2),
      availability: product.inventory > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `/s/${storeSlug}/p/${productSlug}`,
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: product.store.name },
    },
    ...(product.reviews.length > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length,
        reviewCount: product.reviews.length,
      },
    }),
  }

  // Pass plain JSON to client component (no Date objects)
  const productData = JSON.parse(JSON.stringify(product))

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <SsrProductDetail product={productData} />
    </>
  )
}
