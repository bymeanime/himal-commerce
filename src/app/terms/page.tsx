import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms governing the use of Himal Commerce — Nepal\'s multi-tenant commerce platform. Compliance with Nepal Electronic Transactions Act 2008, Consumer Protection Act 2075, and ARMA 2008.',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      lastUpdated="2025-07-31"
      intro="These Terms of Service govern your use of the Himal Commerce platform. By browsing, placing an order, or creating a seller account, you agree to these terms. These terms comply with Nepal's Electronic Transactions Act 2008, Consumer Protection Act 2075 (2018), and other applicable Nepali laws."
      sections={[
        {
          h: '1. Marketplace facilitator status',
          body: [
            'Himal Commerce is a multi-tenant commerce platform that facilitates transactions between independent Nepali merchants ("Sellers") and buyers. We are NOT a party to the sale contract between you and the Seller. Each Seller is an independent contractor responsible for their own:',
            '• Product listings, pricing, and inventory',
            '• PAN (Permanent Account Number) and VAT registration with IRD Nepal',
            '• Order fulfillment, shipping, returns, and customer service',
            '• Compliance with consumer protection, product safety, and tax laws',
            'Himal Commerce provides the technology, payment processing infrastructure, and platform-level policies. We may receive a commission from Sellers based on the platform plan they subscribe to.',
          ],
        },
        {
          h: '2. Buyer terms',
          body: [
            'By placing an order, you agree to:',
            '• Provide accurate shipping information including a valid Nepal mobile number for delivery coordination',
            '• Be available to receive the order at the provided address, or to take the courier\'s call',
            '• For Cash on Delivery (COD) orders: have the exact cash amount ready at delivery, or be prepared to provide change',
            '• For high-value COD orders (above the Seller\'s COD verification threshold, typically Rs 5,000): complete phone OTP verification before the order is processed',
            '• For age-restricted products (alcohol, tobacco): confirm you are 18 years or older at checkout — your confirmation is logged with timestamp and IP for compliance with the Tobacco Product Control Act 2068',
            '• Not use the platform for fraud, money laundering (per Nepal ARMA 2008), or any activity prohibited under Nepali law',
            '• Pay all applicable taxes including 13% VAT where applicable, displayed at checkout',
          ],
        },
        {
          h: '3. Seller obligations',
          body: [
            'Sellers on Himal Commerce must:',
            '• Have a valid PAN issued by IRD Nepal. VAT-registered Sellers must display their VAT number on invoices',
            '• Provide accurate product descriptions, including origin, materials, and any restrictions',
            '• Comply with Nepal\'s Consumer Protection Act 2075 — including honoring the published return policy and not engaging in deceptive advertising',
            '• Not list prohibited products: cannabis (Narcotic Drugs Control Act 2033), counterfeit goods, wildlife products (CITES), unlicensed pharmaceuticals (Drug Act 1978)',
            '• Age-restricted products (alcohol, tobacco) must be flagged with ageRestricted=true and display the required health warnings per the Tobacco Product Control Act 2068',
            '• Ship orders within the promised SLA, or notify the buyer of delays',
            '• Issue VAT-compliant invoices with sequential invoice numbers for tax-registered transactions',
            '• Be solely responsible for their own income tax, VAT, and TDS obligations — Himal Commerce does not withhold on Sellers\' behalf except where mandated by law',
          ],
        },
        {
          h: '4. Prohibited conduct',
          body: [
            'You may not use the platform to:',
            '• Sell or attempt to buy prohibited, illegal, or restricted goods under Nepali law',
            '• Engage in money laundering or terrorism financing per the Anti-Money Laundering Act 2008',
            '• Submit false or misleading information, including fake reviews or counterfeit product listings',
            '• Attempt to circumvent the platform\'s payment system (e.g., soliciting off-platform payment to avoid fees)',
            '• Reverse engineer, scrape, or otherwise misuse the platform\'s technology',
            '• Use the platform to send unsolicited commercial communications (spam)',
            'Violations may result in account suspension, order cancellation, and reporting to Nepal\'s Department of Commerce or Cyber Bureau of Nepal Police.',
          ],
        },
        {
          h: '5. Intellectual property',
          body: [
            'The Himal Commerce name, logo, and platform code are the intellectual property of Himal Commerce. Seller product photos, descriptions, and brand assets remain the Seller\'s property.',
            'If you believe your intellectual property has been infringed by a listing on our platform, submit a takedown notice to ip@himal-commerce.np including: (a) identification of the copyrighted work, (b) the URL of the infringing listing, (c) your contact information, and (d) a good-faith statement that the use is unauthorized. We will respond within 5 business days, in compliance with Nepal\'s Copyright Act 2059 (2002).',
          ],
        },
        {
          h: '6. Limitation of liability',
          body: [
            'To the maximum extent permitted by Nepali law:',
            '• Himal Commerce is not liable for the quality, safety, or legality of products sold by Sellers',
            '• Himal Commerce is not liable for Seller\'s failure to ship, refund, or honor warranties',
            '• Himal Commerce\'s total liability for any claim arising from the platform is limited to the platform commission earned on the transaction in question',
            '• Himal Commerce is not liable for indirect, incidental, or consequential damages',
            'These limitations do not apply to liability that cannot be excluded under Nepal\'s Consumer Protection Act 2075, including liability for gross negligence or willful misconduct.',
          ],
        },
        {
          h: '7. Dispute resolution',
          body: [
            'For disputes between a Buyer and a Seller, we encourage direct communication first. If unresolved:',
            '• The buyer may file a complaint with Nepal\'s Department of Commerce (doc.gov.np) under the Consumer Protection Act 2075',
            '• Himal Commerce may, at its discretion, mediate disputes and may issue refunds or credits as a goodwill gesture',
            'For disputes with Himal Commerce itself:',
            '• We will attempt good-faith negotiation for 30 days',
            '• If unresolved, the dispute shall be submitted to mediation at the Kathmandu Mediation Center',
            '• If mediation fails, the dispute shall be adjudicated in the Kathmandu District Court',
            '• These terms are governed by the laws of Nepal',
          ],
        },
        {
          h: '8. Payment terms',
          body: [
            'Payment methods accepted: Cash on Delivery (COD), eSewa, Khalti. All prices are in Nepali Rupees (NPR) and include 13% VAT where applicable.',
            'For digital payments (eSewa, Khalti), the order is marked "pending" until the gateway callback confirms the transaction. If the gateway does not confirm within 24 hours, the order may be cancelled and the buyer refunded.',
            'For COD, the buyer pays the courier in cash at delivery. High-value COD orders may require phone OTP verification before the Seller ships.',
            'Refunds are processed to the original payment method within 14 business days. COD refunds are issued via bank transfer or eSewa to the buyer\'s registered phone number.',
          ],
        },
        {
          h: '9. Account suspension',
          body: [
            'Himal Commerce reserves the right to suspend or terminate any Seller account that:',
            '• Violates these Terms or Nepali law',
            '• Has a verified-buyer complaint rate above 5% (measured monthly)',
            '• Fails to ship more than 20% of orders within the promised SLA',
            '• Engages in fraudulent activity, including fake reviews or payment fraud',
            'Sellers may appeal suspension by emailing appeals@himal-commerce.np within 7 days. Suspended Sellers will receive a prorated refund of any prepaid subscription.',
          ],
        },
        {
          h: '10. Amendments',
          body: [
            'We may update these Terms with 30 days\' notice by posting the revised version on this page and notifying registered users via SMS/email. Continued use of the platform after the effective date constitutes acceptance of the revised Terms.',
            'If you do not agree with the revised Terms, you may stop using the platform. Existing orders will be fulfilled under the Terms in effect at the time of order placement.',
          ],
        },
        {
          h: '11. Contact',
          body: [
            'For questions about these Terms:',
            'Himal Commerce · Legal',
            'Email: legal@himal-commerce.np',
            'Phone: +977 1 4123 456',
            'Address: Patan Dhoka, Lalitpur 44600, Nepal',
          ],
        },
      ]}
    />
  )
}
