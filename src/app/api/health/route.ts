import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/health — uptime + DB connectivity check (Automation panel P2).
// Register with UptimeRobot / BetterStack for free 5-min pings.
export async function GET() {
  const start = Date.now()
  try {
    // Cheap DB ping — if this fails, the DB is unreachable
    await db.$queryRaw`SELECT 1`
    const latencyMs = Date.now() - start
    return NextResponse.json({
      status: 'ok',
      db: 'ok',
      latencyMs,
      timestamp: new Date().toISOString(),
      version: '0.4.0',
    })
  } catch (e) {
    const latencyMs = Date.now() - start
    return NextResponse.json({
      status: 'degraded',
      db: 'error',
      latencyMs,
      timestamp: new Date().toISOString(),
      error: e instanceof Error ? e.message : 'unknown',
    }, { status: 503 })
  }
}
