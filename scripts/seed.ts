import { db } from '../src/lib/db'
import { SEED_STORES, SEED_CATEGORIES_BY_STORE, SEED_PRODUCTS } from '../src/lib/nepal'
import { calcShippingCost, getProvince } from '../src/lib/nepal'

async function seed() {
  console.log('Seeding Himal Commerce multi-store platform...\n')

  // Clear (in dependency-safe order)
  await db.orderItem.deleteMany()
  await db.order.deleteMany()
  await db.customer.deleteMany()
  await db.productVariant.deleteMany()
  await db.productImage.deleteMany()
  await db.product.deleteMany()
  await db.category.deleteMany()
  await db.storeMember.deleteMany()
  await db.store.deleteMany()
  await db.user.deleteMany()

  // ====== Create stores ======
  const storeMap = new Map<string, { id: string; slug: string }>()
  for (const s of SEED_STORES) {
    const store = await db.store.create({
      data: {
        name: s.name,
        slug: s.slug,
        description: s.description,
        tagline: (s as { tagline?: string }).tagline ?? null,
        logoUrl: s.logoUrl,
        primaryColor: s.primaryColor,
        accentColor: s.accentColor,
        currency: s.currency,
        ownerName: s.ownerName,
        ownerEmail: s.ownerEmail,
        ownerPhone: s.ownerPhone,
        supportPhone: (s as { supportPhone?: string }).supportPhone ?? null,
        supportEmail: (s as { supportEmail?: string }).supportEmail ?? null,
        address: (s as { address?: string }).address ?? null,
        socialFacebook: (s as { socialFacebook?: string }).socialFacebook ?? null,
        socialInstagram: (s as { socialInstagram?: string }).socialInstagram ?? null,
        socialTiktok: (s as { socialTiktok?: string }).socialTiktok ?? null,
        socialYoutube: (s as { socialYoutube?: string }).socialYoutube ?? null,
        socialTwitter: (s as { socialTwitter?: string }).socialTwitter ?? null,
        plan: s.plan,
        status: 'active',
      },
    })
    storeMap.set(s.slug, { id: store.id, slug: s.slug })
    console.log(`  + Store: ${s.name} (${s.slug})`)

    // Create owner user + membership
    const user = await db.user.create({
      data: { email: s.ownerEmail!, name: s.ownerName },
    })
    await db.storeMember.create({
      data: { userId: user.id, storeId: store.id, role: 'owner' },
    })
  }

  // ====== Create categories per store ======
  for (const [storeSlug, cats] of Object.entries(SEED_CATEGORIES_BY_STORE)) {
    const store = storeMap.get(storeSlug)!
    for (const c of cats) {
      await db.category.create({
        data: { name: c.name, slug: c.slug, icon: c.icon, storeId: store.id },
      })
    }
    console.log(`  + ${cats.length} categories for ${storeSlug}`)
  }

  // ====== Create products (with optional variants) ======
  let variantCount = 0
  for (const p of SEED_PRODUCTS) {
    const store = storeMap.get(p.storeSlug)!
    const category = await db.category.findFirst({
      where: { storeId: store.id, slug: p.categorySlug },
    })
    if (!category) {
      console.warn(`  ! Category ${p.categorySlug} not found for store ${p.storeSlug}`)
      continue
    }
    // Generate slug from title
    const slug = p.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80)

    const product = await db.product.create({
      data: {
        storeId: store.id,
        title: p.title,
        slug,
        subtitle: p.subtitle,
        description: p.description,
        thumbnail: p.thumbnail,
        price: p.price * 100, // NPR → paisa
        compareAt: p.compareAt ? p.compareAt * 100 : null,
        sku: p.sku,
        status: 'published',
        inventory: p.inventory,
        origin: p.origin,
        isHandmade: p.isHandmade,
        categoryId: category.id,
        // Variants (if provided)
        variants: (p as { variants?: Array<{ title: string; sku?: string; price: number; inventory: number; attributes: Record<string, string> }> }).variants
          ? {
              create: ((p as { variants: Array<{ title: string; sku?: string; price: number; inventory: number; attributes: Record<string, string> }> }).variants).map((v, idx) => ({
                title: v.title,
                sku: v.sku ?? null,
                price: v.price * 100, // NPR → paisa
                inventory: v.inventory,
                attributes: v.attributes,
                sortOrder: idx,
              })),
            }
          : undefined,
      },
      include: { variants: true },
    })
    if (product.variants.length) variantCount += product.variants.length
  }
  console.log(`  + ${SEED_PRODUCTS.length} products across all stores (${variantCount} variants)`)

  // ====== Create sample customers + orders per store ======
  const sampleCustomers = [
    { name: 'Bishnu Prasad Sharma', phone: '9801234567', email: 'bishnu@example.com', city: 'Kathmandu', district: 'Kathmandu', address: 'Baneshwor, Kathmandu' },
    { name: 'Sita Gurung', phone: '9852345678', email: 'sita@example.com', city: 'Pokhara', district: 'Kaski', address: 'Lakeside, Pokhara' },
    { name: 'Ramesh Tamang', phone: '9863456789', city: 'Lalitpur', district: 'Lalitpur', address: 'Pulchowk, Lalitpur' },
    { name: 'Anjali Maharjan', phone: '9874567890', email: 'anjali@example.com', city: 'Bhaktapur', district: 'Bhaktapur', address: 'Durbar Square, Bhaktapur' },
    { name: 'Dipak Thapa', phone: '9885678901', email: 'dipak@example.com', city: 'Dharan', district: 'Sunsari', address: 'Chata Chowk, Dharan' },
    { name: 'Gita Limbu', phone: '9896789012', city: 'Ilam', district: 'Ilam', address: 'Ilam Bazaar, Ilam' },
  ]

  let orderCounter = 0
  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'delivered']
  const paymentMethods = ['cod', 'esewa', 'khalti', 'cod', 'esewa']

  for (const [storeSlug, storeInfo] of storeMap.entries()) {
    const storeProducts = await db.product.findMany({ where: { storeId: storeInfo.id } })
    if (storeProducts.length === 0) continue

    // Pick 2-3 customers for this store
    const storeCustomers = sampleCustomers.slice(0, 3 + (Math.floor(Math.random() * 2)))

    for (let i = 0; i < storeCustomers.length; i++) {
      const c = storeCustomers[i]
      const customer = await db.customer.create({
        data: { ...c, storeId: storeInfo.id },
      })

      // 1-2 orders per customer
      const orderCount = 1 + (i % 2)
      for (let j = 0; j < orderCount; j++) {
        orderCounter++
        const prod1 = storeProducts[(i + j) % storeProducts.length]
        const prod2 = storeProducts[(i + j + 2) % storeProducts.length]

        const items = [
          { productId: prod1.id, title: prod1.title, thumbnail: prod1.thumbnail, price: prod1.price, quantity: 1 + (j % 2) },
          ...(prod2 ? [{ productId: prod2.id, title: prod2.title, thumbnail: prod2.thumbnail, price: prod2.price, quantity: 1 }] : []),
        ]
        const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0)
        const shippingCost = calcShippingCost(c.district)
        const total = subtotal + shippingCost

        const status = statuses[(i + j) % statuses.length]
        const paymentStatus = status === 'delivered' ? 'paid' : ((i + j) % 3 === 0 ? 'paid' : 'unpaid')
        const province = getProvince(c.district) || 'Bagmati'

        const daysAgo = Math.floor(orderCounter * 1.5)
        const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)

        await db.order.create({
          data: {
            storeId: storeInfo.id,
            orderNumber: `HC-${storeSlug.slice(0, 2).toUpperCase()}-${String(1000 + orderCounter)}`,
            status,
            customerId: customer.id,
            customerName: c.name,
            customerPhone: c.phone,
            customerEmail: c.email,
            shippingAddress: c.address,
            shippingCity: c.city,
            shippingDistrict: c.district,
            shippingZone: province,
            paymentMethod: paymentMethods[(i + j) % paymentMethods.length],
            paymentStatus,
            subtotal,
            shippingCost,
            total,
            items: { create: items },
            createdAt,
          },
        })
      }
    }
  }
  console.log(`  + ${orderCounter} orders across all stores`)

  console.log('\n✓ Seed complete!')
  console.log(`  ${SEED_STORES.length} stores`)
  console.log(`  ${Object.values(SEED_CATEGORIES_BY_STORE).flat().length} categories`)
  console.log(`  ${SEED_PRODUCTS.length} products`)
  console.log(`  ${sampleCustomers.length * 3} customers`)
  console.log(`  ${orderCounter} orders`)
}

seed()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
