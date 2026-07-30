import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/export/products?storeId=...
// Returns a CSV of products for the given store. Used by merchants for
// inventory reconciliation, marketplace feeds, and VAT audit.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('storeId')
  if (!storeId) return NextResponse.json({ error: 'storeId is required' }, { status: 400 })

  const products = await db.product.findMany({
    where: { storeId },
    include: {
      category: { select: { name: true } },
      variants: { select: { id: true, title: true, sku: true, price: true, inventory: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const headers = [
    'id', 'title', 'slug', 'subtitle', 'status', 'category',
    'price_paisa', 'compare_at_paisa', 'sku', 'gtin', 'barcode',
    'inventory', 'low_stock_threshold', 'weight_grams',
    'origin', 'is_handmade', 'restricted_category', 'age_restricted',
    'view_count', 'created_at', 'updated_at',
    'variants_count', 'variants_summary',
  ]

  const escape = (s: unknown) => {
    if (s === null || s === undefined) return ''
    const str = String(s)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const rows = products.map(p => [
    p.id,
    p.title,
    p.slug || '',
    p.subtitle || '',
    p.status,
    p.category?.name || '',
    p.price,
    p.compareAt || '',
    p.sku || '',
    p.gtin || '',
    p.barcode || '',
    p.inventory,
    p.lowStockThreshold,
    p.weightGrams || '',
    p.origin || '',
    p.isHandmade ? 'yes' : 'no',
    p.restrictedCategory || 'none',
    p.ageRestricted ? 'yes' : 'no',
    p.viewCount,
    p.createdAt.toISOString(),
    p.updatedAt.toISOString(),
    p.variants.length,
    p.variants.map(v => `${v.title} (sku=${v.sku || 'n/a'}, inv=${v.inventory}, price=${v.price ?? 'inherit'})`).join(' | '),
  ].map(escape).join(','))

  const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n')

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="products-${storeId}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
