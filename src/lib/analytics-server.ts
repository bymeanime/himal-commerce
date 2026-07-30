import { db } from '@/lib/db'

// Server-side analytics event recorder (Marketing + Data panels).
// Fire-and-forget; never blocks the response.
export async function trackEvent(
  storeId: string,
  type: string,
  payload: {
    sessionId: string
    userId?: string
    productId?: string
    variantId?: string
    cartValue?: number
    meta?: Record<string, unknown>
  }
) {
  try {
    await db.analyticsEvent.create({
      data: {
        storeId,
        type,
        sessionId: payload.sessionId,
        userId: payload.userId,
        productId: payload.productId,
        variantId: payload.variantId,
        cartValue: payload.cartValue,
        meta: payload.meta ? JSON.stringify(payload.meta) : null,
      },
    })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[analytics] failed to track event:', e)
  }
}
