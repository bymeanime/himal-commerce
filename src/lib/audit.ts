import { db } from '@/lib/db'

// Audit log helper — call from any mutating API route (Data panel P1).
// Fire-and-forget; never blocks the response.
export async function logAudit(opts: {
  storeId?: string
  actorId?: string
  actorKind?: 'anonymous' | 'user' | 'system' | 'cron'
  action: string
  entityType: string
  entityId: string
  before?: unknown
  after?: unknown
  ip?: string
  userAgent?: string
}) {
  try {
    await db.auditLog.create({
      data: {
        storeId: opts.storeId,
        actorId: opts.actorId,
        actorKind: opts.actorKind ?? 'anonymous',
        action: opts.action,
        entityType: opts.entityType,
        entityId: opts.entityId,
        before: opts.before ? JSON.stringify(opts.before) : null,
        after: opts.after ? JSON.stringify(opts.after) : null,
        ip: opts.ip,
        userAgent: opts.userAgent,
      },
    })
  } catch (e) {
    // Audit log failure must never crash the request
    // eslint-disable-next-line no-console
    console.error('[audit] failed to log:', e)
  }
}
