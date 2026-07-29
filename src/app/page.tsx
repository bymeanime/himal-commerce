'use client'

import { Platform } from '@/components/platform/platform'
import { Storefront } from '@/components/storefront/storefront'
import { Admin } from '@/components/admin/admin'
import { useUI } from '@/lib/ui-store'
import { useEffect } from 'react'

export default function Home() {
  const view = useUI((s) => s.view)
  const currentStoreId = useUI((s) => s.currentStoreId)

  // Sync URL hash with view + store for natural back-button behavior
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash.replace(/^#/, '')
    // Parse: "platform" or "store/{id}/storefront" or "store/{id}/admin"
    if (hash === 'platform' && view !== 'platform') {
      useUI.setState({ view: 'platform', currentStoreId: null })
      return
    }
    const m = hash.match(/^store\/([^/]+)\/(storefront|admin)$/)
    if (m) {
      const [, sid, v] = m
      if (currentStoreId !== sid || view !== v) {
        useUI.setState({ currentStoreId: sid, view: v as 'storefront' | 'admin' })
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    let newHash = 'platform'
    if (view !== 'platform' && currentStoreId) {
      newHash = `store/${currentStoreId}/${view}`
    }
    if (window.location.hash !== `#${newHash}`) {
      window.history.replaceState(null, '', window.location.pathname + (newHash === 'platform' ? '' : `#${newHash}`))
    }
  }, [view, currentStoreId])

  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo(0, 0)
  }, [view, currentStoreId])

  if (view === 'platform' || !currentStoreId) {
    return <Platform />
  }
  if (view === 'admin') {
    return <Admin />
  }
  return <Storefront />
}
