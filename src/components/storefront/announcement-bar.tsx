'use client'

import { useCurrentStore } from '@/lib/use-current-store'
import Link from 'next/link'

type AnnouncementConfig = {
  message: string
  textColor: string
  bgColor: string
  link?: string
}

function parseConfig(raw: string | null | undefined): AnnouncementConfig | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as AnnouncementConfig
    if (!parsed.message) return null
    return {
      message: parsed.message,
      textColor: parsed.textColor || '#FFFFFF',
      bgColor: parsed.bgColor || '#9C1A1A',
      link: parsed.link || undefined,
    }
  } catch {
    return null
  }
}

// AnnouncementBar — colored banner shown above the storefront header.
// Reads configuration from Store.announcementBar (JSON).
// Renders nothing if the message is empty or the JSON is invalid.
export function AnnouncementBar() {
  const { store } = useCurrentStore()
  if (!store) return null
  const cfg = parseConfig(store.announcementBar)
  if (!cfg) return null

  // Sanitize link — only allow internal paths (starts with /) or https://
  const safeLink = cfg.link && (/^\//.test(cfg.link) || /^https?:\/\//i.test(cfg.link)) ? cfg.link : null

  const content = (
    <div
      className="text-center text-xs sm:text-sm font-medium px-4 py-2"
      style={{ backgroundColor: cfg.bgColor, color: cfg.textColor }}
    >
      <p className="max-w-7xl mx-auto truncate">{cfg.message}</p>
    </div>
  )

  if (safeLink) {
    // Internal links use Next Link for SPA nav; external links open in new tab
    if (safeLink.startsWith('/')) {
      return <Link href={safeLink} className="block hover:opacity-90 transition-opacity">{content}</Link>
    }
    return (
      <a href={safeLink} target="_blank" rel="noopener noreferrer" className="block hover:opacity-90 transition-opacity">
        {content}
      </a>
    )
  }

  return content
}
