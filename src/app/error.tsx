'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

// Root error boundary — catches unhandled runtime errors so a single bad
// render doesn't white-screen the whole SPA (QA panel P1).
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[error-boundary]', error)
    // TODO: ship to Sentry once SENTRY_DSN is configured (Automation panel)
  }, [error])

  return (
    <div className="min-h-[60vh] grid place-items-center px-4">
      <div className="text-center max-w-md space-y-4">
        <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 grid place-items-center">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred. You can try again — if the problem persists, please refresh the page.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60 font-mono">Error ID: {error.digest}</p>
        )}
        <div className="flex gap-2 justify-center pt-2">
          <Button onClick={reset} variant="default">Try again</Button>
          <Button onClick={() => window.location.reload()} variant="outline">Reload page</Button>
        </div>
      </div>
    </div>
  )
}
