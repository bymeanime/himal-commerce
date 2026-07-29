import { db } from '../src/lib/db'
import { SEED_CATEGORIES, SEED_PRODUCTS } from '../src/lib/nepal'

async function seed() {
  console.log('Seeding Himal Commerce database...')

  // Clear existing
  await db.orderItem.deleteMany()
  await db.order.deleteMany()
  await db.customer.deleteMany()
  await db.product.deleteMany()
  await db.category.deleteMany()

  // Categories
  const catMap = new Map<string, string>()
  for (const c of SEED_CATEGORIES) {
    const cat = await db.category.create({ data: { name: c.name, slug: c.slug, icon: c.icon } })
    catMap.set(c.slug, cat.id)
    console.log(`  + Category: ${c.name}`)
  }

  // Products
  for (const p of SEED_PRODUCTS) {
    await db.product.create({
      data: {
        title: p.title,
        subtitle: p.subtitle,
        description: p.description,
        thumbnail: p.thumbnail,
        price: p.price * 100, // convert NPR to paisa
        compareAt: p.compareAt ? p.compareAt * 100 : null,
        sku: p.sku,
        status: 'published',
        inventory: p.inventory,
        origin: p.origin,
        isHandmade: p.isHandmade,
        categoryId: catMap.get(p.categorySlug)!,
      },
    })
    console.log(`  + Product: ${p.title}`)
  }

  // Seed a few sample customers + orders so admin dashboard isn't empty
  const customers = [
    { name: 'Bishnu Prasad Sharma', phone: '9801234567', email: 'bishnu@example.com', city: 'Kathmandu', district: 'Kathmandu', address: 'Baneshwor, Kathmandu' },
    { name: 'Sita Gurung', phone: '9852345678', email: 'sita@example.com', city: 'Pokhara', district: 'Kaski', address: 'Lakeside, Pokhara' },
    { name: 'Ramesh Tamang', phone: '9863456789', city: 'Lalitpur', district: 'Lalitpur', address: 'Pulchowk, Lalitpur' },
    { name: 'Anjali Maharjan', phone: '9874567890', email: 'anjali@example.com', city: 'Bhaktapur', district: 'Bhaktapur', address: 'Durbar Square, Bhaktapur' },
  ]

  const createdCustomers = []
  for (const c of customers) {
    const cust = await db.customer.create({ data: c })
    createdCustomers.push(cust)
    console.log(`  + Customer: ${c.name}`)
  }

  // Create a few sample orders spread across recent days
  const allProducts = await db.product.findMany()
  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'delivered']
  const paymentMethods = ['cod', 'esewa', 'khalti', 'cod', 'esewa']

  for (let i = 0; i < 8; i++) {
    const cust = createdCustomers[i % createdCustomers.length]
    const prod1 = allProducts[i % allProducts.length]
    const prod2 = allProducts[(i + 3) % allProducts.length]

    const items = [
      { productId: prod1.id, title: prod1.title, thumbnail: prod1.thumbnail, price: prod1.price, quantity: 1 + (i % 3) },
      { productId: prod2.id, title: prod2.title, thumbnail: prod2.thumbnail, price: prod2.price, quantity: 1 },
    ]
    const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0)
    const shippingCost = 100 * 100 // Rs 100 in KTM
    const total = subtotal + shippingCost

    const status = statuses[i % statuses.length]
    const paymentStatus = status === 'delivered' ? 'paid' : (i % 3 === 0 ? 'paid' : 'unpaid')

    // Spread across the last 14 days
    const daysAgo = Math.floor(i * 1.5)
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)

    const order = await db.order.create({
      data: {
        orderNumber: `HC-${String(2024000 + i + 1)}`,
        status,
        customerId: cust.id,
        customerName: cust.name,
        customerPhone: cust.phone,
        customerEmail: cust.email,
        shippingAddress: cust.address!,
        shippingCity: cust.city!,
        shippingDistrict: cust.district!,
        shippingZone: 'Bagmati',
        paymentMethod: paymentMethods[i % paymentMethods.length],
        paymentStatus,
        subtotal,
        shippingCost,
        total,
        items: { create: items },
        createdAt,
      },
    })
    console.log(`  + Order: ${order.orderNumber} (${order.status})`)
  }

  console.log('\nSeed complete!')
  console.log(`  ${SEED_CATEGORIES.length} categories`)
  console.log(`  ${SEED_PRODUCTS.length} products`)
  console.log(`  ${customers.length} customers`)
  console.log(`  8 orders`)
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
