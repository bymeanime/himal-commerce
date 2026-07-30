import { ImageResponse } from 'next/og'
import { db } from '@/lib/db'

// IMPORTANT: This route must run on the Node.js runtime, NOT 'edge'.
// The Edge runtime has a 1 MB bundle size limit (Hobby plan) and Prisma's
// query engine is ~1.7 MB, which exceeds that limit. Using 'nodejs'
// raises the limit to ~50 MB and lets Prisma connect to Postgres
// directly. next/og's ImageResponse works in both runtimes.
export const runtime = 'nodejs'
export const alt = 'Product image'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type Params = { params: Promise<{ storeSlug: string; productSlug: string }> }

export default async function OGImage({ params }: Params) {
  const { storeSlug, productSlug } = await params
  const product = await db.product.findFirst({
    where: { slug: productSlug, store: { slug: storeSlug }, status: 'published' },
    include: { store: { select: { name: true, primaryColor: true, accentColor: true } } },
  })

  if (!product) {
    return new ImageResponse(
      (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#1a1a1a', color: 'white', fontSize: 48 }}>
          Product not found
        </div>
      ),
      { ...size }
    )
  }

  const price = `रू ${(product.price / 100).toLocaleString('en-IN')}`
  const primary = product.store.primaryColor || '#9C1A1A'
  const accent = product.store.accentColor || '#E8B547'

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: `linear-gradient(135deg, ${primary} 0%, #1a1a1a 100%)`,
          color: 'white',
          padding: 60,
          position: 'relative',
        }}
      >
        {/* Decorative mountain peak */}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1200 630"
          style={{ position: 'absolute', top: 0, left: 0, opacity: 0.1 }}
        >
          <polygon points="0,630 400,200 700,400 1200,100 1200,630" fill="white" />
        </svg>

        {/* Store name pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(255,255,255,0.15)',
            padding: '8px 20px',
            borderRadius: 999,
            fontSize: 22,
            fontWeight: 600,
            backdropFilter: 'blur(10px)',
            width: 'fit-content',
          }}
        >
          <span style={{ color: accent }}>▲</span> {product.store.name}
        </div>

        {/* Product title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 'auto',
            marginBottom: 30,
            fontSize: 56,
            fontWeight: 700,
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          {product.title.slice(0, 80)}
        </div>

        {/* Subtitle / price row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {product.subtitle && (
              <div style={{ fontSize: 24, opacity: 0.85, maxWidth: 700 }}>
                {product.subtitle.slice(0, 100)}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {product.isHandmade && (
                <div style={{ background: accent, color: '#1a1a1a', padding: '4px 14px', borderRadius: 999, fontSize: 16, fontWeight: 600 }}>
                  Handmade
                </div>
              )}
              {product.origin && (
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 14px', borderRadius: 999, fontSize: 16 }}>
                  📍 {product.origin}
                </div>
              )}
            </div>
          </div>

          {/* Price block */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              background: 'rgba(255,255,255,0.95)',
              color: '#1a1a1a',
              padding: '20px 32px',
              borderRadius: 20,
            }}
          >
            <div style={{ fontSize: 16, opacity: 0.7 }}>Price</div>
            <div style={{ fontSize: 48, fontWeight: 800, color: primary }}>{price}</div>
            {product.compareAt && product.compareAt > product.price && (
              <div style={{ fontSize: 16, textDecoration: 'line-through', opacity: 0.5 }}>
                रू {(product.compareAt / 100).toLocaleString('en-IN')}
              </div>
            )}
          </div>
        </div>

        {/* Bottom URL */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 30,
            fontSize: 18,
            opacity: 0.6,
          }}
        >
          himal-commerce.vercel.app/s/{storeSlug}/p/{productSlug}
        </div>
      </div>
    ),
    { ...size }
  )
}
