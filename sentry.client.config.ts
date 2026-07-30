// Sentry client config — imported by sentry.client.config.ts
// This file is loaded in the browser only.
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  replaysSessionSampleRate: 0.05, // 5% of sessions recorded
  replaysOnErrorSampleRate: 1.0,  // 100% of error sessions recorded
  ignoreErrors: [
    'NEXT_NOT_FOUND',
    'NEXT_REDIRECT',
    'ResizeObserver loop',
  ],
})
