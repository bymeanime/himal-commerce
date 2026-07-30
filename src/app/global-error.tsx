'use client'

import { useEffect } from 'react'

// Global error boundary — catches errors thrown by the root layout itself.
// Must render its own <html><body> (Next.js requirement).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[global-error]', error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', color: '#1f2937' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Application error</h2>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
            A critical error occurred while loading the application.
          </p>
          {error.digest && (
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', fontFamily: 'monospace', marginBottom: '1rem' }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={() => reset()}
            style={{
              padding: '0.5rem 1rem',
              background: '#9C1A1A',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
