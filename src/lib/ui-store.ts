import { create } from 'zustand'

// Top-level view switcher (since only `/` route is allowed, all navigation is client-side state)
type View = 'storefront' | 'admin'
type StoreSection = 'home' | 'products' | 'about'
type AdminSection = 'dashboard' | 'products' | 'orders' | 'customers' | 'settings'

type UIState = {
  view: View
  storeSection: StoreSection
  adminSection: AdminSection
  setView: (v: View) => void
  setStoreSection: (s: StoreSection) => void
  setAdminSection: (s: AdminSection) => void
  // Product detail drawer
  selectedProductId: string | null
  setSelectedProductId: (id: string | null) => void
  // Checkout modal
  checkoutOpen: boolean
  setCheckoutOpen: (b: boolean) => void
  // Last placed order (for confirmation screen)
  lastOrderNumber: string | null
  setLastOrderNumber: (n: string | null) => void
}

export const useUI = create<UIState>((set) => ({
  view: 'storefront',
  storeSection: 'home',
  adminSection: 'dashboard',
  setView: (v) => set({ view: v }),
  setStoreSection: (s) => set({ storeSection: s }),
  setAdminSection: (s) => set({ adminSection: s }),
  selectedProductId: null,
  setSelectedProductId: (id) => set({ selectedProductId: id }),
  checkoutOpen: false,
  setCheckoutOpen: (b) => set({ checkoutOpen: b }),
  lastOrderNumber: null,
  setLastOrderNumber: (n) => set({ lastOrderNumber: n }),
}))
