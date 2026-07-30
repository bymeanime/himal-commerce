import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Wishlist is stored locally (per device) — no login required.
// The session key is a random ID generated once per browser and sent to
// the API so the server-side wishlist can be hydrated.

type WishlistState = {
  sessionKey: string
  // Local cache of product IDs (for quick UI checks)
  productIds: string[]
  // Actions
  toggle: (productId: string) => void
  has: (productId: string) => boolean
  clear: () => void
}

function generateSessionKey(): string {
  if (typeof window === 'undefined') return 'ssr'
  const stored = localStorage.getItem('himal-wishlist-key')
  if (stored) return stored
  const key = `wl_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  localStorage.setItem('himal-wishlist-key', key)
  return key
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      sessionKey: typeof window !== 'undefined' ? generateSessionKey() : 'ssr',
      productIds: [],
      toggle: (productId) => {
        const has = get().productIds.includes(productId)
        set({
          productIds: has
            ? get().productIds.filter((id) => id !== productId)
            : [...get().productIds, productId],
        })
      },
      has: (productId) => get().productIds.includes(productId),
      clear: () => set({ productIds: [] }),
    }),
    { name: 'himal-wishlist' }
  )
)
