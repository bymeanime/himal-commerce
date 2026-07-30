import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/export/customers?storeId=...
// Returns a CSV of customers for the given store. Used by merchants for
// newsletter imports, segment exports, and GDPR data-portability requests.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('storeId')
  if (!storeId) return NextResponse.json({ error: 'storeId is required' }, { status: 400 })

  const customers = await db.customer.findMany({
    where: { storeId },
    include: {
      _count: { select: { orders: true } },
      orders: {
        select: { total: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const headers = [
    'id', 'name', 'phone', 'email', 'address', 'city', 'district',
    'marketing_opt_in', 'consent_at', 'preferred_currency',
    'orders_count', 'last_order_total_paisa', 'last_order_date', 'last_order_status',
    'created_at',
  ]

  const escape = (s: unknown) => {
    if (s === null || s === undefined) return ''
    const str = String(s)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const rows = customers.map(c => [
    c.id,
    c.name,
    c.phone,
    c.email || '',
    c.address || '',
    c.city || '',
    c.district || '',
    c.marketingOptIn ? 'yes' : 'no',
    c.consentAt ? c.consentAt.toISOString() : '',
    c.preferredDisplayCurrency || '',
    c._count.orders,
    c.orders[0]?.total ?? '',
    c.orders[0]?.createdAt.toISOString() ?? '',
    c.orders[0]?.status ?? '',
    c.createdAt.toISOString(),
  ].map(escape).join(','))

  const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n')

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="customers-${storeId}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
