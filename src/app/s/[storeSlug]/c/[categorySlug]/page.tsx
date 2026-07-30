import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { SsrCategoryView } from '@/components/storefront/ssr-category-view'
import { ChevronRight, Home as HomeIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Params = {
  params: Promise<{ storeSlug: string; categorySlug: string }>
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { storeSlug, categorySlug } = await params
  const category = await db.category.findFirst({
    where: { slug: categorySlug, store: { slug: storeSlug } },
    include: { store: { select: { name: true } } },
  })
  if (!category) return { title: 'Category not found' }

  const title = `${category.name} · ${category.store.name}`
  const description = category.description ?? `Shop ${category.name} from ${category.store.name}.`
  return {
    title,
    description,
    alternates: { canonical: `/s/${storeSlug}/c/${categorySlug}` },
    openGraph: {
      type: 'website',
      siteName: category.store.name,
      title,
      description,
      url: `/s/${storeSlug}/c/${categorySlug}`,
      ...(category.imageUrl && { images: [{ url: category.imageUrl }] }),
    },
  }
}

export default async function CategoryPage({ params }: Params) {
  const { storeSlug, categorySlug } = await params
  const category = await db.category.findFirst({
    where: { slug: categorySlug, store: { slug: storeSlug } },
    include: {
      store: { select: { id: true, name: true, slug: true } },
      children: { select: { id: true, name: true, slug: true }, orderBy: { sortOrder: 'asc' } },
    },
  })
  if (!category) notFound()

  // Fetch products in this category
  const products = await db.product.findMany({
    where: {
      categoryId: category.id,
      status: 'published',
    },
    orderBy: [{ createdAt: 'desc' }],
    take: 50,
    include: {
      category: { select: { name: true, slug: true } },
      variants: { select: { id: true, title: true, price: true, inventory: true }, orderBy: { sortOrder: 'asc' } },
    },
  })

  // JSON-LD structured data for category page
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    description: category.description ?? undefined,
    url: `/s/${storeSlug}/c/${categorySlug}`,
    isPartOf: { '@type': 'Store', name: category.store.name },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products.slice(0, 10).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: p.title,
          url: `/s/${storeSlug}/p/${p.slug}`,
          ...(p.thumbnail && { image: p.thumbnail }),
        },
      })),
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground mb-6">
          <Link href={`/s/${storeSlug}`} className="hover:text-foreground flex items-center gap-1">
            <HomeIcon className="h-3 w-3" /> Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{category.name}</span>
        </nav>

        {/* Editorial header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{category.name}</h1>
          {category.description && (
            <p className="text-muted-foreground mt-2 max-w-2xl">{category.description}</p>
          )}
        </div>

        {/* Editorial markdown content for SEO */}
        {category.editorialMd && (
          <div className="prose prose-sm dark:prose-invert max-w-2xl mb-8 rounded-lg border border-border bg-secondary/30 p-5">
            <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground">{category.editorialMd}</pre>
          </div>
        )}

        {/* Subcategories */}
        {category.children.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {category.children.map((c) => (
              <Link
                key={c.id}
                href={`/s/${storeSlug}/c/${c.slug}`}
                className="inline-flex items-center rounded-full border border-border bg-background px-4 py-1.5 text-sm hover:border-primary hover:bg-primary/5 transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        <SsrCategoryView
          products={JSON.parse(JSON.stringify(products))}
          storeSlug={storeSlug}
        />
      </div>
    </>
  )
}
