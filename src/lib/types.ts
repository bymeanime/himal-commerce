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
  status: 'active' | 'suspended' | 'draft'
  plan: 'free' | 'pro' | 'enterprise'
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
  status: 'draft' | 'published'
  inventory: number
  weightGrams: number | null
  origin: string | null
  isHandmade: boolean
  categoryId: string | null
  category: Category | null
  createdAt: string
  updatedAt: string
  variants?: ProductVariant[]
  images?: ProductImage[]
}

export type Category = {
  id: string
  storeId: string
  name: string
  slug: string
  icon: string | null
  description: string | null
  imageUrl: string | null
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
  quantity: number
}

export type Order = {
  id: string
  storeId: string
  orderNumber: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  fulfillment: 'unfulfilled' | 'fulfilled' | 'returned'
  customerId: string | null
  customerName: string
  customerPhone: string
  customerEmail: string | null
  shippingAddress: string
  shippingCity: string
  shippingDistrict: string
  shippingZone: string
  paymentMethod: 'cod' | 'esewa' | 'khalti'
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'refunded'
  subtotal: number
  shippingCost: number
  total: number
  notes: string | null
  items: OrderItem[]
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
  createdAt: string
  orders?: Order[]
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
