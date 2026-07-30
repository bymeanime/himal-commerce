import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { StorefrontShell } from '@/components/storefront/ssr-shell'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ storeSlug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { storeSlug } = await params
  const store = await db.store.findUnique({
    where: { slug: storeSlug },
    select: {
      name: true, description: true, tagline: true, logoUrl: true,
      bannerUrl: true, primaryColor: true, currency: true,
      socialTwitter: true, socialFacebook: true, socialInstagram: true,
    },
  })
  if (!store) return { title: 'Store not found · Himal Commerce' }

  const title = store.tagline ? `${store.name} — ${store.tagline}` : store.name
  const description = store.description ?? `${store.name} — authentic Nepali products, delivered nationwide.`

  return {
    title,
    description,
    alternates: { canonical: `/s/${storeSlug}` },
    openGraph: {
      type: 'website',
      siteName: 'Himal Commerce',
      title,
      description,
      url: `/s/${storeSlug}`,
      ...(store.logoUrl && { images: [{ url: store.logoUrl }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(store.logoUrl && { images: [store.logoUrl] }),
    },
  }
}

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ storeSlug: string }>
}) {
  const { storeSlug } = await params
  const store = await db.store.findUnique({
    where: { slug: storeSlug },
    include: {
      categories: {
        where: { parentId: null },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, name: true, slug: true, icon: true },
      },
    },
  })

  if (!store || store.status !== 'active') {
    notFound()
  }

  return <StorefrontShell store={store}>{children}</StorefrontShell>
}
