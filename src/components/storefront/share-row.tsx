'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Share2, Facebook, MessageCircle, Send, Twitter, Link2, Check } from 'lucide-react'
import { toast } from 'sonner'

// Product share buttons (Social panel P1).
// Includes Viber + WhatsApp (Viber > WhatsApp in Nepal — Social panel P3).
// Uses navigator.share() on mobile when available.

function ViberIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M11.4 0C6.62 0 2.85 3.04 2.85 6.78v3.42c0 .94.21 1.84.6 2.66L2.4 16.2l3.46-1.06c.78.42 1.65.72 2.58.86.34 1.65 1.94 2.94 3.86 2.94.6 0 1.18-.13 1.69-.36.95.65 2.18 1.04 3.5 1.04 1.6 0 3.04-.59 4.04-1.54V6.78C21.53 3.04 16.18 0 11.4 0zm6.94 8.92c-.42 1.04-1.42 2.46-2.84 3.84-1.42 1.38-2.92 2.34-4 2.74-.5.18-.94-.04-1.12-.5-.18-.46.04-.92.5-1.12 1.04-.42 2.18-1.18 3.32-2.28 1.14-1.1 1.94-2.22 2.4-3.28.2-.5.7-.72 1.18-.5.5.2.7.7.56 1.1z"/>
    </svg>
  )
}

export function ShareRow({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false)
  const fullUrl = typeof window !== 'undefined' && !url.startsWith('http') ? `${window.location.origin}${url}` : url
  const shareText = `Check out "${title}" on Himal Commerce`

  const share = async (platform: string) => {
    const u = encodeURIComponent(fullUrl)
    const t = encodeURIComponent(shareText)
    const targets: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      twitter: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
      whatsapp: `https://wa.me/?text=${t}%20${u}`,
      viber: `viber://forward?text=${t}%20${u}`,
      messenger: `https://www.facebook.com/dialog/send?link=${u}&app_id=291494419107518&redirect_uri=${u}`,
    }
    if (platform === 'native' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text: shareText, url: fullUrl })
        return
      } catch { /* user cancelled */ }
    }
    window.open(targets[platform], '_blank', 'noopener,noreferrer,width=600,height=500')
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      toast.success('Link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy link')
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <Share2 className="h-3.5 w-3.5" /> Share
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => share('facebook')}
          aria-label="Share to Facebook"
        >
          <Facebook className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => share('whatsapp')}
          aria-label="Share to WhatsApp"
        >
          <MessageCircle className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => share('viber')}
          aria-label="Share to Viber"
        >
          <ViberIcon className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => share('twitter')}
          aria-label="Share to X"
        >
          <Twitter className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={copyLink}
          aria-label="Copy link"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Link2 className="h-3.5 w-3.5" />}
        </Button>
      </div>
      {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              More
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => share('native')}>
              <Send className="h-3.5 w-3.5 mr-2" /> Use system share
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => share('messenger')}>
              <MessageCircle className="h-3.5 w-3.5 mr-2" /> Messenger
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
