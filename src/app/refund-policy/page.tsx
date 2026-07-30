import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Refund & Return Policy',
  description: 'Himal Commerce refund and return policy. 7-day return window, refunds within 14 days to original payment method. Compliance with Nepal Consumer Protection Act 2075.',
  alternates: { canonical: '/refund-policy' },
}

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund & Return Policy"
      lastUpdated="2025-07-31"
      intro="This policy explains how returns and refunds work on the Himal Commerce platform. Each Seller may offer a more generous policy — check the policy displayed on the product page. This default policy complies with Nepal's Consumer Protection Act 2075 (2018)."
      sections={[
        {
          h: '1. Return window',
          body: [
            'You may request a return within 7 days of delivery for most products, provided:',
            '• The product is unused, unworn, and in its original packaging',
            '• All tags, manuals, and accessories are included',
            '• The product is not on the non-returnable list below',
            'Perishable goods (tea once opened, food items) and made-to-order items (custom Thangkas, custom jewelry, commissioned pieces) cannot be returned unless they arrive damaged or defective.',
            'Each Seller may set a longer return window (e.g., 14 or 30 days) — this will be displayed on the product page and in your order confirmation. The Seller\'s policy supersedes this default if it is more generous.',
          ],
        },
        {
          h: '2. Non-returnable items',
          body: [
            'The following items cannot be returned for hygiene or customization reasons:',
            '• Opened food, tea, or perishable goods',
            '• Custom-made or personalized items (Thangkas, custom jewelry, monogrammed pieces)',
            '• Personal care items (soaps, lotions, cosmetics once opened)',
            '• Downloadable digital products',
            '• Items damaged by misuse, alteration, or improper care',
            'Defective or damaged items in these categories are still eligible for replacement — see Section 4.',
          ],
        },
        {
          h: '3. How to request a return',
          body: [
            'To request a return:',
            '• Go to "Track my order" on the storefront, enter your phone number, and verify via OTP',
            '• Select the order and item(s) you want to return',
            '• Choose a reason: wrong size, defective, wrong item, changed mind, or other',
            '• Submit the request — the Seller will respond within 2 business days',
            'Once approved, ship the item back to the Seller\'s address (provided in the approval message). You are responsible for return shipping unless the item was defective or wrong — in which case the Seller covers return shipping.',
          ],
        },
        {
          h: '4. Damaged or defective items',
          body: [
            'If your item arrives damaged or defective:',
            '• Take photos of the damage within 48 hours of delivery',
            '• Contact the Seller via "Track my order" or the support phone/email listed on the storefront',
            '• The Seller will arrange a free replacement or full refund — your choice',
            'For high-value items (above Rs 10,000), we recommend recording an unboxing video as evidence in case of dispute.',
            'If the Seller does not respond within 3 business days, escalate to Himal Commerce at support@himal-commerce.np and we will mediate.',
          ],
        },
        {
          h: '5. Refund timeline',
          body: [
            'Once the Seller receives the returned item and verifies its condition, refunds are processed within:',
            '• eSewa / Khalti: 3-5 business days to your original payment method',
            '• COD: 7-14 business days via bank transfer or eSewa to your registered phone number (we will ask for your preferred method)',
            '• Bank transfer: 5-10 business days depending on your bank',
            'You will receive an SMS notification when the refund is processed.',
            'Refunds include the product price and original shipping cost (if the entire order is returned). Return shipping is non-refundable unless the return is due to Seller error.',
          ],
        },
        {
          h: '6. Partial refunds',
          body: [
            'Partial refunds may be issued when:',
            '• Only some items in an order are returned',
            '• The returned item shows signs of use beyond what was disclosed',
            '• Original packaging is missing or damaged',
            'The Seller will explain the partial refund amount before processing. You may accept or escalate to Himal Commerce mediation.',
          ],
        },
        {
          h: '7. Exchanges',
          body: [
            'Need a different size, color, or variant? Exchanges are free for apparel and accessories within the 7-day window — just request a return with reason "wrong size" and place a new order for the correct item. We will refund the original purchase including shipping.',
            'For exchanges of the same item in a different variant, contact the Seller directly — they may be able to swap without requiring a return shipment.',
          ],
        },
        {
          h: '8. Cancellation',
          body: [
            'You may cancel an order before it ships with full refund:',
            '• COD orders: cancel anytime before the Seller marks the order as "shipped"',
            '• Digital payment orders: cancel within 24 hours of placing the order; after that, the payment has settled and a return is required instead',
            'To cancel, go to "Track my order" and tap "Cancel order", or contact the Seller directly.',
          ],
        },
        {
          h: '9. Disputes',
          body: [
            'If you and the Seller cannot agree on a return or refund, escalate to Himal Commerce at support@himal-commerce.np. We will review the case (order history, communications, photos) and issue a binding decision within 7 business days.',
            'For unresolved disputes, you may also file a complaint with Nepal\'s Department of Commerce under the Consumer Protection Act 2075 at doc.gov.np.',
          ],
        },
        {
          h: '10. Contact',
          body: [
            'For return questions:',
            '• Contact the Seller first using the support phone/email on their storefront footer',
            '• Escalate to Himal Commerce: support@himal-commerce.np · +977 1 4123 456',
            '• Government: Department of Commerce, doc.gov.np',
          ],
        },
      ]}
    />
  )
}
