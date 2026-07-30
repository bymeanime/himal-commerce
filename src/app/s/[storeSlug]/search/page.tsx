import { db } from '@/lib/db'
import type { Metadata } from 'next'
import Link from 'next/link'
import { SsrSearchResults } from '@/components/storefront/ssr-search-results'

export const dynamic = 'force-dynamic'

type Params = {
  params: Promise<{ storeSlug: string }>
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ params, searchParams }: Params): Promise<Metadata> {
  const { storeSlug } = await params
  const { q } = await searchParams
  const store = await db.store.findUnique({ where: { slug: storeSlug }, select: { name: true } })
  return {
    title: q ? `Search: ${q} · ${store?.name ?? 'Store'}` : `Search · ${store?.name ?? 'Store'}`,
    alternates: { canonical: `/s/${storeSlug}/search` },
    robots: { index: false, follow: true }, // noindex search results
  }
}

export default async function SearchPage({ params, searchParams }: Params) {
  const { storeSlug } = await params
  const { q = '' } = await searchParams
  const store = await db.store.findUnique({
    where: { slug: storeSlug },
    select: { id: true, name: true },
  })
  if (!store) return null

  let results: Awaited<ReturnType<typeof db.product.findMany>> = []
  if (q.trim()) {
    results = await db.product.findMany({
      where: {
        storeId: store.id,
        status: 'published',
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
          { subtitle: { contains: q } },
          { origin: { contains: q } },
          { sku: { contains: q } },
        ],
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 50,
      include: {
        category: { select: { name: true, slug: true } },
        variants: { select: { id: true, title: true, price: true, inventory: true }, orderBy: { sortOrder: 'asc' } },
      },
    })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
        Search {store.name}
      </h1>
      <p className="text-muted-foreground mb-8">
        {q
          ? `${results.length} result${results.length === 1 ? '' : 's'} for "${q}"`
          : 'Type something in the search box above to find products.'}
      </p>

      <SsrSearchResults
        query={q}
        results={JSON.parse(JSON.stringify(results))}
        storeSlug={storeSlug}
      />
    </div>
  )
}
