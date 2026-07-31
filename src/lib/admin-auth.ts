// Lightweight admin auth gate.
//
// PROBLEM (QA-016 live finding): /api/orders and /api/customers GET endpoints
// have no auth at all — anyone with a storeId (publicly enumerable via /api/stores)
// can list every order with customer name/phone/email/address.
//
// The platform does not yet have next-auth wired (see auth.ts comment).
// Until it does, we use a token-based admin gate: requests must carry
// `x-admin-token: <ADMIN_TOKEN>` header OR a `himal_admin_token` cookie
// matching the server env var. The admin UI sets the cookie via /api/admin-login.
//
// This is NOT a substitute for real auth — it's a stopgap to prevent PII leaks
// while next-auth integration is in flight.
//
// When next-auth lands, replace this check with `requireAdminSession()`.

import { NextRequest, NextResponse } from 'next/server'

const ADMIN_TOKEN = process.env.ADMIN_TOKEN

export function requireAdmin(req: NextRequest): NextResponse | null {
  // Fail-closed if ADMIN_TOKEN is not configured (matches CRON_SECRET pattern).
  // This means admin endpoints will return 503 until ops sets the env var.
  if (!ADMIN_TOKEN) {
    return NextResponse.json(
      {
        error:
          'Admin endpoints are disabled. Set ADMIN_TOKEN env var and send it as x-admin-token header.',
      },
      { status: 503 }
    )
  }

  // Accept either header (for API clients) or cookie (for browser admin UI)
  const headerToken = req.headers.get('x-admin-token')
  const cookieToken = req.cookies.get('himal_admin_token')?.value
  const supplied = headerToken || cookieToken

  if (supplied !== ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Admin token required' }, { status: 401 })
  }

  return null // auth passed
}
