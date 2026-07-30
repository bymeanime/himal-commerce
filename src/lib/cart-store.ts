import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Product, ProductVariant } from '@/lib/types'

type CartState = {
  items: CartItem[]
  storeId: string | null // The store the cart belongs to
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  add: (product: Product, quantity?: number, variant?: ProductVariant | null) => void
  remove: (productId: string, variantId?: string | null) => void
  setQuantity: (productId: string, quantity: number, variantId?: string | null) => void
  clear: () => void
  // derived
  count: () => number
  subtotal: () => number
}

// Match a cart line by productId + variantId (both must match)
const lineMatch = (i: CartItem, productId: string, variantId?: string | null) =>
  i.productId === productId && (i.variantId ?? null) === (variantId ?? null)

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      storeId: null,
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      add: (product, quantity = 1, variant = null) => {
        const variantId = variant?.id ?? null
        const variantTitle = variant?.title ?? null
        const linePrice = variant?.price ?? product.price

        // If cart belongs to a different store, start fresh
        if (get().storeId && get().storeId !== product.storeId) {
          set({
            items: [
              {
                productId: product.id,
                variantId,
                storeId: product.storeId,
                title: product.title,
                variantTitle,
                thumbnail: product.thumbnail,
                price: linePrice,
                quantity,
              },
            ],
            storeId: product.storeId,
            isOpen: true,
          })
          return
        }

        const items = get().items
        const existing = items.find((i) => lineMatch(i, product.id, variantId))
        if (existing) {
          set({
            items: items.map((i) =>
              lineMatch(i, product.id, variantId) ? { ...i, quantity: i.quantity + quantity } : i
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
                variantId,
                storeId: product.storeId,
                title: product.title,
                variantTitle,
                thumbnail: product.thumbnail,
                price: linePrice,
                quantity,
              },
            ],
            storeId: product.storeId,
            isOpen: true,
          })
        }
      },
      remove: (productId, variantId = null) => {
        const items = get().items.filter((i) => !lineMatch(i, productId, variantId))
        set({ items, storeId: items.length === 0 ? null : get().storeId })
      },
      setQuantity: (productId, quantity, variantId = null) =>
        set({
          items: get()
            .items.map((i) => (lineMatch(i, productId, variantId) ? { ...i, quantity } : i))
            .filter((i) => i.quantity > 0),
        }),
      clear: () => set({ items: [], storeId: null }),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: 'himal-cart' }
  )
)
