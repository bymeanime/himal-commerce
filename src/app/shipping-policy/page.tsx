import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description: 'Himal Commerce ships to all 77 districts of Nepal. Shipping costs, delivery times, courier partners, and COD coverage. Free shipping over Rs 5,000 inside Kathmandu Valley.',
  alternates: { canonical: '/shipping-policy' },
}

export default function ShippingPolicyPage() {
  return (
    <LegalPage
      title="Shipping Policy"
      lastUpdated="2025-07-31"
      intro="Himal Commerce ships to all 77 districts of Nepal. This policy explains our shipping rates, delivery timelines, and courier partners. Each Seller may set their own rates — the rate displayed at checkout is the rate you pay."
      sections={[
        {
          h: '1. Where we ship',
          body: [
            'We ship to all 77 districts of Nepal, from Kathmandu Valley to remote districts in Karnali and Sudurpashchim. We do not currently ship internationally — international shipping is planned for Phase 3 of the platform.',
            'For remote districts (Karnali, Sudurpashchim), delivery may take longer and shipping costs may be higher to reflect actual courier charges.',
          ],
        },
        {
          h: '2. Shipping rates',
          body: [
            'Default shipping rates (each Seller may customize):',
            '• Kathmandu Valley (Kathmandu, Lalitpur, Bhaktapur): Rs 100',
            '• Other districts (Terai, Hills): Rs 200',
            '• Far-western region (Sudurpashchim): Rs 300',
            '• Karnali region: Rs 350',
            'Free shipping on orders over Rs 5,000 inside Kathmandu Valley (each Seller may set their own threshold).',
            'Shipping rates are calculated based on package weight and destination district. For heavy items (e.g., Khukuri, large singing bowls), additional weight-based charges may apply and will be displayed at checkout before you confirm your order.',
            'Shipping cost is non-refundable for partial returns. For full order returns due to Seller error, shipping is refunded in full.',
          ],
        },
        {
          h: '3. Delivery timelines',
          body: [
            'Estimated delivery times after the order is shipped:',
            '• Kathmandu Valley: 1-2 business days',
            '• Other Terai and Hill districts: 2-5 business days',
            '• Remote districts (Karnali, Sudurpashchim, mountain districts): 4-8 business days',
            'These are estimates. Actual delivery depends on weather, road conditions, and festival season. During Dashain/Tihar (Oct-Nov), delivery may take 1-3 days longer than usual due to high volume.',
            'You will receive an SMS with tracking information when your order ships. You can also track your order via "Track my order" on the storefront.',
          ],
        },
        {
          h: '4. Order processing',
          body: [
            'Most orders are processed and shipped within 24 hours of placement. During peak seasons (Dashain, Tihar, New Year), processing may take up to 48 hours.',
            'Made-to-order items (custom Thangkas, custom jewelry, commissioned pieces) have longer processing times — typically 2-6 weeks. This is stated on the product page.',
            'For Cash on Delivery (COD) orders above Rs 5,000, we require phone OTP verification before processing. This is to prevent fraud and protect Sellers from fake orders.',
          ],
        },
        {
          h: '5. Courier partners',
          body: [
            'We work with multiple courier partners to ensure reliable delivery across Nepal:',
            '• Pathao — urban and semi-urban areas, fast delivery in Kathmandu Valley',
            '• Nepal Can Move — nationwide coverage including remote districts',
            '• Aramex — premium service, recommended for high-value items',
            '• FedEx — reserved for future international shipments',
            'The Seller chooses the courier based on destination, package size, and value. You will see the courier name and tracking number in your shipping confirmation SMS.',
          ],
        },
        {
          h: '6. Tracking your order',
          body: [
            'Once your order ships, you will receive:',
            '• An SMS with the courier name and tracking number',
            '• A link to track your shipment on the courier\'s website',
            'You can also track your order anytime by:',
            '• Going to "Track my order" on the storefront',
            '• Entering your phone number',
            '• Verifying via OTP',
            '• Viewing your order status and tracking information',
          ],
        },
        {
          h: '7. Delivery',
          body: [
            'On delivery day:',
            '• The courier will call you on your registered phone number before arriving',
            '• For COD orders, please have the exact cash amount ready — couriers may not carry change',
            '• Please inspect the package before accepting delivery. If the seal is broken or the package appears tampered with, you may refuse delivery and contact us',
            '• If you are not available at delivery, the courier will attempt redelivery up to 2 more times over 5 business days. After 3 failed attempts, the order is returned to the Seller and refunded (COD refund) or held for pickup (digital payment).',
          ],
        },
        {
          h: '8. Risk of loss',
          body: [
            'Risk of loss passes to you when the order is delivered to the address you provided. If the courier\'s tracking shows "delivered" but you did not receive the package:',
            '• Contact the Seller within 48 hours',
            '• The Seller will investigate with the courier (typically 5-10 business days)',
            '• If the courier confirms misdelivery, you will receive a full refund or replacement',
            'Himal Commerce is not liable for packages marked "delivered" by the courier, but we will mediate between you and the Seller.',
          ],
        },
        {
          h: '9. Address accuracy',
          body: [
            'You are responsible for providing an accurate shipping address including:',
            '• House number and street name',
            '• Ward number (required by most couriers for last-mile delivery)',
            '• Municipality or Rural Municipality name',
            '• City / district',
            '• Postal code (if available — Nepal has postal codes for all districts)',
            '• A valid Nepal mobile number where you can be reached on delivery day',
            'If a package is returned to the Seller due to an incorrect or incomplete address, you may be charged a re-shipping fee.',
          ],
        },
        {
          h: '10. Contact',
          body: [
            'For shipping questions:',
            '• Contact the Seller first using the support phone/email on their storefront',
            '• Escalate to Himal Commerce: support@himal-commerce.np · +977 1 4123 456',
          ],
        },
      ]}
    />
  )
}
