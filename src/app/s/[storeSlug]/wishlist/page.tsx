import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { WishlistView } from '@/components/storefront/wishlist-view'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ storeSlug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { storeSlug } = await params
  const store = await db.store.findUnique({
    where: { slug: storeSlug },
    select: { name: true },
  })
  if (!store) return {}
  return {
    title: `Wishlist · ${store.name}`,
    description: `Your saved products from ${store.name}.`,
    alternates: { canonical: `/s/${storeSlug}/wishlist` },
    robots: { index: false, follow: true }, // noindex — per-user state
  }
}

export default async function WishlistPage({ params }: Params) {
  const { storeSlug } = await params
  const store = await db.store.findUnique({
    where: { slug: storeSlug },
    select: { id: true, name: true, slug: true },
  })
  if (!store) notFound()

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:py-16">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Your wishlist</h1>
        <p className="text-muted-foreground mt-2">
          Products you&apos;ve saved for later. Stored on this device — no account required.
        </p>
      </div>
      <WishlistView storeId={store.id} storeSlug={store.slug} />
    </div>
  )
}
