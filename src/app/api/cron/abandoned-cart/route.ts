import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/cron/abandoned-cart — daily sweep of abandoned carts.
// Triggered by Vercel Cron at 09:00 UTC daily.
//
// Marketing panel P0. In production this would:
//   1. Find AbandonedCart records older than 2 hours, not yet recovered,
//      not yet sent first reminder
//   2. Send an SMS via SparrowSMS with a recovery link
//   3. Mark firstReminderSentAt
//
// For now, this is a stub that returns a count. Real SMS integration
// requires SPARROW_SMS_TOKEN env var (CEO panel — Phase 2).

export async function GET(req: NextRequest) {
  // Verify cron secret — FAIL CLOSED (QA-009 fix).
  // Previously: if CRON_SECRET was unset, the check was skipped entirely,
  // allowing anyone to trigger the cron. Now: if unset, return 500 with a
  // clear message; if set but mismatched, return 401.
  const authHeader = req.headers.get('authorization')
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return NextResponse.json(
      { error: 'CRON_SECRET env var is not set — cron endpoint is disabled. Set it in Vercel env vars and configure vercel.json crons to send it as a Bearer token.' },
      { status: 500 }
    )
  }
  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
    const candidates = await db.abandonedCart.count({
      where: {
        createdAt: { lt: twoHoursAgo },
        recoveredAt: null,
        firstReminderSentAt: null,
        customerPhone: { not: null },
      },
    })

    // TODO: when SPARROW_SMS_TOKEN is set, iterate candidates and send SMS:
    //   for each cart: sendSMS(cart.customerPhone, recoveryMessage(cart))
    //   then update firstReminderSentAt = now()

    return NextResponse.json({
      ok: true,
      candidates,
      message: candidates > 0 && !process.env.SPARROW_SMS_TOKEN
        ? `${candidates} abandoned carts eligible for reminder, but SPARROW_SMS_TOKEN is not set — no SMS sent.`
        : `${candidates} abandoned carts processed.`,
    })
  } catch (e) {
    return NextResponse.json({ error: 'Cron failed', message: e instanceof Error ? e.message : 'unknown' }, { status: 500 })
  }
}
