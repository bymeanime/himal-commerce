'use client'

import { Storefront } from '@/components/storefront/storefront'
import { Admin } from '@/components/admin/admin'
import { useUI } from '@/lib/ui-store'
import { useEffect } from 'react'

export default function Home() {
  const view = useUI((s) => s.view)

  // Sync hash with view so the back button feels natural
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash.replace('#', '')
    if (hash === 'admin' && view !== 'admin') {
      useUI.setState({ view: 'admin' })
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const newHash = view === 'admin' ? '#admin' : ''
    if (window.location.hash !== newHash) {
      window.history.replaceState(null, '', window.location.pathname + newHash)
    }
  }, [view])

  // Scroll to top when switching views
  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo(0, 0)
  }, [view])

  return view === 'admin' ? <Admin /> : <Storefront />
}
