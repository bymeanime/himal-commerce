import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Top-level view switcher (since only `/` route is allowed)
type View = 'platform' | 'storefront' | 'admin'
type StoreSection = 'home' | 'products' | 'about' | 'category'
type AdminSection = 'dashboard' | 'products' | 'orders' | 'customers' | 'categories' | 'settings'
type PlatformSection = 'home' | 'stores' | 'super-admin'

type UIState = {
  // Top-level: which "world" are we in?
  view: View
  // Current store (null = platform-level view, no store picked)
  currentStoreId: string | null
  // Section within each view
  platformSection: PlatformSection
  storeSection: StoreSection
  adminSection: AdminSection
  // Actions
  setView: (v: View) => void
  setCurrentStoreId: (id: string | null) => void
  enterStore: (storeId: string, as: 'storefront' | 'admin') => void
  exitToPlatform: () => void
  setPlatformSection: (s: PlatformSection) => void
  setStoreSection: (s: StoreSection) => void
  setAdminSection: (s: AdminSection) => void
  // Storefront: which category are we browsing?
  selectedCategorySlug: string | null
  setSelectedCategorySlug: (slug: string | null) => void
  // Product detail drawer
  selectedProductId: string | null
  setSelectedProductId: (id: string | null) => void
  // Checkout modal
  checkoutOpen: boolean
  setCheckoutOpen: (b: boolean) => void
  // Last placed order
  lastOrderNumber: string | null
  setLastOrderNumber: (n: string | null) => void
}

export const useUI = create<UIState>()(
  persist(
    (set) => ({
      view: 'platform',
      currentStoreId: null,
      platformSection: 'home',
      storeSection: 'home',
      adminSection: 'dashboard',
      setView: (v) => set({ view: v }),
      setCurrentStoreId: (id) => set({ currentStoreId: id }),
      enterStore: (storeId, as) =>
        set({ currentStoreId: storeId, view: as }),
      exitToPlatform: () =>
        set({ view: 'platform', currentStoreId: null, platformSection: 'home' }),
      setPlatformSection: (s) => set({ platformSection: s }),
      setStoreSection: (s) => set({ storeSection: s }),
      setAdminSection: (s) => set({ adminSection: s }),
      selectedCategorySlug: null,
      setSelectedCategorySlug: (slug) => set({ selectedCategorySlug: slug }),
      selectedProductId: null,
      setSelectedProductId: (id) => set({ selectedProductId: id }),
      checkoutOpen: false,
      setCheckoutOpen: (b) => set({ checkoutOpen: b }),
      lastOrderNumber: null,
      setLastOrderNumber: (n) => set({ lastOrderNumber: n }),
    }),
    {
      name: 'himal-ui',
      // Don't persist transient UI state — only the store selection
      partialize: (s) => ({ currentStoreId: s.currentStoreId, view: s.view }),
    }
  )
)
