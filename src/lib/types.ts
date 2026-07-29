// Shared types matching the Prisma models

export type Product = {
  id: string
  title: string
  subtitle: string | null
  description: string
  thumbnail: string | null
  price: number // paisa
  compareAt: number | null
  sku: string | null
  barcode: string | null
  status: 'draft' | 'published'
  inventory: number
  weightGrams: number | null
  origin: string | null
  isHandmade: boolean
  categoryId: string | null
  category: Category | null
  createdAt: string
  updatedAt: string
}

export type Category = {
  id: string
  name: string
  slug: string
  icon: string | null
}

export type OrderItem = {
  id: string
  orderId: string
  productId: string | null
  title: string
  thumbnail: string | null
  price: number
  quantity: number
}

export type Order = {
  id: string
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
  paymentStatus: 'unpaid' | 'paid' | 'refunded'
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
  title: string
  thumbnail: string | null
  price: number // paisa
  quantity: number
}
