'use client'

import { useEffect, useState } from 'react'
import { useCurrentStore } from '@/lib/use-current-store'

// MarketingPixels — injects GA4, Meta Pixel, and TikTok Pixel scripts
// into <head> ONLY after the visitor accepts "all" cookies via the consent banner.
// Reads pixel IDs from Store.marketingConfig (JSON).
//
// Cookie consent levels:
//   - 'all'      → load all pixels
//   - 'essential' → load nothing
//   - no consent  → load nothing
const CONSENT_KEY = 'himal-cookie-consent'

type MarketingConfig = {
  ga4Id?: string
  metaPixelId?: string
  tiktokPixelId?: string
}

function parseConfig(raw: string | null | undefined): MarketingConfig {
  if (!raw) return {}
  try {
    return JSON.parse(raw) as MarketingConfig
  } catch {
    return {}
  }
}

function getConsentLevel(): 'all' | 'essential' | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(CONSENT_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored)
    return parsed.level === 'all' ? 'all' : 'essential'
  } catch {
    return null
  }
}

// Inject scripts safely — these are external vendor scripts, gated by consent.
declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
    _fbq?: unknown
    ttq?: unknown
    TiktokAnalyticsObject?: string
  }
}

function injectGa4(id: string) {
  if (document.getElementById('ga4-script-src')) return
  window.dataLayer = window.dataLayer || []
  window.gtag = function (...args: unknown[]) { window.dataLayer?.push(args) }
  window.gtag('js', new Date())
  window.gtag('config', id, { anonymize_ip: true })

  const s = document.createElement('script')
  s.id = 'ga4-script-src'
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`
  document.head.appendChild(s)

  const inline = document.createElement('script')
  inline.id = 'ga4-script-inline'
  inline.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}',{anonymize_ip:true});`
  document.head.appendChild(inline)
}

function injectMetaPixel(id: string) {
  if (document.getElementById('meta-pixel-src')) return
  // @ts-expect-error - vendor snippet uses bare function expression
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  window.fbq?.('init', id)
  window.fbq?.('track', 'PageView')
}

function injectTiktokPixel(id: string) {
  if (document.getElementById('tiktok-pixel-src')) return
  // @ts-expect-error - vendor snippet uses bare function expression
  !function (w, d, t) { w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load(id);ttq.page(); }(window, document, 'ttq')
}

export function MarketingPixels() {
  const { store } = useCurrentStore()
  const [consented, setConsented] = useState(false)

  // Listen for consent changes (the cookie banner writes to localStorage)
  useEffect(() => {
    const check = () => {
      const level = getConsentLevel()
      setConsented(level === 'all')
    }
    check()
    // Poll for consent every 2s for up to 30s after mount — covers the case
    // where the banner appears 1.5s after load and the user clicks "Accept all"
    let pollCount = 0
    const interval = setInterval(() => {
      check()
      pollCount++
      if (pollCount > 15 || consented) clearInterval(interval)
    }, 2000)
    // Also re-check on storage events (cross-tab)
    window.addEventListener('storage', check)
    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', check)
    }
  }, [consented])

  // Inject pixels when consent is granted + store has marketing config
  useEffect(() => {
    if (!consented || !store) return
    const cfg = parseConfig(store.marketingConfig)
    if (cfg.ga4Id) injectGa4(cfg.ga4Id)
    if (cfg.metaPixelId) injectMetaPixel(cfg.metaPixelId)
    if (cfg.tiktokPixelId) injectTiktokPixel(cfg.tiktokPixelId)
  }, [consented, store])

  // Render nothing — this component only injects scripts
  return null
}
