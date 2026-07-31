import { NextResponse } from 'next/server'

// POST /api/admin-logout — clears the admin token cookie.
export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('himal_admin_token')
  return res
}
