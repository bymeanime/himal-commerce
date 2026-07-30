import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { trackEvent } from '@/lib/analytics-server'
import { logAudit } from '@/lib/audit'

// POST /api/contact — public contact form submission.
// Stores the message as an AnalyticsEvent of type 'contact_message' so it
// appears in the store's dashboard analytics, AND logs an audit entry so the
// store owner has a record. We don't expose PII (phone/email) beyond what the
// customer already typed.
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { storeId, name, phone, email, message } = body

  if (!storeId) {
    return NextResponse.json({ error: 'storeId is required' }, { status: 400 })
  }
  if (!name || !phone || !message) {
    return NextResponse.json(
      { error: 'Name, phone, and message are required' },
      { status: 400 }
    )
  }

  // Basic phone sanity (less strict than newsletter — accept any non-empty
  // string of digits/spaces/dashes/plus, since some customers use landlines)
  const cleanedPhone = phone.replace(/[\s\-()]/g, '')
  if (!/^\+?\d{7,15}$/.test(cleanedPhone)) {
    return NextResponse.json(
      { error: 'Please enter a valid phone number' },
      { status: 400 }
    )
  }

  // Validate email format if provided
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }
  }

  // Rate-limit-ish: check if this phone already sent a contact message in the
  // last 10 minutes — if so, ask them to wait. (Real rate-limiting is in
  // middleware; this is a soft check.)
  const recentEvent = await db.analyticsEvent.findFirst({
    where: {
      storeId,
      type: 'contact_message',
      createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
    },
    orderBy: { createdAt: 'desc' },
  })
  if (recentEvent) {
    const meta = recentEvent.meta ? JSON.parse(recentEvent.meta) : {}
    if (meta.phone === cleanedPhone) {
      return NextResponse.json(
        { error: 'You just sent a message. Please wait a few minutes before sending another.' },
        { status: 429 }
      )
    }
  }

  // Record as analytics event (so it shows up in the dashboard funnel)
  await trackEvent(storeId, 'contact_message', {
    sessionId: req.headers.get('x-session-id') || 'anon',
    meta: {
      name: String(name).slice(0, 100),
      phone: cleanedPhone,
      email: email ? String(email).slice(0, 200) : undefined,
      message: String(message).slice(0, 2000),
    },
  })

  // Also log an audit entry (so it appears in the store's audit log)
  await logAudit({
    storeId,
    actorKind: 'anonymous',
    action: 'contact.message',
    entityType: 'store',
    entityId: storeId,
    after: JSON.stringify({ name, phone: cleanedPhone, email: email || null, message: String(message).slice(0, 500) }),
    ip: req.headers.get('x-forwarded-for') || undefined,
    userAgent: req.headers.get('user-agent') || undefined,
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
