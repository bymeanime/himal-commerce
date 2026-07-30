import { MetadataRoute } from 'next'

// SEO: robots.txt (SEO panel P1).
// Replaces static public/robots.txt — Next.js will serve this at /robots.txt.
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://himal-commerce.vercel.app'
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
