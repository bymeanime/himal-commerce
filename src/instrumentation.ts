// Next.js instrumentation hook — runs once on server startup.
// Used for Sentry + OpenTelemetry initialization.
// See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  // Sentry initialization (only if DSN is configured)
  if (process.env.SENTRY_DSN) {
    try {
      const Sentry = await import('@sentry/nextjs')
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        tracesSampleRate: 0.1, // 10% of transactions traced
        environment: process.env.NODE_ENV,
        release: process.env.VERCEL_GIT_COMMIT_SHA,
        // Filter noisy errors
        ignoreErrors: [
          'NEXT_NOT_FOUND',
          'NEXT_REDIRECT',
          // Browser extensions
          'top.GLOBALS',
          'ResizeObserver loop',
        ],
        denyUrls: [
          // Chrome extensions
          /extensions\//i,
          /^chrome:\/\//i,
        ],
      })
      if (process.env.NODE_ENV === 'production') {
        console.log('[instrumentation] Sentry initialized')
      }
    } catch (e) {
      console.warn('[instrumentation] Sentry init failed:', e)
    }
  }

  // Basic startup log (useful for debugging Vercel cold starts)
  if (process.env.NODE_ENV === 'production') {
    console.log(`[instrumentation] Himal Commerce starting up — region: ${process.env.VERCEL_REGION ?? 'local'}`)
  }
}
