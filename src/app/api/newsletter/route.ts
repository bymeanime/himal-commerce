import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'

// POST /api/newsletter — subscribe a phone/email to a store's newsletter.
// Marketing panel P0. Phone-first for Nepal (SMS open rates 95%+ vs email 15-20%).
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { storeId, phone, email, source = 'footer' } = body

  if (!storeId) return NextResponse.json({ error: 'storeId is required' }, { status: 400 })
  if (!phone && !email) return NextResponse.json({ error: 'Phone or email is required' }, { status: 400 })

  // Validate phone (Nepal mobile) if provided
  if (phone) {
    const cleaned = phone.replace(/[\s-]/g, '').replace(/^\+977/, '')
    if (!/^9[678]\d{8}$/.test(cleaned)) {
      return NextResponse.json({ error: { code: 'INVALID_PHONE', message: 'Please enter a valid Nepal mobile number (98XXXXXXXX).' } }, { status: 400 })
    }
  }
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: { code: 'INVALID_EMAIL', message: 'Please enter a valid email address.' } }, { status: 400 })
    }
  }

  // Idempotent — if subscriber already exists, just update consent timestamp
  const existing = await db.newsletterSubscriber.findFirst({
    where: {
      storeId,
      OR: [
        ...(phone ? [{ phone }] : []),
        ...(email ? [{ email }] : []),
      ],
    },
  })

  if (existing) {
    if (existing.unsubscribedAt) {
      // Re-subscribe
      await db.newsletterSubscriber.update({
        where: { id: existing.id },
        data: { unsubscribedAt: null, consentAt: new Date(), source },
      })
    }
    return NextResponse.json({ ok: true, reactivated: true })
  }

  const subscriber = await db.newsletterSubscriber.create({
    data: {
      storeId,
      phone: phone || null,
      email: email || null,
      source,
      consentAt: new Date(),
    },
  })

  await logAudit({
    storeId,
    actorKind: 'anonymous',
    action: 'newsletter.subscribe',
    entityType: 'newsletter_subscriber',
    entityId: subscriber.id,
  })

  return NextResponse.json({ ok: true, subscriber }, { status: 201 })
}

// PATCH /api/newsletter — unsubscribe (opt-out)
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { storeId, phone, email } = body

  if (!storeId) return NextResponse.json({ error: 'storeId is required' }, { status: 400 })

  const sub = await db.newsletterSubscriber.findFirst({
    where: {
      storeId,
      OR: [
        ...(phone ? [{ phone }] : []),
        ...(email ? [{ email }] : []),
      ],
    },
  })

  if (!sub) return NextResponse.json({ ok: true, notFound: true })

  await db.newsletterSubscriber.update({
    where: { id: sub.id },
    data: { unsubscribedAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
