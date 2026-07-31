import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

// GET /api/export/orders?storeId=...&from=...&to=...
// Returns a CSV of orders for the given store. Used by merchants for VAT
// filing, accounting reconciliation, and shipping partner handoff.
//
// Data panel P1. UTF-8 BOM is included so Excel reads Nepali characters correctly.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const adminGate = requireAdmin(req)
  if (adminGate) return adminGate
  const storeId = searchParams.get('storeId')
  if (!storeId) return NextResponse.json({ error: 'storeId is required' }, { status: 400 })

  const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : new Date()

  const orders = await db.order.findMany({
    where: { storeId, createdAt: { gte: from, lte: to } },
    include: { items: true, customer: true },
    orderBy: { createdAt: 'desc' },
  })

  // CSV header
  const headers = [
    'order_number', 'invoice_number', 'created_at', 'customer_name', 'customer_phone',
    'customer_email', 'shipping_address', 'shipping_city', 'shipping_district',
    'shipping_zone', 'status', 'payment_method', 'payment_status',
    'subtotal_paisa', 'shipping_cost_paisa', 'tax_total_paisa', 'discount_paisa',
    'total_paisa', 'courier', 'tracking_number', 'items_count', 'items_summary',
  ]

  const escape = (s: unknown) => {
    if (s === null || s === undefined) return ''
    const str = String(s)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const rows = orders.map(o => [
    o.orderNumber,
    o.invoiceNumber || '',
    o.createdAt.toISOString(),
    o.customerName,
    o.customerPhone,
    o.customerEmail || '',
    o.shippingAddress,
    o.shippingCity,
    o.shippingDistrict,
    o.shippingZone,
    o.status,
    o.paymentMethod,
    o.paymentStatus,
    o.subtotal,
    o.shippingCost,
    o.taxTotal,
    o.discountAmount,
    o.total,
    o.courier || '',
    o.trackingNumber || '',
    o.items.length,
    o.items.map(i => `${i.quantity}× ${i.title}${i.variantTitle ? ` (${i.variantTitle})` : ''}`).join(' | '),
  ].map(escape).join(','))

  // UTF-8 BOM so Excel renders Nepali characters correctly
  const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n')

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="orders-${storeId}-${from.toISOString().slice(0,10)}-to-${to.toISOString().slice(0,10)}.csv"`,
    },
  })
}
