import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react'
import type { SVGProps } from 'react'

// TikTok doesn't have a lucide icon — use a simple SVG
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
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  )
}

export type SocialLink = {
  url: string
  label: string
  Icon: (props: SVGProps<SVGSVGElement>) => React.ReactNode
}

// Build a sanitized list of socials from a Store-shaped object.
// - Filters out empty values
// - Converts WhatsApp phone numbers to wa.me deep links
// - Converts Viber phone numbers to viber://chat deep links
// - Strips javascript: and other unsafe schemes (only http(s), viber:, wa.me kept)
export function buildSocialLinks(store: {
  socialFacebook?: string | null
  socialInstagram?: string | null
  socialTiktok?: string | null
  socialYoutube?: string | null
  socialTwitter?: string | null
  socialViber?: string | null
  socialWhatsapp?: string | null
}): SocialLink[] {
  const raw: Array<{ url: string | null | undefined; Icon: (props: SVGProps<SVGSVGElement>) => React.ReactNode; label: string; isPhone?: boolean }> = [
    { url: store.socialFacebook, Icon: Facebook, label: 'Facebook' },
    { url: store.socialInstagram, Icon: Instagram, label: 'Instagram' },
    { url: store.socialTiktok, Icon: TikTokIcon, label: 'TikTok' },
    { url: store.socialYoutube, Icon: Youtube, label: 'YouTube' },
    { url: store.socialTwitter, Icon: Twitter, label: 'X' },
    { url: store.socialViber, Icon: ViberIcon, label: 'Viber', isPhone: true },
    { url: store.socialWhatsapp, Icon: WhatsappIcon, label: 'WhatsApp', isPhone: true },
  ]

  return raw
    .filter((s): s is { url: string; Icon: (props: SVGProps<SVGSVGElement>) => React.ReactNode; label: string; isPhone?: boolean } => Boolean(s.url && s.url.trim()))
    .map((s) => {
      let safeHref = '#'
      const v = s.url.trim()
      if (s.isPhone) {
        // Phone-number style — convert to deep link
        const digits = v.replace(/[^\d]/g, '')
        if (digits.length >= 8) {
          if (s.label === 'WhatsApp') {
            safeHref = `https://wa.me/${digits}`
          } else if (s.label === 'Viber') {
            safeHref = `viber://chat?number=%2B${digits}`
          }
        }
      } else if (/^https?:\/\//i.test(v)) {
        // URL form — already safe
        safeHref = v
      }
      return { url: safeHref, label: s.label, Icon: s.Icon }
    })
    .filter((s) => s.url !== '#')
}

// Render an icon row — used by footer, about page, contact page
export function SocialIconsRow({
  socials,
  size = 'md',
  className = '',
}: {
  socials: SocialLink[]
  size?: 'sm' | 'md'
  className?: string
}) {
  if (socials.length === 0) return null
  const dim = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9'
  const icon = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {socials.map(({ url, Icon, label }) => (
        <a
          key={label}
          href={url}
          target="_blank"
          rel="noopener noreferrer ugc nofollow"
          aria-label={label}
          className={`${dim} rounded-full grid place-items-center border border-border/60 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors`}
        >
          <Icon className={icon} />
        </a>
      ))}
    </div>
  )
}
