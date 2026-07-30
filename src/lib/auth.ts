// Multi-tenant access control helper.
// In a real app, this would verify the user's session (next-auth, etc.)
// and check their StoreMember role for the requested store.
// For this demo (no real auth yet), we just verify the store exists.

import { db } from '@/lib/db'

export type AccessResult =
  | { ok: true; storeId: string }
  | { ok: false; error: string; status?: number }

export async function verifyStoreAccess(storeId: string): Promise<AccessResult> {
  if (!storeId) {
    return { ok: false, error: 'storeId required', status: 400 }
  }
  const store = await db.store.findUnique({
    where: { id: storeId },
    select: { id: true, status: true },
  })
  if (!store) {
    return { ok: false, error: 'store not found', status: 404 }
  }
  if (store.status === 'suspended') {
    return { ok: false, error: 'store suspended', status: 403 }
  }
  return { ok: true, storeId: store.id }
}

// Verify a resource belongs to a specific store (multi-tenant IDOR defense)
export async function verifyOwnership(
  entityType: 'product' | 'order' | 'category' | 'blogPost' | 'coupon' | 'customer',
  entityId: string,
  storeId: string
): Promise<boolean> {
  const where = { id: entityId, storeId }
  const record = await (db[entityType] as any).findUnique({ where, select: { id: true } })
  return !!record
}
