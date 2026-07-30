'use client'

// Client-side analytics + UTM tracking helpers (Marketing panel).
// Persists UTM/affiliate/referrer across the session.

const SESSION_KEY = 'himal-session-id'
const UTM_KEY = 'himal-utm'

function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr'
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}

// ====== UTM persistence ======
// On first visit, capture ?utm_* params. On subsequent visits, keep the
// first-touch attribution but also record last-touch.
export function captureUTM() {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const utm: Record<string, string> = {}
  ;['source', 'medium', 'campaign', 'term', 'content'].forEach(k => {
    const v = params.get(`utm_${k}`)
    if (v) utm[k] = v
  })
  if (Object.keys(utm).length === 0) return

  const existing = JSON.parse(localStorage.getItem(UTM_KEY) || 'null')
  const next = existing
    ? { firstTouch: existing.firstTouch ?? existing, lastTouch: utm }
    : { firstTouch: utm, lastTouch: utm }
  localStorage.setItem(UTM_KEY, JSON.stringify(next))
}

export function getUTM(): { firstTouch?: Record<string, string>; lastTouch?: Record<string, string> } | null {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem(UTM_KEY) || 'null')
  } catch {
    return null
  }
}

export function getReferrer(): string | null {
  if (typeof window === 'undefined') return null
  // Read affiliate cookie set by middleware (first-party, 30-day)
  const match = document.cookie.match(/(?:^|;\s*)himal-ref=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

// ====== Event tracking ======
// Posts to /api/events (server-side analytics store). Fire-and-forget.
export function track(
  type: string,
  payload: {
    storeId: string
    productId?: string
    variantId?: string
    cartValue?: number
    meta?: Record<string, unknown>
  }
) {
  if (typeof window === 'undefined') return
  const sessionId = getSessionId()
  const body = { type, sessionId, ...payload }
  // Use sendBeacon for unload events, fallback to fetch
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/events', new Blob([JSON.stringify(body)], { type: 'application/json' }))
      return
    }
  } catch { /* ignore */ }
  fetch('/api/events', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {})
}
