'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CurrencyCode } from '@/lib/currency'

type CurrencyState = {
  currency: CurrencyCode
  setCurrency: (c: CurrencyCode) => void
  toggle: () => void
}

// Persist user's preferred display currency across sessions.
// Default NPR since most users will be Nepal-based.
export const useCurrency = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: 'NPR',
      setCurrency: (currency) => set({ currency }),
      toggle: () => {
        const order: CurrencyCode[] = ['NPR', 'USD', 'INR']
        const idx = order.indexOf(get().currency)
        set({ currency: order[(idx + 1) % order.length] })
      },
    }),
    { name: 'himal-currency' }
  )
)
