import { describe, it, expect, beforeEach } from 'vitest'

// We test the cart-store logic in isolation. Because zustand persist uses
// localStorage (not available in node), we stub a minimal localStorage.
const store: Record<string, string> = {}
const localStorageStub = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v },
  removeItem: (k: string) => { delete store[k] },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
  key: (i: number) => Object.keys(store)[i] ?? null,
  get length() { return Object.keys(store).length },
}
;(globalThis as Record<string, unknown>).localStorage = localStorageStub
;(globalThis as Record<string, unknown>).window = { localStorage: localStorageStub }

// Import AFTER stubs are in place
const { useCart } = await import('@/lib/cart-store')

const product = {
  id: 'p1',
  storeId: 's1',
  title: 'Test Product',
  slug: 'test-product',
  subtitle: null,
  description: '',
  thumbnail: null,
  price: 5000, // Rs 50
  compareAt: null,
  sku: null,
  gtin: null,
  barcode: null,
  status: 'published' as const,
  inventory: 10,
  weightGrams: null,
  lengthMm: null,
  widthMm: null,
  heightMm: null,
  origin: null,
  isHandmade: false,
  specifications: null,
  artisanStory: null,
  careGuide: null,
  lowStockThreshold: 5,
  viewCount: 0,
  restrictedCategory: null,
  ageRestricted: false,
  minAge: 0,
  healthWarningText: null,
  requiresLicense: null,
  categoryId: null,
  category: null,
  createdAt: '',
  updatedAt: '',
}

const variant = {
  id: 'v1',
  productId: 'p1',
  sku: 'SKU-L',
  title: 'Large',
  price: 6000, // Rs 60 — overrides product price
  inventory: 3,
  attributes: { size: 'L' },
  sortOrder: 0,
}

describe('cart-store', () => {
  beforeEach(() => {
    useCart.getState().clear()
    localStorageStub.clear()
  })

  it('starts empty', () => {
    expect(useCart.getState().items).toHaveLength(0)
    expect(useCart.getState().storeId).toBeNull()
    expect(useCart.getState().count()).toBe(0)
    expect(useCart.getState().subtotal()).toBe(0)
  })

  it('adds a product and opens the cart', () => {
    useCart.getState().add(product, 2)
    const s = useCart.getState()
    expect(s.items).toHaveLength(1)
    expect(s.items[0].productId).toBe('p1')
    expect(s.items[0].quantity).toBe(2)
    expect(s.items[0].price).toBe(5000)
    expect(s.storeId).toBe('s1')
    expect(s.isOpen).toBe(true)
    expect(s.count()).toBe(2)
    expect(s.subtotal()).toBe(10000)
  })

  it('uses variant price when variant is provided', () => {
    useCart.getState().add(product, 1, variant)
    const s = useCart.getState()
    expect(s.items[0].price).toBe(6000)
    expect(s.items[0].variantId).toBe('v1')
    expect(s.items[0].variantTitle).toBe('Large')
    expect(s.subtotal()).toBe(6000)
  })

  it('merges identical lines (same product + variant)', () => {
    useCart.getState().add(product, 1)
    useCart.getState().add(product, 2)
    const s = useCart.getState()
    expect(s.items).toHaveLength(1)
    expect(s.items[0].quantity).toBe(3)
  })

  it('keeps separate lines for different variants of the same product', () => {
    useCart.getState().add(product, 1, variant)
    useCart.getState().add(product, 1, { ...variant, id: 'v2', title: 'Medium' })
    const s = useCart.getState()
    expect(s.items).toHaveLength(2)
    expect(s.count()).toBe(2)
  })

  it('clears the cart when switching stores', () => {
    useCart.getState().add(product, 3)
    expect(useCart.getState().storeId).toBe('s1')
    // Adding a product from a different store should reset
    useCart.getState().add({ ...product, storeId: 's2', id: 'p2' }, 1)
    const s = useCart.getState()
    expect(s.items).toHaveLength(1)
    expect(s.items[0].productId).toBe('p2')
    expect(s.storeId).toBe('s2')
  })

  it('removes a specific line', () => {
    useCart.getState().add(product, 1, variant)
    useCart.getState().add(product, 1, { ...variant, id: 'v2', title: 'M' })
    useCart.getState().remove('p1', 'v1')
    const s = useCart.getState()
    expect(s.items).toHaveLength(1)
    expect(s.items[0].variantId).toBe('v2')
  })

  it('sets quantity and removes when qty hits 0', () => {
    useCart.getState().add(product, 2)
    useCart.getState().setQuantity('p1', 5, null)
    expect(useCart.getState().items[0].quantity).toBe(5)
    useCart.getState().setQuantity('p1', 0, null)
    expect(useCart.getState().items).toHaveLength(0)
  })

  it('clears cart and storeId', () => {
    useCart.getState().add(product, 1)
    useCart.getState().clear()
    expect(useCart.getState().items).toHaveLength(0)
    expect(useCart.getState().storeId).toBeNull()
  })

  it('open/close/toggle the cart drawer', () => {
    useCart.getState().close()
    expect(useCart.getState().isOpen).toBe(false)
    useCart.getState().open()
    expect(useCart.getState().isOpen).toBe(true)
    useCart.getState().toggle()
    expect(useCart.getState().isOpen).toBe(false)
  })
})
