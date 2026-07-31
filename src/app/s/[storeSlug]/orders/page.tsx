import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { OrderLookup } from '@/components/storefront/order-lookup'

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
    title: `Find my order · ${store.name}`,
    description: `Look up your order status and request a return from ${store.name}.`,
    alternates: { canonical: `/s/${storeSlug}/orders` },
    robots: { index: false, follow: true }, // noindex — customer portal
  }
}

export default async function OrdersPage({ params }: Params) {
  const { storeSlug } = await params
  const store = await db.store.findUnique({
    where: { slug: storeSlug },
    select: {
      id: true, name: true, slug: true, refundPolicyDays: true, returnPolicyText: true,
    },
  })
  if (!store) notFound()

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Find my order</h1>
        <p className="text-muted-foreground mt-2">
          Look up your order by phone number and order number to view status, tracking, and request a return.
        </p>
      </div>
      <OrderLookup
        storeId={store.id}
        storeSlug={store.slug}
        refundPolicyDays={store.refundPolicyDays}
        returnPolicyText={store.returnPolicyText}
      />
    </div>
  )
}
