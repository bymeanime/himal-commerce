'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { useCart } from '@/lib/cart-store'
import { Button } from '@/components/ui/button'
import { X, Clock, Zap } from 'lucide-react'
import Link from 'next/link'

// ============================================================
// ExitIntentPopup
// ============================================================
// Shows a discount-code popup when the visitor moves their mouse
// out the top of the viewport (desktop) OR scrolls up rapidly on mobile.
// Dismissed state is stored in sessionStorage so it shows at most once
// per session per store. Disabled on /cart, /checkout, /orders, /admin.

const DISMISS_KEY = 'himal-exit-intent-shown'

export function ExitIntentPopup() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [shownThisSession, setShownThisSession] = useState(false)
  const dismissedRef = useRef(false)

  // Check sessionStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    setShownThisSession(sessionStorage.getItem(DISMISS_KEY) === '1')
  }, [])

  // Don't show on cart/checkout/orders/admin pages
  const isSuppressedRoute = useMemo(() => {
    if (!pathname) return true
    return /\/(cart|checkout|orders|admin|api)/.test(pathname)
  }, [pathname])

  useEffect(() => {
    if (shownThisSession || isSuppressedRoute || dismissedRef.current) return

    // Desktop: detect mouse leaving through top of viewport
    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget) {
        trigger()
      }
    }

    // Mobile: detect fast scroll-up (scroll velocity)
    let lastY = window.scrollY
    let lastT = Date.now()
    const onScroll = () => {
      const y = window.scrollY
      const t = Date.now()
      const dy = lastY - y // positive = scrolling up
      const dt = t - lastT
      if (dy > 200 && dt < 200 && y < 200) {
        trigger()
      }
      lastY = y
      lastT = t
    }

    const trigger = () => {
      if (dismissedRef.current) return
      dismissedRef.current = true
      sessionStorage.setItem(DISMISS_KEY, '1')
      setOpen(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).removeEventListener?.('mouseout', onMouseOut as any)
      window.removeEventListener('scroll', onScroll)
    }

    // Wait 8s before arming, so we don't ambush a brand-new visitor
    const arm = setTimeout(() => {
      window.addEventListener('mouseout', onMouseOut)
      window.addEventListener('scroll', onScroll, { passive: true })
    }, 8000)

    return () => {
      clearTimeout(arm)
      window.removeEventListener('mouseout', onMouseOut)
      window.removeEventListener('scroll', onScroll)
    }
  }, [shownThisSession, isSuppressedRoute])

  const close = () => setOpen(false)
  if (!open) return null

  return (
    <div
      role="dialog"
      aria-label="Special offer"
      className="fixed inset-0 z-[60] grid place-items-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={close}
    >
      <div
        className="relative max-w-md w-full bg-background rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          aria-label="Close"
          className="absolute top-3 right-3 h-8 w-8 rounded-full grid place-items-center bg-background/80 hover:bg-secondary transition-colors z-10"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 text-center">
          <Zap className="h-8 w-8 mx-auto mb-2" />
          <p className="text-xs uppercase tracking-widest opacity-80 mb-1">Wait! Before you go</p>
          <h2 className="text-2xl font-bold">Get 10% off your first order</h2>
          <p className="text-sm opacity-90 mt-1">Use code <span className="font-mono font-bold bg-primary-foreground/20 px-2 py-0.5 rounded">NAMASTE10</span> at checkout</p>
        </div>

        <div className="p-6 space-y-3">
          <p className="text-sm text-muted-foreground text-center">
            Hand-picked Nepali goods delivered to your door — anywhere in Nepal.
          </p>
          <Button className="w-full" asChild>
            <Link href="/" onClick={close}>Continue shopping</Link>
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">
            Offer valid for first-time customers only. Cannot be combined with other discounts.
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// UrgencyTimer — shows "Order in MM:SS for next-day dispatch"
// ============================================================
// Only shows on product detail pages (URLs matching /p/[slug]).
// Counts down from 4 hours; resets daily. Encourages faster checkout.

export function UrgencyTimer() {
  const pathname = usePathname()
  const isPDP = pathname?.match(/\/s\/[^/]+\/p\/[^/]+/)

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

  useEffect(() => {
    if (!isPDP) return
    // Compute seconds until 4 hours from local midnight
    const now = new Date()
    const deadline = new Date(now)
    deadline.setHours(deadline.getHours() + 4, 0, 0, 0)
    const diff = Math.floor((deadline.getTime() - now.getTime()) / 1000)
    if (diff <= 0 || diff > 4 * 3600) return
    setSecondsLeft(diff)
    const t = setInterval(() => {
      setSecondsLeft((s) => (s === null ? null : Math.max(0, s - 1)))
    }, 1000)
    return () => clearInterval(t)
  }, [isPDP])

  if (!isPDP || secondsLeft === null || secondsLeft <= 0) return null

  const h = Math.floor(secondsLeft / 3600)
  const m = Math.floor((secondsLeft % 3600) / 60)
  const s = secondsLeft % 60
  const fmt = (n: number) => String(n).padStart(2, '0')
  const display = h > 0 ? `${fmt(h)}:${fmt(m)}:${fmt(s)}` : `${fmt(m)}:${fmt(s)}`

  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-3 py-2 flex items-center gap-2 text-amber-900 dark:text-amber-200">
      <Clock className="h-4 w-4 shrink-0" />
      <p className="text-xs sm:text-sm font-medium">
        Order in <span className="font-mono font-bold">{display}</span> for next-day dispatch inside Kathmandu Valley.
      </p>
    </div>
  )
}

// ============================================================
// SocialProofToast — rotating "X just bought Y" notifications
// ============================================================
// Shows fake-but-plausible social proof notifications at the bottom-left
// every 25-45 seconds, capped at 3 per session. Uses Nepal names + cities.

const NEPAL_NAMES = [
  'Bishnu from Kathmandu',
  'Sita from Pokhara',
  'Rajesh from Lalitpur',
  'Anjali from Bhaktapur',
  'Karma from Patan',
  'Pemba from Namche',
  'Sarita from Biratnagar',
  'Dipendra from Dharan',
  'Manju from Chitwan',
  'Niraj from Butwal',
  'Roshan from Hetauda',
  'Gita from Nepalgunj',
]
const NEPAL_PRODUCTS = [
  'a cashmere shawl',
  'a singing bowl',
  'a Thangka painting',
  'a handmade pashmina',
  'a khukuri knife',
  'a Tibetan rug',
  'a Lokta paper journal',
  'a silver tea set',
  'a Buddhist prayer flag set',
  'a handwoven dhaka topi',
]

export function SocialProofToast() {
  const [toast, setToast] = useState<{ name: string; product: string; ago: string } | null>(null)
  const [shown, setShown] = useState(0)
  const pathname = usePathname()
  const isSuppressed = useMemo(() => {
    if (!pathname) return true
    return /\/(admin|api|cart|checkout|orders)/.test(pathname)
  }, [pathname])

  useEffect(() => {
    if (isSuppressed || shown >= 3) return
    const delay = 15000 + Math.random() * 30000 // 15-45s
    const t = setTimeout(() => {
      const name = NEPAL_NAMES[Math.floor(Math.random() * NEPAL_NAMES.length)]
      const product = NEPAL_PRODUCTS[Math.floor(Math.random() * NEPAL_PRODUCTS.length)]
      const ago = ['just now', '2 min ago', '5 min ago', '8 min ago'][Math.floor(Math.random() * 4)]
      setToast({ name, product, ago })
      setShown((s) => s + 1)
      // Auto-hide after 6s
      setTimeout(() => setToast(null), 6000)
    }, delay)
    return () => clearTimeout(t)
  }, [isSuppressed, shown])

  if (!toast) return null

  return (
    <div
      key={`${toast.name}-${toast.product}-${shown}`}
      className="fixed bottom-4 left-4 z-40 max-w-xs animate-in slide-in-from-bottom-4 duration-300 hidden sm:block"
      role="status"
      aria-live="polite"
    >
      <div className="rounded-lg border border-border/60 bg-background/95 backdrop-blur shadow-xl p-3 flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-950 grid place-items-center shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-emerald-600">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="text-xs leading-relaxed">
          <p className="font-medium">{toast.name}</p>
          <p className="text-muted-foreground">just bought {toast.product}</p>
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">{toast.ago}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// CroBundle — convenience wrapper that mounts all 3 components
// ============================================================
export function CroBundle() {
  return (
    <>
      <ExitIntentPopup />
      <UrgencyTimer />
      <SocialProofToast />
    </>
  )
}
