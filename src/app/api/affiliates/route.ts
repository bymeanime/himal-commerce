import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyStoreAccess } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('storeId')
  if (!storeId) return NextResponse.json({ error: 'storeId required' }, { status: 400 })

  const affiliates = await db.affiliate.findMany({
    where: { storeId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ affiliates })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { storeId, ...data } = body
  if (!storeId) return NextResponse.json({ error: 'storeId required' }, { status: 400 })

  const access = await verifyStoreAccess(storeId)
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 })

  if (!data.code) {
    const base = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 8)
    let suffix = ''
    for (let i = 0; i < 10; i++) {
      const candidate = base + suffix
      const exists = await db.affiliate.findUnique({
        where: { storeId_code: { storeId, code: candidate } },
      })
      if (!exists) {
        data.code = candidate
        break
      }
      suffix = String(Math.floor(Math.random() * 1000))
    }
    if (!data.code) data.code = base + Date.now().toString(36)
  }

  const affiliate = await db.affiliate.create({ data: { ...data, storeId } })
  return NextResponse.json({ affiliate }, { status: 201 })
}
