import { MetadataRoute } from 'next'
import { db } from '@/lib/db'

// SEO: sitemap.xml (SEO panel P0).
// Generates a dynamic sitemap listing:
//   - Platform homepage + static legal/info pages
//   - All active stores (/s/{slug})
//   - All published products (/s/{storeSlug}/p/{productSlug})
//   - All categories (/s/{storeSlug}/c/{categorySlug})
//   - All published blog posts (/s/{storeSlug}/blog/{slug})
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://himal-commerce.vercel.app'

  const staticEntries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/refund-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/shipping-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/cookie-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  // Fetch all active stores
  const stores = await db.store.findMany({
    where: { status: 'active' },
    select: {
      id: true, slug: true, name: true, updatedAt: true,
      products: {
        where: { status: 'published' },
        select: { slug: true, updatedAt: true },
      },
      categories: {
        select: { slug: true },
      },
      blogPosts: {
        where: { status: 'published' },
        select: { slug: true, updatedAt: true, publishedAt: true },
      },
    },
  })

  const storeEntries: MetadataRoute.Sitemap = []
  for (const store of stores) {
    // Store home
    storeEntries.push({
      url: `${baseUrl}/s/${store.slug}`,
      lastModified: store.updatedAt,
      changeFrequency: 'daily',
      priority: 0.9,
    })
    // About page
    storeEntries.push({
      url: `${baseUrl}/s/${store.slug}/about`,
      lastModified: store.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.5,
    })
    // Blog index
    storeEntries.push({
      url: `${baseUrl}/s/${store.slug}/blog`,
      lastModified: store.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.6,
    })
    // Products
    for (const p of store.products) {
      if (!p.slug) continue
      storeEntries.push({
        url: `${baseUrl}/s/${store.slug}/p/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    }
    // Categories
    for (const c of store.categories) {
      storeEntries.push({
        url: `${baseUrl}/s/${store.slug}/c/${c.slug}`,
        lastModified: store.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }
    // Blog posts
    for (const b of store.blogPosts) {
      storeEntries.push({
        url: `${baseUrl}/s/${store.slug}/blog/${b.slug}`,
        lastModified: b.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
  }

  return [...staticEntries, ...storeEntries]
}
