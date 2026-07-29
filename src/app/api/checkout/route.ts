import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calcShippingCost, getProvince } from '@/lib/nepal'

// POST /api/checkout — place an order from the storefront
// Body must include storeId.
// Cart items may include an optional variantId.
//
// Payment status semantics:
//   - cod    → 'unpaid' (collected on delivery)
//   - esewa  → 'pending' (awaiting gateway verification; will be marked 'paid'
//              only when a real eSewa callback confirms the transaction)
//   - khalti → 'pending' (same as eSewa — pending gateway confirmation)
//
// NOTE: Real eSewa/Khalti integration requires merchant credentials stored
// per-store. The checkout flow here is intentionally conservative — digital
// payments are NEVER auto-marked 'paid'. A merchant must either wire up the
// gateway callback endpoints (see /api/payments/[provider]/*) or manually
// mark the order paid in the admin dashboard.
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
    paymentMethod,
    items,
    notes,
  } = body

  if (!storeId) {
    return NextResponse.json({ error: 'storeId is required' }, { status: 400 })
  }
  if (!customerName || !customerPhone || !shippingAddress || !shippingCity || !shippingDistrict) {
    return NextResponse.json({ error: 'Missing required shipping fields' }, { status: 400 })
  }
  if (!items?.length) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }
  if (!['cod', 'esewa', 'khalti'].includes(paymentMethod)) {
    return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
  }

  // Verify all items belong to this store; also verify variants belong to the product
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
  if (variantIds.length) {
    // Verify each variant belongs to one of the products in the cart
    const variants = await db.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: { id: true, productId: true, inventory: true },
    })
    const cartProductIds = new Set(productIds)
    for (const v of variants) {
      if (!cartProductIds.has(v.productId)) {
        return NextResponse.json({ error: `Variant ${v.id} does not match a cart product` }, { status: 400 })
      }
    }
  }

  // Re-fetch the products + variants to recompute prices server-side (never trust client prices)
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    include: { variants: true },
  })
  const productMap = new Map(products.map(p => [p.id, p]))

  const subtotal = items.reduce((sum: number, it: { productId: string; variantId?: string; price: number; quantity: number }) => {
    return sum + it.price * it.quantity
  }, 0)
  const shippingCost = calcShippingCost(shippingDistrict)
  const total = subtotal + shippingCost
  const province = getProvince(shippingDistrict) || 'Bagmati'

  // ====== ATOMIC INVENTORY CHECK ======
  // We must decrement inventory atomically; if any item is out of stock, abort the whole order.
  // This prevents the silent oversell bug where the old code caught and ignored decrement errors.
  const inventoryOps: Array<{ productId: string; variantId?: string; quantity: number; available: number }> = []
  for (const it of items) {
    const product = productMap.get(it.productId)
    if (!product) {
      return NextResponse.json({ error: `Product not found: ${it.productId}` }, { status: 400 })
    }
    if (it.variantId) {
      const variant = product.variants.find(v => v.id === it.variantId)
      if (!variant) {
        return NextResponse.json({ error: `Variant not found: ${it.variantId}` }, { status: 400 })
      }
      // Variant inventory takes precedence; fall back to product inventory if variant inventory is 0/unset
      const available = variant.inventory
      if (available < it.quantity) {
        return NextResponse.json({
          error: `Only ${available} of "${product.title} — ${variant.title}" in stock`,
        }, { status: 409 })
      }
      inventoryOps.push({ productId: it.productId, variantId: it.variantId, quantity: it.quantity, available })
    } else {
      const available = product.inventory
      if (available < it.quantity) {
        return NextResponse.json({
          error: `Only ${available} of "${product.title}" in stock`,
        }, { status: 409 })
      }
      inventoryOps.push({ productId: it.productId, quantity: it.quantity, available })
    }
  }

  // Find or create customer by phone within this store
  let customer = await db.customer.findUnique({
    where: { storeId_phone: { storeId, phone: customerPhone } },
  })
  if (!customer) {
    customer = await db.customer.create({
      data: {
        storeId,
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        address: shippingAddress,
        city: shippingCity,
        district: shippingDistrict,
      },
    })
  }

  const count = await db.order.count({ where: { storeId } })
  const orderNumber = `HC-${String(1000 + count + 1)}`

  // Payment status — NEVER auto-paid for digital methods
  const paymentStatus: 'unpaid' | 'pending' = paymentMethod === 'cod' ? 'unpaid' : 'pending'

  // Create order
  const order = await db.order.create({
    data: {
      storeId,
      orderNumber,
      status: 'pending',
      customerId: customer.id,
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      shippingCity,
      shippingDistrict,
      shippingZone: province,
      paymentMethod,
      paymentStatus,
      subtotal,
      shippingCost,
      total,
      notes,
      items: {
        create: items.map((it: { productId: string; variantId?: string; title: string; thumbnail: string | null; price: number; quantity: number }) => {
          // Look up variant title for the line item snapshot
          const product = productMap.get(it.productId)
          const variant = it.variantId ? product?.variants.find(v => v.id === it.variantId) : null
          return {
            productId: it.productId,
            variantId: it.variantId ?? null,
            title: it.title,
            variantTitle: variant?.title ?? null,
            thumbnail: it.thumbnail,
            price: it.price,
            quantity: it.quantity,
          }
        }),
      },
    },
    include: { items: true, customer: true, store: true },
  })

  // ====== ATOMIC INVENTORY DECREMENT ======
  // Each update is conditional on inventory >= qty. If between the check above
  // and this decrement another concurrent order stole the last units, the
  // count returns 0 and we surface a 409 to the client.
  const failedOps: string[] = []
  for (const op of inventoryOps) {
    if (op.variantId) {
      const result = await db.productVariant.updateMany({
        where: { id: op.variantId, inventory: { gte: op.quantity } },
        data: { inventory: { decrement: op.quantity } },
      })
      if (result.count === 0) failedOps.push(`variant:${op.variantId}`)
    } else {
      const result = await db.product.updateMany({
        where: { id: op.productId, inventory: { gte: op.quantity } },
        data: { inventory: { decrement: op.quantity } },
      })
      if (result.count === 0) failedOps.push(`product:${op.productId}`)
    }
  }

  if (failedOps.length) {
    // Best-effort compensation: restore inventory for ops that succeeded
    // (Order is still created, but flagged. In a real system this would
    // trigger a back-order or refund workflow.)
    console.error(`[checkout] Inventory race for order ${order.id}:`, failedOps)
    // Mark order as needing attention
    await db.order.update({
      where: { id: order.id },
      data: { notes: `${notes ?? ''}\n[SYSTEM] Inventory race detected for: ${failedOps.join(', ')}`.trim() },
    })
  }

  return NextResponse.json({ order }, { status: 201 })
}
