import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

// GET /api/audit-logs?storeId=...&entity=...&action=...&limit=...
// Returns the audit log for a store, optionally filtered by entity/action.
// Used by the admin Audit Log viewer (Data + Security panels).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const adminGate = requireAdmin(req)
  if (adminGate) return adminGate
  const storeId = searchParams.get('storeId')
  if (!storeId) return NextResponse.json({ error: 'storeId is required' }, { status: 400 })

  const entity = searchParams.get('entity') // order | product | category | store | customer
  const action = searchParams.get('action') // e.g. order.update, store.update
  const limit = Math.min(Number(searchParams.get('limit') ?? 100), 500)
  const offset = Number(searchParams.get('offset') ?? 0)

  const where: Record<string, unknown> = { storeId }
  if (entity) where.entityType = entity
  if (action) where.action = action

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    db.auditLog.count({ where }),
  ])

  return NextResponse.json({ logs, total, limit, offset })
}
