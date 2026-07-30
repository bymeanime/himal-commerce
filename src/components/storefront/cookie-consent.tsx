'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Cookie, X } from 'lucide-react'

// Cookie consent banner (Legal panel P1).
// Nepal Privacy Act 2075 §11 requires informed consent for non-essential
// cookies. Also covers GDPR/CCPA reach for international visitors.
//
// Essential cookies (cart, session, sidebar state) are set without consent.
// Analytics/marketing cookies are only loaded after the user accepts.
const CONSENT_KEY = 'himal-cookie-consent'
const CONSENT_VERSION = 'v1' // bump when policy changes to re-prompt

export function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY)
      if (!stored || JSON.parse(stored).version !== CONSENT_VERSION) {
        // Small delay so it doesn't fight with initial paint
        const t = setTimeout(() => setShow(true), 1500)
        return () => clearTimeout(t)
      }
    } catch {
      setShow(true)
    }
  }, [])

  const accept = (level: 'all' | 'essential') => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ version: CONSENT_VERSION, level, at: new Date().toISOString() }))
    setShow(false)
  }

  const dismiss = () => setShow(false)

  if (!show) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="rounded-xl border border-border bg-background/95 backdrop-blur shadow-2xl p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center shrink-0">
            <Cookie className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 space-y-1.5 text-sm">
            <p className="font-semibold leading-tight">We use cookies</p>
            <p className="text-muted-foreground leading-relaxed text-xs">
              Essential cookies keep your cart working. Analytics cookies help us understand what shoppers love.
              See our <a href="/cookie-policy" className="underline hover:text-foreground">Cookie Policy</a>.
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => accept('essential')}>
            Essential only
          </Button>
          <Button size="sm" className="flex-1" onClick={() => accept('all')}>
            Accept all
          </Button>
        </div>
      </div>
    </div>
  )
}
