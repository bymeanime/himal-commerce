import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'How Himal Commerce uses cookies and similar technologies. Essential cookies for cart, analytics cookies for platform improvement, and your consent choices.',
  alternates: { canonical: '/cookie-policy' },
}

export default function CookiePolicyPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      lastUpdated="2025-07-31"
      intro="This Cookie Policy explains how Himal Commerce uses cookies and similar technologies (local storage, session storage) on our platform. This policy supports our Privacy Policy and complies with Nepal's Privacy Act 2075 (2018)."
      sections={[
        {
          h: '1. What are cookies',
          body: [
            'Cookies are small text files stored on your device when you visit a website. They allow the website to remember your actions and preferences over time. Himal Commerce uses both cookies and HTML5 local/session storage — for the purposes of this policy, we refer to all of these as "cookies".',
            'We categorize our cookies into two types: Essential and Analytics/Marketing. You can accept or reject non-essential cookies via the consent banner shown on your first visit.',
          ],
        },
        {
          h: '2. Essential cookies',
          body: [
            'These cookies are necessary for the platform to function. They cannot be disabled.',
            '• himal-cart — stores your shopping cart contents between visits (local storage, 30 days)',
            '• himal-session-id — anonymous session identifier for analytics and fraud prevention (session storage, cleared on browser close)',
            '• himal-ui — stores your UI preferences such as the active store and view (local storage, 30 days)',
            '• sidebar_state — stores admin sidebar collapsed/expanded state (cookie, 1 year)',
            '• himal-cookie-consent — records your cookie consent choice (local storage, 1 year)',
            '• himal-ref — affiliate/referral code if you arrived via a ref link (cookie, 30 days)',
            'These cookies do not contain personally identifiable information beyond what you have explicitly provided (e.g., your cart contents).',
          ],
        },
        {
          h: '3. Analytics cookies',
          body: [
            'These cookies help us understand how shoppers use the platform so we can improve it. They are only set after you accept "all cookies" via the consent banner.',
            '• himal-utm — stores UTM parameters (source, medium, campaign) for marketing attribution (local storage, 30 days)',
            '• Analytics events — stored in our database, linked to your anonymous session ID, used to compute conversion funnels and aggregate statistics',
            '• GA4 / Meta Pixel / TikTok Pixel (per-store, optional) — if a Seller has configured their own analytics IDs, these third-party cookies may be set. Each Seller is responsible for their own analytics compliance.',
            'Analytics data is aggregated and anonymized after 24 months. We never use analytics cookies to build cross-site behavioral profiles.',
          ],
        },
        {
          h: '4. Third-party cookies',
          body: [
            'We do not set third-party advertising cookies at the platform level. However, individual Sellers may configure their own analytics (GA4, Meta Pixel, TikTok Pixel) via Store Settings. In that case:',
            '• The Seller is the data controller for their analytics data',
            '• The third-party (Google, Meta, TikTok) sets cookies on the storefront domain',
            '• You can block these cookies via your browser settings or by choosing "Essential only" in our consent banner',
            '• The third-party\'s privacy policy applies to data they collect — links: Google Privacy, Meta Privacy, TikTok Privacy',
            'Payment gateways (eSewa, Khalti) may set their own cookies when you redirect to their site. These are governed by their respective privacy policies.',
          ],
        },
        {
          h: '5. Managing cookies',
          body: [
            'You can control cookies in several ways:',
            '• Use our consent banner — choose "Essential only" to disable analytics cookies',
            '• Reset your consent by clearing local storage for our domain, then refreshing — the banner will reappear',
            '• Use your browser\'s cookie settings — all modern browsers allow you to block or delete cookies',
            '• Use private/incognito mode — no cookies persist between sessions',
            'Note: blocking essential cookies will break the shopping cart and checkout flow. We recommend keeping essential cookies enabled.',
          ],
        },
        {
          h: '6. Cookie retention',
          body: [
            'Cookie retention periods:',
            '• Session storage: cleared when you close your browser',
            '• Local storage: 30 days for cart and UI preferences, 1 year for consent choice',
            '• Cookies: 30 days for affiliate ref, 1 year for sidebar state',
            'You can manually clear all Himal Commerce cookies via your browser settings at any time.',
          ],
        },
        {
          h: '7. Changes to this policy',
          body: [
            'If we add new cookies or change how existing cookies are used, we will update this policy and re-prompt for consent (by incrementing the consent version) so you can make a fresh choice.',
          ],
        },
        {
          h: '8. Contact',
          body: [
            'For cookie questions: privacy@himal-commerce.np',
          ],
        },
      ]}
    />
  )
}
