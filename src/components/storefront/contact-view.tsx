'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Mail, Phone, MapPin, Send, Loader2, MessageCircle,
  Facebook, Instagram, Twitter, Youtube,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

type ContactStore = {
  id: string
  name: string
  slug: string
  supportPhone: string | null
  supportEmail: string | null
  address: string | null
  ownerName: string
  socialTwitter: string | null
  socialFacebook: string | null
  socialInstagram: string | null
  socialTiktok: string | null
  socialYoutube: string | null
  socialViber: string | null
  socialWhatsapp: string | null
  primaryColor: string
  accentColor: string
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  )
}

function ViberIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M11.4 0C6.62 0 2.85 3.04 2.85 6.78v3.42c0 .94.21 1.84.6 2.66L2.4 16.2l3.46-1.06c.78.42 1.65.72 2.58.86.34 1.65 1.94 2.94 3.86 2.94.6 0 1.18-.13 1.69-.36.95.65 2.18 1.04 3.5 1.04 1.6 0 3.04-.59 4.04-1.54V6.78C21.53 3.04 16.18 0 11.4 0z"/>
    </svg>
  )
}

function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
    </svg>
  )
}

export function ContactView({ store }: { store: ContactStore }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !phone || !message) {
      toast.error('Please fill in your name, phone, and message')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: store.id,
          name,
          phone,
          email: email || undefined,
          message,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success('Message sent — the store will contact you soon.')
        setName(''); setPhone(''); setEmail(''); setMessage('')
      } else if (res.status === 429) {
        toast.error(data.error || 'You just sent a message. Please wait a few minutes.')
      } else {
        toast.error(data.error || 'Could not send message. Please call or message us directly.')
      }
    } catch {
      toast.error('Could not send message. Please call or message us directly.')
    } finally {
      setSubmitting(false)
    }
  }

  const socials = [
    { url: store.socialFacebook, Icon: Facebook, label: 'Facebook' },
    { url: store.socialInstagram, Icon: Instagram, label: 'Instagram' },
    { url: store.socialTiktok, Icon: TikTokIcon, label: 'TikTok' },
    { url: store.socialYoutube, Icon: Youtube, label: 'YouTube' },
    { url: store.socialTwitter, Icon: Twitter, label: 'X' },
    { url: store.socialViber, Icon: ViberIcon, label: 'Viber' },
    { url: store.socialWhatsapp, Icon: WhatsappIcon, label: 'WhatsApp' },
  ].filter((s) => s.url)

  // Normalize WhatsApp number to wa.me format
  const whatsappUrl = store.socialWhatsapp
    ? (store.socialWhatsapp.match(/^\+?\d{8,15}$/)
        ? `https://wa.me/${store.socialWhatsapp.replace(/[^\d]/g, '')}`
        : store.socialWhatsapp)
    : null

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:py-16">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Get in touch</h1>
        <p className="text-muted-foreground mt-2">
          Questions, custom orders, or wholesale inquiries — we&apos;d love to hear from you.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Contact methods */}
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Direct contact</h2>
            <ul className="space-y-3">
              {store.supportPhone && (
                <li>
                  <a
                    href={`tel:${store.supportPhone.replace(/[\s\-()]/g, '')}`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full grid place-items-center" style={{ backgroundColor: store.primaryColor + '20' }}>
                      <Phone className="h-4 w-4" style={{ color: store.primaryColor }} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Call us</p>
                      <p className="font-medium">{store.supportPhone}</p>
                    </div>
                  </a>
                </li>
              )}
              {store.supportEmail && (
                <li>
                  <a
                    href={`mailto:${store.supportEmail}`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full grid place-items-center" style={{ backgroundColor: store.primaryColor + '20' }}>
                      <Mail className="h-4 w-4" style={{ color: store.primaryColor }} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email us</p>
                      <p className="font-medium">{store.supportEmail}</p>
                    </div>
                  </a>
                </li>
              )}
              {store.address && (
                <li className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <div className="h-10 w-10 rounded-full grid place-items-center" style={{ backgroundColor: store.primaryColor + '20' }}>
                    <MapPin className="h-4 w-4" style={{ color: store.primaryColor }} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Visit us</p>
                    <p className="font-medium">{store.address}</p>
                  </div>
                </li>
              )}
              {whatsappUrl && (
                <li>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full grid place-items-center bg-emerald-500">
                      <WhatsappIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">Chat on WhatsApp</p>
                      <p className="font-medium text-emerald-900 dark:text-emerald-200">Message us</p>
                    </div>
                  </a>
                </li>
              )}
            </ul>
          </div>

          {socials.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Follow us</h2>
              <div className="flex flex-wrap gap-2">
                {socials.map(({ url, Icon, label }) => {
                  const safeHref = url && /^https?:\/\//.test(url) ? url : '#'
                  return (
                    <a
                      key={label}
                      href={safeHref}
                      target="_blank"
                      rel="noopener noreferrer ugc nofollow"
                      aria-label={label}
                      className="h-10 w-10 rounded-full grid place-items-center border border-border hover:text-primary-foreground transition-colors"
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = store.primaryColor)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  )
                })}
              </div>
            </div>
          )}

          <div className="p-4 rounded-lg bg-secondary/40 border border-border">
            <h3 className="text-sm font-semibold mb-1">Looking for your order?</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Track your order status and request returns online.
            </p>
            <Link
              href={`/s/${store.slug}/orders`}
              className="text-sm font-medium hover:underline"
              style={{ color: store.primaryColor }}
            >
              Find my order →
            </Link>
          </div>
        </div>

        {/* Contact form */}
        <div>
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">Send a message</h2>
            <div className="space-y-2">
              <Label htmlFor="name">Your name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98XXXXXXXX"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we help?"
                rows={5}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" /> Send message
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              By submitting, you agree to be contacted about your inquiry. We do not share your information.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
