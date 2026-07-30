'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Phone, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// Newsletter signup — phone-first for Nepal (Marketing panel P0).
// In Nepal, SMS open rates are 95%+ vs email's 15-20%. So we capture phone
// as the primary identifier and email as optional.
export function NewsletterSignup({ storeId }: { storeId: string }) {
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone && !email) {
      toast.error('Please enter your phone or email')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ storeId, phone: phone || undefined, email: email || undefined, source: 'footer' }),
      })
      if (!res.ok) throw new Error('failed')
      setDone(true)
      toast.success('Subscribed!', { description: 'You\'ll hear from us about Dashain offers and new arrivals.' })
    } catch {
      toast.error('Could not subscribe. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-lg p-3">
        <Check className="h-4 w-4 shrink-0" />
        <span>Thank you! You're subscribed to our offers.</span>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <p className="text-sm font-semibold">Get Dashain offers first</p>
      <p className="text-xs text-muted-foreground">
        We'll SMS you about festival deals, new arrivals, and restocks. No spam.
      </p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="tel"
            placeholder="98XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="pl-8 h-9 text-sm"
            aria-label="Phone number"
          />
        </div>
        <Button type="submit" size="sm" disabled={loading} className="h-9">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Subscribe'}
        </Button>
      </div>
      <div className="relative">
        <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          type="email"
          placeholder="email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pl-8 h-9 text-sm"
          aria-label="Email (optional)"
        />
      </div>
    </form>
  )
}
