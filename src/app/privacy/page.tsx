import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Himal Commerce collects, uses, and protects your personal data under Nepal\'s Privacy Act 2075 (2018) and the Electronic Transactions Act 2008.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated="2025-07-31"
      intro="This Privacy Policy explains how Himal Commerce and the independent merchants on our platform collect, use, and protect your personal data. We comply with Nepal's Privacy Act 2075 (2018 AD) and the Electronic Transactions Act 2008."
      sections={[
        {
          h: '1. Who we are',
          body: [
            'Himal Commerce is a multi-tenant commerce platform operated from Kathmandu, Nepal. We provide storefront technology to independent Nepali merchants ("Sellers") who sell authentic Nepali-made goods — Dhaka topis, pashmina shawls, Ilam tea, Gurkha khukuris, and more — to customers across all 77 districts of Nepal.',
            'When you place an order, the Seller is the data controller of your personal data (name, phone, email, shipping address, order history). Himal Commerce acts as the data processor on the Seller\'s behalf. For platform-level data (analytics, account information), Himal Commerce is the data controller.',
          ],
        },
        {
          h: '2. What data we collect',
          body: [
            'We collect only the data necessary to process your order and provide our services:',
            '• Identity: your name as provided at checkout',
            '• Contact: your Nepal mobile phone number (required — used for order confirmation, shipping updates, and COD verification), and email if you choose to provide it',
            '• Shipping address: street address, ward, municipality, city, district, postal code',
            '• Order data: products ordered, quantities, prices, payment method, order status',
            '• Payment metadata: payment method used (eSewa / Khalti / COD), transaction reference, payment status. We never store full card numbers or eSewa/Khalti credentials — these are handled directly by the payment gateways.',
            '• Usage data: IP address, browser type, pages visited, referral source (UTM parameters), session ID — used for analytics and fraud prevention',
            '• Marketing consent: if you subscribe to our newsletter, we store your phone/email with your explicit consent and your consent timestamp',
          ],
        },
        {
          h: '3. How we use your data',
          body: [
            'We use your personal data for the following purposes:',
            '• Order fulfillment: processing your order, coordinating shipping, confirming delivery',
            '• Customer support: contacting you about your order, handling returns and refunds',
            '• Payment processing: verifying payments via eSewa, Khalti, or confirming COD',
            '• Fraud prevention: verifying high-value COD orders via OTP, scoring order risk, detecting abuse patterns',
            '• Tax compliance: storing order records for 7 years as required by Nepal\'s Income Tax Act and VAT Act for IRD audit',
            '• Marketing (opt-in only): sending you SMS or email about festival offers (Dashain, Tihar), new arrivals, and restocks — only if you explicitly subscribe',
            '• Platform improvement: aggregated, anonymized analytics to improve the shopping experience',
          ],
        },
        {
          h: '4. Data sharing',
          body: [
            'We share your personal data only with the following parties, and only as necessary:',
            '• The Seller you ordered from — they receive your name, phone, shipping address, and order details',
            '• Shipping couriers (Pathao, Nepal Can Move, Aramex, FedEx, or others chosen by the Seller) — they receive your name, phone, and shipping address for delivery',
            '• Payment gateways (eSewa, Khalti) — they receive only the transaction reference and amount, never your full order details',
            '• SMS gateway (SparrowSMS) — for transactional messages (order confirmation, shipping updates)',
            '• Government authorities — only when legally required by court order, tax audit, or regulatory request under Nepali law',
            'We never sell your personal data to third parties. We never share your data for cross-context advertising.',
          ],
        },
        {
          h: '5. Data retention',
          body: [
            'We retain your personal data for the following periods:',
            '• Order records: 7 years (mandatory under Nepal\'s Income Tax Act 2058 and VAT Act 2052 for IRD audit)',
            '• Customer accounts: until you request deletion, after which we anonymize your identity while preserving order records for tax compliance',
            '• Marketing subscriber data: until you unsubscribe (one-tap unsubscribe in every SMS)',
            '• Analytics data: aggregated and anonymized after 24 months',
            '• Abandoned cart data: 30 days, then permanently deleted',
          ],
        },
        {
          h: '6. Your rights',
          body: [
            'Under Nepal\'s Privacy Act 2075, you have the following rights:',
            '• Right to access: request a copy of all personal data we hold about you (free, delivered within 30 days)',
            '• Right to correction: request correction of inaccurate data',
            '• Right to deletion: request deletion of your personal data (subject to the 7-year tax retention requirement — we will anonymize your identity while preserving order records)',
            '• Right to data portability: receive your data in a machine-readable format (JSON)',
            '• Right to object: object to processing for marketing purposes at any time',
            '• Right to withdraw consent: unsubscribe from marketing at any time',
            'To exercise these rights, contact the Seller you ordered from, or email privacy@himal-commerce.np for platform-level requests.',
          ],
        },
        {
          h: '7. Security',
          body: [
            'We implement industry-standard security measures to protect your personal data:',
            '• HTTPS/TLS encryption for all data in transit (HSTS enabled)',
            '• Server-side price verification at checkout to prevent tampering',
            '• Multi-tenant data isolation — each Seller\'s data is scoped to their store',
            '• Audit logging of all administrative actions',
            '• Input validation on all API endpoints to prevent injection attacks',
            '• Security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)',
            '• CSRF protection on all state-changing endpoints',
            'Despite these measures, no system is 100% secure. In the event of a data breach, we will notify affected customers and the Nepal Department of Information Technology within 72 hours, as required by the Electronic Transactions Act 2008.',
          ],
        },
        {
          h: '8. Children\'s privacy',
          body: [
            'Our platform is not directed at children under 16. We do not knowingly collect personal data from children. If you believe a child has provided us with personal data, please contact us and we will delete it.',
            'Age-restricted products (alcohol, tobacco) require explicit age confirmation at checkout. We log the confirmation timestamp and IP address for compliance with Nepal\'s Tobacco Product Control Act 2068.',
          ],
        },
        {
          h: '9. International transfers',
          body: [
            'Your data is stored on servers located in Singapore (Vercel + Neon Postgres, ap-southeast-1 region) — chosen for proximity to Nepal and low latency. Nepal does not currently have data localization requirements for e-commerce. By using our platform, you consent to this international transfer.',
          ],
        },
        {
          h: '10. Changes to this policy',
          body: [
            'We may update this Privacy Policy from time to time. We will notify you of material changes by posting a notice on our homepage and, if you have an account, by SMS/email at least 30 days before the change takes effect. The "Last updated" date below indicates when this policy was last revised.',
          ],
        },
        {
          h: '11. Contact',
          body: [
            'For privacy questions or to exercise your rights, contact:',
            'Himal Commerce · Data Protection Officer',
            'Email: privacy@himal-commerce.np',
            'Phone: +977 1 4123 456',
            'Address: Patan Dhoka, Lalitpur 44600, Nepal',
            'For complaints about data processing, you may also contact the Nepal Department of Information Technology at doit.gov.np.',
          ],
        },
      ]}
    />
  )
}
