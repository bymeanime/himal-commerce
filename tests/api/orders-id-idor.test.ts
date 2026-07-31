import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Integration tests that exercise the ACTUAL /api/orders/[id] route handler
// (not a replica of the pattern). This catches IDORs that a unit test of a
// helper function would miss — QA-001 fix verification.
//
// We mock Prisma so these tests run without a real database.

type Order = {
  id: string
  storeId: string
  orderNumber: string
  status: string
  paymentStatus: string
  fulfillment: string
  total: number
  codVerified: boolean
  verificationStatus: string
  customerPhone: string
  customerName: string
  shippingAddress: string
  shippingCity: string
  shippingDistrict: string
  shippingZone: string
  subtotal: number
  shippingCost: number
  items: unknown[]
  events: unknown[]
}

const orders: Record<string, Order> = {
  'ord-A1': {
    id: 'ord-A1', storeId: 'store-A', orderNumber: 'HC-1001',
    status: 'pending', paymentStatus: 'unpaid', fulfillment: 'unfulfilled',
    total: 5000, codVerified: false, verificationStatus: 'unverified',
    customerPhone: '9800000001', customerName: 'A Customer',
    shippingAddress: 'addr', shippingCity: 'Kathmandu', shippingDistrict: 'Kathmandu', shippingZone: 'Bagmati',
    subtotal: 4500, shippingCost: 500, items: [], events: [],
  },
  'ord-B1': {
    id: 'ord-B1', storeId: 'store-B', orderNumber: 'HC-2001',
    status: 'pending', paymentStatus: 'unpaid', fulfillment: 'unfulfilled',
    total: 9999, codVerified: false, verificationStatus: 'unverified',
    customerPhone: '9800000002', customerName: 'B Customer',
    shippingAddress: 'addr', shippingCity: 'Pokhara', shippingDistrict: 'Kaski', shippingZone: 'Gandaki',
    subtotal: 9499, shippingCost: 500, items: [], events: [],
  },
}

const prismaMock = {
  order: {
    findUnique: vi.fn(async ({ where }: { where: { id: string } }) => orders[where.id] ?? null),
    update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const existing = orders[where.id]
      if (!existing) throw new Error('not found')
      const updated = { ...existing, ...data }
      orders[where.id] = updated as Order
      return { ...updated, items: [], store: { id: existing.storeId, name: 'Test', slug: 'test' } }
    }),
    delete: vi.fn(async ({ where }: { where: { id: string } }) => {
      delete orders[where.id]
      return {}
    }),
  },
  orderEvent: {
    create: vi.fn(async () => ({})),
  },
}

vi.mock('@/lib/db', () => ({ db: prismaMock }))
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(async () => ({})) }))

// Import AFTER mocks are set up
const route = await import('@/app/api/orders/[id]/route')

function makeReq(url: string, method = 'GET', body?: unknown) {
  const init: RequestInit = { method }
  if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' }
    init.body = JSON.stringify(body)
  }
  return new NextRequest(`http://localhost${url}`, init)
}

describe('/api/orders/[id] — multi-tenant IDOR protection (QA-001 fix)', () => {
  beforeEach(() => {
    // Reset orders between tests
    orders['ord-A1'].storeId = 'store-A'
    orders['ord-B1'].storeId = 'store-B'
    orders['ord-A1'].status = 'pending'
    orders['ord-A1'].codVerified = false
    orders['ord-A1'].verificationStatus = 'unverified'
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('returns 400 when storeId is missing (was previously optional → IDOR)', async () => {
      const req = makeReq('/api/orders/ord-A1')
      const res = await route.GET(req, { params: Promise.resolve({ id: 'ord-A1' }) })
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toMatch(/storeId is required/)
    })

    it('returns 404 when storeId does NOT match (cross-tenant blocked)', async () => {
      // Store A tries to read Store B's order
      const req = makeReq('/api/orders/ord-B1?storeId=store-A')
      const res = await route.GET(req, { params: Promise.resolve({ id: 'ord-B1' }) })
      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.error).toMatch(/not found/i)
    })

    it('returns the order when storeId matches', async () => {
      const req = makeReq('/api/orders/ord-A1?storeId=store-A')
      const res = await route.GET(req, { params: Promise.resolve({ id: 'ord-A1' }) })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.order.id).toBe('ord-A1')
      expect(body.order.storeId).toBe('store-A')
    })
  })

  describe('PATCH — COD verification workflow (STAFF-008 fix)', () => {
    it('allows staff to mark codVerified when storeId matches', async () => {
      const req = makeReq('/api/orders/ord-A1', 'PATCH', {
        storeId: 'store-A',
        codVerified: true,
        codVerificationMethod: 'phone_call',
        verificationStatus: 'otp_verified',
      })
      const res = await route.PATCH(req, { params: Promise.resolve({ id: 'ord-A1' }) })
      expect(res.status).toBe(200)
      // Confirm the update was actually persisted
      expect(orders['ord-A1'].codVerified).toBe(true)
      expect(orders['ord-A1'].codVerificationMethod).toBe('phone_call')
    })

    it('rejects codVerified update from a different store (cross-tenant)', async () => {
      const req = makeReq('/api/orders/ord-B1', 'PATCH', {
        storeId: 'store-A', // attacker's store
        codVerified: true,
      })
      const res = await route.PATCH(req, { params: Promise.resolve({ id: 'ord-B1' }) })
      expect(res.status).toBe(404)
      // Confirm the update was NOT applied
      expect(orders['ord-B1'].codVerified).toBe(false)
    })

    it('rejects invalid status transitions (state machine)', async () => {
      // pending → delivered is NOT allowed (must go through processing → shipped → delivered)
      const req = makeReq('/api/orders/ord-A1', 'PATCH', {
        storeId: 'store-A',
        status: 'delivered',
      })
      const res = await route.PATCH(req, { params: Promise.resolve({ id: 'ord-A1' }) })
      expect(res.status).toBe(409)
      const body = await res.json()
      expect(body.error.code).toBe('INVALID_TRANSITION')
    })

    it('allows valid status transition (pending → processing)', async () => {
      const req = makeReq('/api/orders/ord-A1', 'PATCH', {
        storeId: 'store-A',
        status: 'processing',
      })
      const res = await route.PATCH(req, { params: Promise.resolve({ id: 'ord-A1' }) })
      expect(res.status).toBe(200)
      expect(orders['ord-A1'].status).toBe('processing')
    })
  })
})
