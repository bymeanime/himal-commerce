import { NextRequest, NextResponse } from 'next/server'

// CSRF defense — Origin/Referer allowlist for state-changing methods.
// (Cybersecurity panel P0). JSON Content-Type provides partial protection
// via CORS preflight, but Origin check is the proper defense — especially
// important when next-auth session cookies land.
//
// Also strips `?ref=` affiliate codes into a first-party cookie for 30-day
// attribution (Marketing panel — Affiliate P1).

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || ''

export function middleware(req: NextRequest) {
  const method = req.method.toUpperCase()

  // ====== Affiliate referral capture ======
  // Parse ?ref=CODE and set a 30-day cookie + localStorage backup
  const ref = req.nextUrl.searchParams.get('ref')
  if (ref) {
    const res = NextResponse.next(req)
    // First-party cookie, SameSite=Lax, 30 days
    res.cookies.set('himal-ref', ref, {
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false, // needs to be readable by client JS for localStorage backup
      path: '/',
    })
    return res
  }

  // ====== CSRF: Origin/Referer check for state-changing methods ======
  // GET/HEAD/OPTIONS are safe; everything else requires same-origin.
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const origin = req.headers.get('origin')
    const referer = req.headers.get('referer')

    // Allow if no APP_URL configured (dev mode) — but still verify origin/referer
    // matches the host header to prevent cross-origin POSTs from arbitrary sites.
    const host = req.headers.get('host')
    const allowedOrigins = APP_URL
      ? [APP_URL, `https://${host}`, `http://${host}`]
      : [`https://${host}`, `http://${host}`]

    const suppliedOrigin = origin || (referer ? new URL(referer).origin : null)
    if (!suppliedOrigin || !allowedOrigins.some(allowed => suppliedOrigin === allowed)) {
      return new NextResponse(
        JSON.stringify({ error: { code: 'CSRF_INVALID_ORIGIN', message: 'Cross-origin requests are not allowed for this endpoint.' } }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  // Apply to all routes except Next.js internals and static assets.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)).*)',
  ],
}
