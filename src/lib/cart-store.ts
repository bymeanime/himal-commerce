import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Product } from '@/lib/types'

type CartState = {
  items: CartItem[]
  storeId: string | null // The store the cart belongs to
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  add: (product: Product, quantity?: number) => void
  remove: (productId: string) => void
  setQuantity: (productId: string, quantity: number) => void
  clear: () => void
  // derived
  count: () => number
  subtotal: () => number
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      storeId: null,
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      add: (product, quantity = 1) => {
        // If cart belongs to a different store, start fresh
        if (get().storeId && get().storeId !== product.storeId) {
          set({
            items: [
              {
                productId: product.id,
                storeId: product.storeId,
                title: product.title,
                thumbnail: product.thumbnail,
                price: product.price,
                quantity,
              },
            ],
            storeId: product.storeId,
            isOpen: true,
          })
          return
        }
        const items = get().items
        const existing = items.find((i) => i.productId === product.id)
        if (existing) {
          set({
            items: items.map((i) =>
              i.productId === product.id ? { ...i, quantity: i.quantity + quantity } : i
            ),
            storeId: product.storeId,
            isOpen: true,
          })
        } else {
          set({
            items: [
              ...items,
              {
                productId: product.id,
                storeId: product.storeId,
                title: product.title,
                thumbnail: product.thumbnail,
                price: product.price,
                quantity,
              },
            ],
            storeId: product.storeId,
            isOpen: true,
          })
        }
      },
      remove: (productId) => {
        const items = get().items.filter((i) => i.productId !== productId)
        set({ items, storeId: items.length === 0 ? null : get().storeId })
      },
      setQuantity: (productId, quantity) =>
        set({
          items: get()
            .items.map((i) => (i.productId === productId ? { ...i, quantity } : i))
            .filter((i) => i.quantity > 0),
        }),
      clear: () => set({ items: [], storeId: null }),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: 'himal-cart' }
  )
)
