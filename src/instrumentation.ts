// Next.js instrumentation hook — runs once on server startup.
// Used for Sentry + OpenTelemetry initialization.
// See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  // Sentry initialization (only if DSN is configured)
  // To enable: install @sentry/nextjs and set SENTRY_DSN env var
  if (process.env.SENTRY_DSN) {
    try {
      // Dynamic import so we don't ship Sentry code unless configured
      // const Sentry = await import('@sentry/nextjs')
      // Sentry.init({
      //   dsn: process.env.SENTRY_DSN,
      //   tracesSampleRate: 0.1, // 10% of transactions traced
      //   environment: process.env.NODE_ENV,
      //   release: process.env.VERCEL_GIT_COMMIT_SHA,
      // })
      console.log('[instrumentation] SENTRY_DSN set but @sentry/nextjs not installed — install to enable')
    } catch (e) {
      console.warn('[instrumentation] Sentry init failed:', e)
    }
  }

  // Basic startup log (useful for debugging Vercel cold starts)
  if (process.env.NODE_ENV === 'production') {
    console.log(`[instrumentation] Himal Commerce starting up — region: ${process.env.VERCEL_REGION ?? 'local'}`)
  }
}
