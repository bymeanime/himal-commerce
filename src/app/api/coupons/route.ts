import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/coupons?storeId=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('storeId')
  const status = searchParams.get('status') || 'active'

  if (!storeId) {
    return NextResponse.json({ error: 'storeId is required' }, { status: 400 })
  }

  const where: Record<string, unknown> = { storeId }
  if (status !== 'all') where.status = status

  const coupons = await db.coupon.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ coupons })
}

// POST /api/coupons — create a new coupon
export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    storeId,
    code,
    type,
    value,
    minSubtotal,
    maxRedemptions,
    perCustomerLimit,
    startsAt,
    endsAt,
    status,
  } = body

  if (!storeId || !code || !type || value === undefined) {
    return NextResponse.json(
      { error: 'storeId, code, type, and value are required' },
      { status: 400 }
    )
  }

  if (!['percent', 'fixed', 'free_shipping'].includes(type)) {
    return NextResponse.json({ error: 'Invalid coupon type' }, { status: 400 })
  }

  // Check uniqueness within store
  const existing = await db.coupon.findUnique({
    where: { storeId_code: { storeId, code: code.toUpperCase() } },
  })
  if (existing) {
    return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 })
  }

  const coupon = await db.coupon.create({
    data: {
      storeId,
      code: code.toUpperCase(),
      type,
      value: parseInt(value, 10),
      minSubtotal: minSubtotal ? parseInt(minSubtotal, 10) : null,
      maxRedemptions: maxRedemptions ? parseInt(maxRedemptions, 10) : null,
      perCustomerLimit: perCustomerLimit ? parseInt(perCustomerLimit, 10) : null,
      startsAt: startsAt ? new Date(startsAt) : null,
      endsAt: endsAt ? new Date(endsAt) : null,
      status: status || 'active',
    },
  })

  return NextResponse.json({ coupon }, { status: 201 })
}

// PATCH /api/coupons — validate a coupon code against a cart subtotal
// Called from the checkout flow: POST /api/coupons with { action: 'validate', storeId, code, subtotal }
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { action, storeId, code, subtotal } = body

  if (action !== 'validate') {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
  if (!storeId || !code) {
    return NextResponse.json({ error: 'storeId and code are required' }, { status: 400 })
  }

  const coupon = await db.coupon.findUnique({
    where: { storeId_code: { storeId, code: code.toUpperCase() } },
  })

  if (!coupon || coupon.status !== 'active') {
    return NextResponse.json({ valid: false, error: 'Invalid or inactive coupon code' })
  }

  const now = new Date()
  if (coupon.startsAt && now < coupon.startsAt) {
    return NextResponse.json({ valid: false, error: 'This coupon is not yet active' })
  }
  if (coupon.endsAt && now > coupon.endsAt) {
    return NextResponse.json({ valid: false, error: 'This coupon has expired' })
  }
  if (coupon.maxRedemptions && coupon.usageCount >= coupon.maxRedemptions) {
    return NextResponse.json({ valid: false, error: 'This coupon has reached its redemption limit' })
  }
  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
    return NextResponse.json({
      valid: false,
      error: `Minimum subtotal of रू ${(coupon.minSubtotal / 100).toLocaleString('en-IN')} required`,
    })
  }

  // Calculate discount
  let discountAmount = 0
  let freeShipping = false
  if (coupon.type === 'percent') {
    discountAmount = Math.round((subtotal * coupon.value) / 10000) // value is in bps
  } else if (coupon.type === 'fixed') {
    discountAmount = Math.min(coupon.value, subtotal) // can't discount more than subtotal
  } else if (coupon.type === 'free_shipping') {
    freeShipping = true
  }

  return NextResponse.json({
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
    },
    discountAmount,
    freeShipping,
  })
}
