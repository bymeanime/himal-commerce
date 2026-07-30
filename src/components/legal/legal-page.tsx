import Link from 'next/link'
import { ArrowLeft, Mountain } from 'lucide-react'
import { Logo } from '@/components/logo'

type Section = { h: string; body: string[] }

// Shared layout for legal/info pages (Privacy, Terms, Refund, etc.)
// Each page is a real Next.js App Router route — indexable by Google,
// shareable by URL, and rendered server-side for fast first paint.
export function LegalPage({
  title,
  lastUpdated,
  intro,
  sections,
}: {
  title: string
  lastUpdated: string
  intro: string
  sections: Section[]
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Minimal header — just a back link + logo, no storefront chrome */}
      <header className="border-b border-border/60 bg-background/85 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Himal Commerce
          </Link>
          <Logo size="sm" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 md:py-14">
        {/* Hero */}
        <div className="mb-10 pb-8 border-b border-border/60">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg grid place-items-center bg-primary">
              <Mountain className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Himal Commerce · Legal</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">{title}</h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">{intro}</p>
          <p className="text-xs text-muted-foreground/70 mt-4">
            Last updated: {new Date(lastUpdated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-xl font-semibold tracking-tight mb-3">{s.h}</h2>
              <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
                {s.body.map((p, i) => (
                  <p key={i} className="whitespace-pre-line">{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Related links */}
        <div className="mt-12 pt-8 border-t border-border/60">
          <h3 className="text-sm font-semibold mb-4">Related policies</h3>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/privacy" className="px-3 py-1.5 rounded-md border border-border hover:border-primary hover:text-primary">Privacy Policy</Link>
            <Link href="/terms" className="px-3 py-1.5 rounded-md border border-border hover:border-primary hover:text-primary">Terms of Service</Link>
            <Link href="/refund-policy" className="px-3 py-1.5 rounded-md border border-border hover:border-primary hover:text-primary">Refund Policy</Link>
            <Link href="/shipping-policy" className="px-3 py-1.5 rounded-md border border-border hover:border-primary hover:text-primary">Shipping Policy</Link>
            <Link href="/cookie-policy" className="px-3 py-1.5 rounded-md border border-border hover:border-primary hover:text-primary">Cookie Policy</Link>
            <Link href="/about" className="px-3 py-1.5 rounded-md border border-border hover:border-primary hover:text-primary">About</Link>
          </div>
        </div>

        <footer className="mt-12 pt-6 border-t border-border/60 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Himal Commerce. Made with 🙏 in Kathmandu, Nepal.</p>
        </footer>
      </main>
    </div>
  )
}
