import { NextRequest, NextResponse } from 'next/server'

// POST /api/admin-login
// Body: { token: string }
// Sets a httpOnly cookie `himal_admin_token` if the token matches ADMIN_TOKEN.
// Used by the admin UI's login prompt.
//
// This is a stopgap until real next-auth is integrated. See src/lib/admin-auth.ts.

const ADMIN_TOKEN = process.env.ADMIN_TOKEN

export async function POST(req: NextRequest) {
  if (!ADMIN_TOKEN) {
    return NextResponse.json(
      { error: 'Admin login is disabled. Set ADMIN_TOKEN env var to enable.' },
      { status: 503 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const token = body?.token

  if (typeof token !== 'string' || token !== ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('himal_admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
  return res
}
