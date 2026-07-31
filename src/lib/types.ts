// Shared types matching the Prisma models

export type Store = {
  id: string
  name: string
  slug: string
  description: string | null
  tagline: string | null
  logoUrl: string | null
  bannerUrl: string | null
  primaryColor: string
  accentColor: string
  currency: string
  ownerName: string
  ownerEmail: string | null
  ownerPhone: string | null
  supportPhone: string | null
  supportEmail: string | null
  address: string | null
  socialTwitter: string | null
  socialFacebook: string | null
  socialInstagram: string | null
  socialTiktok: string | null
  socialYoutube: string | null
  socialViber: string | null
  socialWhatsapp: string | null
  // Finance / Legal
  panNumber: string | null
  vatNumber: string | null
  vatRegistered: boolean
  businessRegistrationNumber: string | null
  defaultTaxRate: number
  taxInclusiveDisplay: boolean
  vatInvoicePrefix: string
  verificationStatus: string
  refundPolicyDays: number
  returnPolicyText: string | null
  shippingPolicyText: string | null
  // Logistics
  codRiskThreshold: number
  freeShippingThreshold: number | null
  shippingRates: string | null
  // Marketing
  announcementBar: string | null
  marketingConfig: string | null
  // Platform
  status: 'active' | 'suspended' | 'draft'
  plan: 'free' | 'pro' | 'enterprise'
  platformCommissionRateBps: number
  orderCounter: number
  invoiceCounter: number
  createdAt: string
  updatedAt: string
}

export type ProductVariant = {
  id: string
  productId: string
  sku: string | null
  title: string
  price: number | null
  inventory: number
  attributes: Record<string, string>
  sortOrder: number
}

export type ProductImage = {
  id: string
  productId: string
  url: string
  altText: string | null
  sortOrder: number
}

export type Product = {
  id: string
  storeId: string
  title: string
  slug: string | null
  subtitle: string | null
  description: string
  thumbnail: string | null
  price: number // paisa
  compareAt: number | null
  sku: string | null
  gtin: string | null
  barcode: string | null
  status: 'draft' | 'published'
  inventory: number
  weightGrams: number | null
  lengthMm: number | null
  widthMm: number | null
  heightMm: number | null
  origin: string | null
  isHandmade: boolean
  specifications: string | null
  artisanStory: string | null
  careGuide: string | null
  lowStockThreshold: number
  viewCount: number
  restrictedCategory: string | null
  ageRestricted: boolean
  minAge: number
  healthWarningText: string | null
  requiresLicense: string | null
  categoryId: string | null
  category: Category | null
  createdAt: string
  updatedAt: string
  variants?: ProductVariant[]
  images?: ProductImage[]
  reviews?: ProductReview[]
}

export type Category = {
  id: string
  storeId: string
  name: string
  slug: string
  icon: string | null
  description: string | null
  imageUrl: string | null
  editorialMd: string | null
  parentId: string | null
  sortOrder: number
}

export type OrderItem = {
  id: string
  orderId: string
  productId: string | null
  variantId: string | null
  title: string
  variantTitle: string | null
  thumbnail: string | null
  price: number
  taxRate: number
  taxAmount: number
  quantity: number
}

export type OrderEvent = {
  id: string
  orderId: string
  type: string
  message: string
  actorId: string | null
  actorKind: string
  createdAt: string
}

export type Order = {
  id: string
  storeId: string
  orderNumber: string
  invoiceNumber: string | null
  invoiceSequence: number
  invoiceFiscalYearBs: string | null
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'refunded' | 'on_hold'
  fulfillment: 'unfulfilled' | 'fulfilled' | 'returned'
  customerId: string | null
  customerName: string
  customerPhone: string
  customerEmail: string | null
  shippingAddress: string
  shippingCity: string
  shippingDistrict: string
  shippingZone: string
  shippingWard: string | null
  shippingMunicipality: string | null
  shippingPostalCode: string | null
  paymentMethod: 'cod' | 'esewa' | 'khalti'
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'refunded' | 'partially_refunded'
  subtotal: number
  shippingCost: number
  taxRate: number
  taxTotal: number
  taxInclusive: boolean
  discountAmount: number
  total: number
  notes: string | null
  internalNotes: string | null
  courier: string | null
  trackingNumber: string | null
  codRiskScore: number | null
  codVerified: boolean
  codVerificationMethod: string | null
  verificationStatus: string
  disputeStatus: string | null
  utm: string | null
  referrer: string | null
  affiliateId: string | null
  commissionAmount: number
  couponId: string | null
  paidAt: string | null
  shippedAt: string | null
  deliveredAt: string | null
  cancelledAt: string | null
  refundedAt: string | null
  heldReason: string | null
  items: OrderItem[]
  events?: OrderEvent[]
  customer?: Customer | null
  createdAt: string
  updatedAt: string
}

export type Customer = {
  id: string
  storeId: string
  name: string
  phone: string
  email: string | null
  address: string | null
  city: string | null
  district: string | null
  consentAt: string | null
  consentVersion: string | null
  marketingOptIn: boolean
  preferredDisplayCurrency: string | null
  createdAt: string
  orders?: Order[]
}

export type ProductReview = {
  id: string
  productId: string
  storeId: string
  customerId: string | null
  customerName: string
  rating: number
  title: string | null
  body: string | null
  imageUrl: string | null
  status: 'pending' | 'approved' | 'rejected'
  verified: boolean
  createdAt: string
}

// Cart line item — what gets added to the cart
export type CartItem = {
  productId: string
  variantId: string | null
  storeId: string // Cart items are scoped to a single store
  title: string
  variantTitle: string | null
  thumbnail: string | null
  price: number // paisa
  quantity: number
}

export type BlogPost = {
  id: string
  storeId: string
  title: string
  slug: string
  excerpt: string | null
  body: string
  coverImage: string | null
  author: string | null
  tags: string | null
  metaTitle: string | null
  metaDescription: string | null
  status: 'draft' | 'published' | 'archived'
  publishedAt: string | null
  viewCount: number
  readingMinutes: number
  createdAt: string
  updatedAt: string
}

export type Influencer = {
  id: string
  storeId: string
  name: string
  handle: string | null
  email: string | null
  phone: string | null
  code: string
  commissionType: 'percent' | 'fixed'
  commissionValue: number
  clicks: number
  conversions: number
  revenue: number
  commissionEarned: number
  totalPaidOut: number
  status: 'active' | 'paused' | 'paid_out'
  createdAt: string
}

export type Affiliate = {
  id: string
  storeId: string
  name: string
  email: string | null
  code: string
  commissionRateBps: number
  clicks: number
  conversions: number
  revenue: number
  commissionEarned: number
  totalPaidOut: number
  status: 'active' | 'paused'
  createdAt: string
}
