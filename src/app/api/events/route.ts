import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/events — record a client-side analytics event.
// Marketing + Data panels P0. Used for funnel tracking (page_view, product_view,
// add_to_cart, checkout_start, checkout_complete, checkout_abandon, search).
//
// Fire-and-forget on the client (uses sendBeacon). No auth required — events
// are tied to anonymous session IDs, not user accounts.
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { type, sessionId, storeId, productId, variantId, cartValue, meta } = body

  if (!type || !sessionId || !storeId) {
    return NextResponse.json({ error: 'type, sessionId, and storeId are required' }, { status: 400 })
  }

  // Allow-list of event types — prevents arbitrary strings from polluting the table
  const ALLOWED_TYPES = [
    'page_view', 'product_view', 'add_to_cart', 'remove_from_cart',
    'checkout_start', 'checkout_complete', 'checkout_abandon',
    'search', 'share', 'newsletter_signup', 'wishlist_add',
  ]
  if (!ALLOWED_TYPES.includes(type)) {
    return NextResponse.json({ error: { code: 'INVALID_EVENT_TYPE', message: `Event type must be one of: ${ALLOWED_TYPES.join(', ')}` } }, { status: 400 })
  }

  try {
    await db.analyticsEvent.create({
      data: {
        storeId,
        type,
        sessionId: String(sessionId).slice(0, 100), // cap length
        productId: productId || null,
        variantId: variantId || null,
        cartValue: typeof cartValue === 'number' ? cartValue : null,
        meta: meta ? JSON.stringify(meta).slice(0, 2000) : null,
      },
    })
  } catch (e) {
    // Analytics should never break the user experience
    // eslint-disable-next-line no-console
    console.error('[events] failed to record:', e)
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}

// GET /api/events — read aggregated analytics (admin only).
// Returns a funnel breakdown for the past 30 days.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('storeId')
  if (!storeId) return NextResponse.json({ error: 'storeId is required' }, { status: 400 })

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const events = await db.analyticsEvent.groupBy({
    by: ['type'],
    where: { storeId, createdAt: { gte: thirtyDaysAgo } },
    _count: { _all: true },
  })

  const funnel = events.reduce((acc, e) => {
    acc[e.type] = e._count._all
    return acc
  }, {} as Record<string, number>)

  // Compute conversion rates
  const pageViews = funnel['page_view'] || 0
  const productViews = funnel['product_view'] || 0
  const addToCarts = funnel['add_to_cart'] || 0
  const checkoutStarts = funnel['checkout_start'] || 0
  const checkoutCompletes = funnel['checkout_complete'] || 0

  return NextResponse.json({
    window: '30d',
    funnel: {
      page_view: pageViews,
      product_view: productViews,
      add_to_cart: addToCarts,
      checkout_start: checkoutStarts,
      checkout_complete: checkoutCompletes,
      checkout_abandon: funnel['checkout_abandon'] || 0,
    },
    conversionRates: {
      product_view_to_cart: pageViews > 0 ? (addToCarts / productViews * 100).toFixed(2) + '%' : '0%',
      cart_to_checkout: addToCarts > 0 ? (checkoutStarts / addToCarts * 100).toFixed(2) + '%' : '0%',
      checkout_to_purchase: checkoutStarts > 0 ? (checkoutCompletes / checkoutStarts * 100).toFixed(2) + '%' : '0%',
      overall: pageViews > 0 ? (checkoutCompletes / pageViews * 100).toFixed(2) + '%' : '0%',
    },
  })
}
