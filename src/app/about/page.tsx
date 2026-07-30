import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'About Himal Commerce',
  description: 'Himal Commerce is Nepal\'s multi-tenant headless commerce platform — your own storefront, your own brand, your own customer data. Pay with eSewa, Khalti, or COD across all 77 districts.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <LegalPage
      title="About Himal Commerce"
      lastUpdated="2025-07-31"
      intro="Nepal's multi-tenant commerce platform — your own storefront, your own brand, your own customer data. Built in Kathmandu for the merchants of Nepal."
      sections={[
        {
          h: 'Our mission',
          body: [
            'Himal Commerce exists to give every Nepali merchant the tools to compete with the giants. For too long, small Nepali sellers have had to choose between marketplaces like Daraz (where the marketplace owns the customer, sets the rules, and takes a cut of every sale) or building their own website from scratch (expensive, technically complex, and disconnected from local payments and shipping).',
            'We change that. With Himal Commerce, a Seller in Patan selling handwoven Dhaka topis, or a tea grower in Ilam with single-estate orthodox tea, gets their own branded storefront at their own URL — with eSewa, Khalti, and Cash on Delivery built in. They own their customer data. They set their own prices. They keep their own brand.',
            'We are the Medusa of Nepal — open-source-inspired, multi-tenant, headless commerce built specifically for the Nepali market.',
          ],
        },
        {
          h: 'Why we built this',
          body: [
            'Nepal\'s ecommerce market is one of South Asia\'s fastest-growing, but it has been dominated by a single marketplace (Daraz, owned by Alibaba) that treats Nepali merchants as listings on someone else\'s shelf. Meanwhile, the tools to build an independent store (Shopify, WooCommerce, Medusa) are built for Western markets — they don\'t natively support NPR, eSewa, Khalti, COD, all 77 districts, or Bikram Sambat calendar.',
            'Himal Commerce closes that gap. We are built in Nepal, for Nepal. Every payment method Nepalis actually use. Every district. Nepali language support. VAT-compliant invoicing. SparrowSMS integration. Local courier partnerships (Pathao, Nepal Can Move). Everything a Nepali merchant needs to sell online, without giving up their brand or their customer.',
          ],
        },
        {
          h: 'What we offer',
          body: [
            'For Sellers:',
            '• A branded storefront at your own URL (your-store.himal-commerce.np or your own domain)',
            '• NPR pricing with 13% VAT handling for tax-registered merchants',
            '• eSewa, Khalti, and Cash on Delivery — every payment method Nepalis use',
            '• Shipping to all 77 districts with Pathao, Nepal Can Move, Aramex integration',
            '• Admin dashboard with orders, products, customers, analytics, and CSV exports',
            '• Product variants (size, color, weight), categories, low-stock alerts',
            '• Coupon codes, abandoned cart recovery via SMS, newsletter marketing',
            '• VAT-compliant invoice generation with sequential invoice numbers',
            '• Bikram Sambat fiscal year support for IRD reporting',
            '',
            'For Buyers:',
            '• Authentic Nepali-made goods — handicrafts, tea, pashmina, jewelry, spices',
            '• Pay with eSewa, Khalti, or Cash on Delivery',
            '• Free shipping on orders above the Seller\'s threshold',
            '• Track your order by phone + OTP — no account needed',
            '• 7-day return policy on most items',
          ],
        },
        {
          h: 'Our values',
          body: [
            'Local first. We are built in Nepal, by Nepalis, for Nepal. Every feature starts with a Nepal-specific question: "Does this work in Jumla? Does this work with eSewa? Does this respect Bikram Sambat?" If the answer is no, we don\'t ship it.',
            'Open by default. Our platform code is open-source-inspired. We publish our schema, our APIs, and our roadmap publicly. Sellers can export their data anytime.',
            'Seller sovereignty. We are a platform, not a marketplace. We do not own your customer, your brand, or your data. You can leave anytime with all your data intact — there is no lock-in.',
            'Compliance as a feature. We bake Nepal\'s legal requirements into the platform: VAT calculation, PAN/VAT field, IRD-compliant invoice numbering, Privacy Act compliance, Consumer Protection Act compliance. You don\'t have to hire a lawyer to start selling.',
            'Quality over quantity. We would rather have 100 Sellers doing Rs 1M/year than 10,000 Sellers doing Rs 1,000/year. Our feature roadmap is driven by what helps serious Sellers grow — not by what drives vanity signups.',
          ],
        },
        {
          h: 'Our team',
          body: [
            'We are a small team based in Patan, Kathmandu Valley. Our founders have built ecommerce systems for Nepali brands since 2018 and have watched too many merchants struggle with tools that weren\'t built for them. Himal Commerce is the platform we wished existed when we started.',
            'We are hiring. If you are a Nepali engineer, designer, or operator who wants to build the future of Nepal\'s digital economy, email us at careers@himal-commerce.np.',
          ],
        },
        {
          h: 'Contact',
          body: [
            'Himal Commerce',
            'Patan Dhoka, Lalitpur 44600, Nepal',
            'Phone: +977 1 4123 456',
            'Email: namaste@himal-commerce.np',
            'GitHub: github.com/bymeanime/himal-commerce',
          ],
        },
      ]}
    />
  )
}
