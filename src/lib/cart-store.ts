import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Product, ProductVariant } from '@/lib/types'

type CartState = {
  items: CartItem[]
  storeId: string | null // The store the cart belongs to
  isOpen: boolean
  // CUST-015 fix: when a customer tries to add an item from store B while their
  // cart belongs to store A, we set `pendingSwitch` with the new product details.
  // The UI shows a confirm dialog; if the customer confirms, `confirmSwitch()`
  // wipes the cart and adds the new item. If they cancel, `cancelSwitch()` clears it.
  pendingSwitch: { product: Product; quantity: number; variant: ProductVariant | null } | null
  open: () => void
  close: () => void
  toggle: () => void
  add: (product: Product, quantity?: number, variant?: ProductVariant | null) => void
  confirmSwitch: () => void
  cancelSwitch: () => void
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
      pendingSwitch: null,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      add: (product, quantity = 1, variant = null) => {
        const variantId = variant?.id ?? null
        const variantTitle = variant?.title ?? null
        const linePrice = variant?.price ?? product.price

        // CUST-015 fix: if cart belongs to a different store, DON'T silently wipe.
        // Stash the new product in `pendingSwitch`; the UI shows a confirm dialog.
        if (get().storeId && get().storeId !== product.storeId) {
          set({
            pendingSwitch: { product, quantity, variant },
            isOpen: true, // open the drawer so the dialog is visible
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
      confirmSwitch: () => {
        // Customer confirmed — wipe old cart, add the pending item
        const pending = get().pendingSwitch
        if (!pending) return
        const { product, quantity, variant } = pending
        const variantId = variant?.id ?? null
        const variantTitle = variant?.title ?? null
        const linePrice = variant?.price ?? product.price
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
          pendingSwitch: null,
          isOpen: true,
        })
      },
      cancelSwitch: () => set({ pendingSwitch: null, isOpen: false }),
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
