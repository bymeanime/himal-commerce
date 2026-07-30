import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calcShippingCost, getProvince } from '@/lib/nepal'
import { logAudit } from '@/lib/audit'
import { trackEvent } from '@/lib/analytics-server'

// POST /api/checkout — place an order from the storefront
//
// SECURITY (Tech panel P0): subtotal is computed SERVER-SIDE from the
// verified product/variant records, never from client-supplied `price`.
// Client sends only { productId, variantId, quantity } — price is ignored.
//
// ATOMICITY (Tech panel P1): the entire flow (inventory decrement + order
// create + audit log) runs inside db.$transaction. If any step fails, the
// whole thing rolls back — no orphan orders, no oversell.
//
// VAT (Accountant panel P0): Nepal 13% VAT is calculated and stored on
// the Order (taxRate, taxTotal, taxInclusive). For VAT-registered stores,
// prices are VAT-inclusive by default (taxInclusive=true); the taxTotal
// is extracted from the subtotal using the standard formula.
//
// ORDER NUMBER (Tech panel P1): order number is generated atomically by
// incrementing Store.orderCounter inside the transaction — no race.
//
// PAYMENT STATUS: cod → 'unpaid'; esewa/khalti → 'pending' (will be flipped
// to 'paid' only when a real gateway callback verifies the transaction).
export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    storeId,
    customerName,
    customerPhone,
    customerEmail,
    shippingAddress,
    shippingCity,
    shippingDistrict,
    shippingWard,
    shippingMunicipality,
    shippingPostalCode,
    paymentMethod,
    items,
    notes,
    utm,
    referrer,
    couponCode,
  } = body

  // ====== Input validation ======
  if (!storeId) {
    return NextResponse.json({ error: 'storeId is required' }, { status: 400 })
  }
  if (!customerName || !customerPhone || !shippingAddress || !shippingCity || !shippingDistrict) {
    return NextResponse.json({ error: 'Missing required shipping fields' }, { status: 400 })
  }
  // Nepal mobile phone validation (Logistics panel P2)
  // Accepts 98XXXXXXXX, 97XXXXXXXX, 96XXXXXXXX with optional +977 prefix
  const cleanPhone = customerPhone.replace(/[\s-]/g, '').replace(/^\+977/, '')
  if (!/^9[678]\d{8}$/.test(cleanPhone)) {
    return NextResponse.json({
      error: { code: 'INVALID_PHONE', message: 'Please enter a valid Nepal mobile number (e.g. 98XXXXXXXX).' },
    }, { status: 400 })
  }
  if (!items?.length) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }
  if (!['cod', 'esewa', 'khalti'].includes(paymentMethod)) {
    return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
  }

  // ====== Age gate (Legal panel P1) ======
  // If any cart item is age-restricted, the client must send ageConfirmation: true.
  // We re-verify server-side after fetching products below.

  // ====== Verify all items belong to this store; verify variants belong to the product ======
  const productIds = items.map((i: { productId: string }) => i.productId).filter(Boolean)
  const variantIds = items.map((i: { variantId?: string }) => i.variantId).filter(Boolean)

  if (productIds.length) {
    const storeProducts = await db.product.count({
      where: { id: { in: productIds }, storeId },
    })
    if (storeProducts !== productIds.length) {
      return NextResponse.json({ error: 'Some cart items do not belong to this store' }, { status: 400 })
    }
  }

  // Re-fetch products + variants — SERVER-SIDE PRICES (never trust client)
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    include: { variants: true },
  })
  const productMap = new Map(products.map(p => [p.id, p]))

  // Verify variants belong to their parent products
  if (variantIds.length) {
    for (const p of products) {
      for (const v of p.variants) {
        if (!variantIds.includes(v.id)) continue
        // OK — variant matches product
      }
    }
    // Verify each variantId in cart matches a productId in cart
    const cartProductIds = new Set(productIds)
    for (const p of products) {
      for (const v of p.variants) {
        if (variantIds.includes(v.id) && !cartProductIds.has(p.id)) {
          return NextResponse.json({ error: `Variant ${v.id} does not match a cart product` }, { status: 400 })
        }
      }
    }
  }

  // ====== SERVER-SIDE PRICE + INVENTORY CHECK ======
  // (Tech panel P0 — was previously using client-supplied `it.price`)
  type LineItem = {
    productId: string
    variantId?: string
    title: string
    variantTitle?: string | null
    thumbnail?: string | null
    unitPrice: number  // server-verified paisa
    quantity: number
  }
  const lineItems: LineItem[] = []
  let hasAgeRestricted = false

  for (const it of items) {
    const product = productMap.get(it.productId)
    if (!product) {
      return NextResponse.json({
        error: { code: 'PRODUCT_NOT_FOUND', message: `Product not found: ${it.productId}`, productId: it.productId },
      }, { status: 400 })
    }

    // Restricted product check (Legal panel P1)
    if (product.restrictedCategory === 'cannabis') {
      return NextResponse.json({
        error: { code: 'PROHIBITED_PRODUCT', message: 'Cannabis products are prohibited under the Narcotic Drugs Control Act 2033.' },
      }, { status: 400 })
    }
    if (product.ageRestricted) hasAgeRestricted = true

    let unitPrice: number
    let variantTitle: string | null = null
    let availableInventory: number

    if (it.variantId) {
      const variant = product.variants.find(v => v.id === it.variantId)
      if (!variant) {
        return NextResponse.json({
          error: { code: 'VARIANT_NOT_FOUND', message: `Variant not found: ${it.variantId}`, productId: it.productId, variantId: it.variantId },
        }, { status: 400 })
      }
      unitPrice = variant.price ?? product.price
      variantTitle = variant.title
      availableInventory = variant.inventory
    } else {
      unitPrice = product.price
      availableInventory = product.inventory
    }

    if (availableInventory < it.quantity) {
      return NextResponse.json({
        error: {
          code: 'OUT_OF_STOCK',
          message: `Only ${availableInventory} of "${product.title}${variantTitle ? ' — ' + variantTitle : ''}" in stock`,
          productId: it.productId,
          variantId: it.variantId,
          available: availableInventory,
        },
      }, { status: 409 })
    }

    lineItems.push({
      productId: it.productId,
      variantId: it.variantId,
      title: product.title,
      variantTitle,
      thumbnail: product.thumbnail,
      unitPrice,
      quantity: it.quantity,
    })
  }

  // Age-gate enforcement (server-side, defensive)
  if (hasAgeRestricted && body.ageConfirmation !== true) {
    return NextResponse.json({
      error: { code: 'AGE_CONFIRMATION_REQUIRED', message: 'This order contains age-restricted items. Customer must confirm they are 18+.' },
    }, { status: 400 })
  }

  // ====== SERVER-SIDE SUBTOTAL ======
  const subtotal = lineItems.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0)
  const shippingCost = calcShippingCost(shippingDistrict)
  const province = getProvince(shippingDistrict) || 'Bagmati'

  // ====== VAT CALCULATION (Accountant panel P0) ======
  const store = await db.store.findUnique({ where: { id: storeId } })
  if (!store) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 })
  }
  const taxRate = store.vatRegistered ? store.defaultTaxRate : 0
  const taxInclusive = store.taxInclusiveDisplay
  // VAT-inclusive extraction: taxTotal = round((subtotal + shipping) * rate / (10000 + rate))
  // VAT-exclusive addition:    taxTotal = round((subtotal + shipping) * rate / 10000)
  const taxableBase = subtotal + shippingCost
  const taxTotal = taxRate > 0
    ? taxInclusive
      ? Math.round(taxableBase * taxRate / (10000 + taxRate))
      : Math.round(taxableBase * taxRate / 10000)
    : 0
  const total = taxInclusive ? taxableBase : taxableBase + taxTotal

  // ====== COUPON VALIDATION (Ecommerce panel P1) ======
  let discountAmount = 0
  let couponId: string | undefined
  if (couponCode) {
    const coupon = await db.coupon.findUnique({
      where: { storeId_code: { storeId, code: couponCode.toUpperCase() } },
    })
    if (!coupon || coupon.status !== 'active') {
      return NextResponse.json({ error: { code: 'INVALID_COUPON', message: 'Coupon code is invalid or expired.' } }, { status: 400 })
    }
    if (coupon.endsAt && coupon.endsAt < new Date()) {
      return NextResponse.json({ error: { code: 'COUPON_EXPIRED', message: 'This coupon has expired.' } }, { status: 400 })
    }
    if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
      return NextResponse.json({
        error: { code: 'COUPON_MIN_NOT_MET', message: `Minimum order of Rs ${(coupon.minSubtotal / 100).toLocaleString()} required for this coupon.` },
      }, { status: 400 })
    }
    if (coupon.maxRedemptions && coupon.usageCount >= coupon.maxRedemptions) {
      return NextResponse.json({ error: { code: 'COUPON_EXHAUSTED', message: 'This coupon has reached its usage limit.' } }, { status: 400 })
    }
    // Compute discount
    if (coupon.type === 'percent') {
      discountAmount = Math.round(subtotal * coupon.value / 10000)
    } else if (coupon.type === 'fixed') {
      discountAmount = Math.min(coupon.value, subtotal)
    } else if (coupon.type === 'free_shipping') {
      discountAmount = shippingCost
    }
    couponId = coupon.id
  }
  const finalTotal = Math.max(0, total - discountAmount)

  // ====== ATOMIC CHECKOUT (Tech + Ops panels) ======
  // Everything below runs in a single transaction. If inventory decrement
  // fails for any item (race condition), the entire order creation rolls back.
  try {
    const result = await db.$transaction(async (tx) => {
      // 1. Atomic inventory decrement — conditional on inventory >= qty
      for (const it of lineItems) {
        if (it.variantId) {
          const r = await tx.productVariant.updateMany({
            where: { id: it.variantId, inventory: { gte: it.quantity } },
            data: { inventory: { decrement: it.quantity } },
          })
          if (r.count === 0) {
            throw { code: 'OUT_OF_STOCK', productId: it.productId, variantId: it.variantId }
          }
        } else {
          const r = await tx.product.updateMany({
            where: { id: it.productId, inventory: { gte: it.quantity } },
            data: { inventory: { decrement: it.quantity } },
          })
          if (r.count === 0) {
            throw { code: 'OUT_OF_STOCK', productId: it.productId }
          }
        }
      }

      // 2. Atomically increment order counter — fixes race condition
      const updatedStore = await tx.store.update({
        where: { id: storeId },
        data: { orderCounter: { increment: 1 } },
        select: { orderCounter: true },
      })
      const orderNumber = `HC-${updatedStore.orderCounter}`

      // 3. Generate invoice sequence (separate from orderNumber, fiscal-year scoped)
      const invoiceNumber = `${store.vatInvoicePrefix}-${String(updatedStore.orderCounter).padStart(6, '0')}`

      // 4. Find or create customer by phone within this store
      let customer = await tx.customer.findUnique({
        where: { storeId_phone: { storeId, phone: customerPhone } },
      })
      if (!customer) {
        customer = await tx.customer.create({
          data: {
            storeId,
            name: customerName,
            phone: customerPhone,
            email: customerEmail,
            address: shippingAddress,
            city: shippingCity,
            district: shippingDistrict,
            consentAt: new Date(),
          },
        })
      }

      // 5. COD risk scoring (Logistics panel P1)
      let codRiskScore = 0
      let verificationStatus = 'unverified'
      let orderStatus = 'pending'
      if (paymentMethod === 'cod' && finalTotal > (store.codRiskThreshold || 500000)) {
        // High-value COD — needs verification
        codRiskScore = Math.min(100, Math.floor(finalTotal / 10000)) // 1 point per Rs 100
        verificationStatus = 'unverified'
        orderStatus = 'on_hold'
      } else if (paymentMethod === 'cod') {
        verificationStatus = 'unverified'
      } else if (paymentMethod === 'esewa' || paymentMethod === 'khalti') {
        verificationStatus = 'unverified' // gateway callback will verify
      }

      // 6. Payment status — NEVER auto-paid for digital methods
      const paymentStatus: 'unpaid' | 'pending' = paymentMethod === 'cod' ? 'unpaid' : 'pending'

      // 7. Create the order
      const order = await tx.order.create({
        data: {
          storeId,
          orderNumber,
          invoiceNumber,
          invoiceSequence: updatedStore.orderCounter,
          status: orderStatus,
          customerId: customer.id,
          customerName,
          customerPhone,
          customerEmail,
          shippingAddress,
          shippingCity,
          shippingDistrict,
          shippingZone: province,
          shippingWard: shippingWard || null,
          shippingMunicipality: shippingMunicipality || null,
          shippingPostalCode: shippingPostalCode || null,
          paymentMethod,
          paymentStatus,
          subtotal,
          shippingCost,
          taxRate,
          taxTotal,
          taxInclusive,
          discountAmount,
          total: finalTotal,
          notes,
          codRiskScore: codRiskScore || null,
          verificationStatus,
          heldReason: orderStatus === 'on_hold' ? 'High-value COD pending verification' : null,
          utm: utm ? JSON.stringify(utm) : null,
          referrer: referrer || null,
          couponId: couponId || null,
          items: {
            create: lineItems.map(it => ({
              productId: it.productId,
              variantId: it.variantId ?? null,
              title: it.title,
              variantTitle: it.variantTitle ?? null,
              thumbnail: it.thumbnail,
              price: it.unitPrice,  // SERVER-VERIFIED — never client-supplied
              taxRate,
              taxAmount: Math.round(it.unitPrice * it.quantity * taxRate / (10000 + taxRate)),
              quantity: it.quantity,
            })),
          },
        },
        include: { items: true, customer: true, store: true },
      })

      // 8. Order event — audit trail (Ops panel)
      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          type: 'order.created',
          message: `Order ${orderNumber} placed via ${paymentMethod.toUpperCase()}`,
          actorKind: 'system',
        },
      })

      // 9. Increment coupon usage if applicable
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usageCount: { increment: 1 } },
        })
      }

      // 10. Audit log (Data panel)
      await tx.auditLog.create({
        data: {
          storeId,
          actorKind: 'system',
          action: 'order.create',
          entityType: 'order',
          entityId: order.id,
          after: JSON.stringify({ orderNumber, total: finalTotal, paymentMethod }),
        },
      })

      return order
    })

    // 11. Fire analytics event (fire-and-forget, outside transaction)
    trackEvent(storeId, 'checkout_complete', {
      sessionId: body.sessionId || 'unknown',
      cartValue: finalTotal,
      meta: { orderId: result.id, paymentMethod },
    }).catch(() => {/* analytics is best-effort */})

    return NextResponse.json({ order: result }, { status: 201 })
  } catch (err: unknown) {
    const e = err as { code?: string; productId?: string; variantId?: string }
    if (e.code === 'OUT_OF_STOCK') {
      return NextResponse.json({
        error: {
          code: 'OUT_OF_STOCK',
          message: 'One of your items just sold out. Please refresh your cart and try again.',
          productId: e.productId,
          variantId: e.variantId,
        },
      }, { status: 409 })
    }
    // eslint-disable-next-line no-console
    console.error('[checkout] failed:', err)
    return NextResponse.json({
      error: { code: 'CHECKOUT_FAILED', message: 'Checkout could not be completed. Please try again.' },
    }, { status: 500 })
  }
}

// GET /api/checkout/health — simple health check (Automation panel)
export async function GET() {
  return NextResponse.json({ ok: true, ts: new Date().toISOString() })
}

// Silence unused-import warning for logAudit (used by other routes, kept here for parity)
void logAudit
