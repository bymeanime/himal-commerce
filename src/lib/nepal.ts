// Nepal-specific data and helpers

export const NEPAL_PROVINCES = [
  { name: 'Koshi', districts: ['Bhojpur', 'Dhankuta', 'Ilam', 'Jhapa', 'Khotang', 'Morang', 'Okhaldhunga', 'Panchthar', 'Sankhuwasabha', 'Solukhumbu', 'Sunsari', 'Taplejung', 'Terhathum', 'Udayapur'] },
  { name: 'Madhesh', districts: ['Bara', 'Dhanusha', 'Mahottari', 'Parsa', 'Rautahat', 'Saptari', 'Sarlahi', 'Siraha'] },
  { name: 'Bagmati', districts: ['Bhaktapur', 'Chitwan', 'Dhading', 'Dolakha', 'Gorkha', 'Kabhrepalanchok', 'Kathmandu', 'Lalitpur', 'Makwanpur', 'Nuwakot', 'Ramechhap', 'Rasuwa', 'Sindhuli', 'Sindhupalchok'] },
  { name: 'Gandaki', districts: ['Baglung', 'Gorkha', 'Kaski', 'Lamjung', 'Manang', 'Mustang', 'Myagdi', 'Nawalpur', 'Parbat', 'Syangja', 'Tanahun'] },
  { name: 'Lumbini', districts: ['Arghakhanchi', 'Banke', 'Bardiya', 'Dang', 'Gulmi', 'Kapilvastu', 'Parasi', 'Palpa', 'Pyuthan', 'Rolpa', 'Rukum Purba', 'Rupandehi'] },
  { name: 'Karnali', districts: ['Dailekh', 'Dolpa', 'Humla', 'Jajarkot', 'Jumla', 'Kalikot', 'Mugu', 'Rukum Paschim', 'Salyan', 'Surkhet'] },
  { name: 'Sudurpashchim', districts: ['Achham', 'Baitadi', 'Bajhang', 'Bajura', 'Dadeldhura', 'Darchula', 'Doti', 'Kailali', 'Kanchanpur'] },
] as const

export const ALL_DISTRICTS = NEPAL_PROVINCES.flatMap(p => p.districts.map(d => ({ district: d, province: p.name })))

export const KATHMANDU_VALLEY = ['Kathmandu', 'Lalitpur', 'Bhaktapur']

// Shipping cost in paisa (1 NPR = 100 paisa)
// Inside KTM valley: Rs 100, outside valley but within Nepal: Rs 200-350 based on zone
export function calcShippingCost(district: string): number {
  if (!district) return 0
  if (KATHMANDU_VALLEY.includes(district)) return 100 * 100 // Rs 100
  // Far-west and Karnali are more remote
  const farWest = ['Sudurpashchim'].includes(getProvince(district) || '')
  const karnali = ['Karnali'].includes(getProvince(district) || '')
  if (karnali) return 350 * 100
  if (farWest) return 300 * 100
  return 200 * 100
}

export function getProvince(district: string): string | null {
  const found = NEPAL_PROVINCES.find(p => p.districts.includes(district as never))
  return found ? found.name : null
}

// NPR currency formatting
export function formatNPR(paisa: number): string {
  const npr = paisa / 100
  // Use Indian/Nepali numbering (lakh, crore) — comma after 3 then every 2
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(npr)
  return `रू ${formatted}`
}

export function nprToPaisa(npr: number): number {
  return Math.round(npr * 100)
}

export function paisaToNpr(paisa: number): number {
  return paisa / 100
}

// Nepal payment methods
export const PAYMENT_METHODS = [
  {
    id: 'cod',
    name: 'Cash on Delivery',
    nepali: 'क्यास अन डेलिभरी',
    description: 'Pay with cash when your order arrives at your doorstep',
    icon: 'truck',
    popular: true,
  },
  {
    id: 'esewa',
    name: 'eSewa',
    nepali: 'ई-सेवा',
    description: "Nepal's #1 digital wallet — pay instantly with your eSewa account",
    icon: 'wallet',
    popular: true,
  },
  {
    id: 'khalti',
    name: 'Khalti',
    nepali: 'खल्ती',
    description: 'Pay with Khalti wallet, mobile banking, or connect IPS',
    icon: 'wallet',
    popular: false,
  },
] as const

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]['id']

// Sample product data — Nepali-made goods
export const SEED_CATEGORIES = [
  { name: 'Apparel & Textiles', slug: 'apparel', icon: 'shirt' },
  { name: 'Handicrafts', slug: 'handicrafts', icon: 'hammer' },
  { name: 'Tea & Spices', slug: 'tea-spices', icon: 'leaf' },
  { name: 'Jewelry & Malas', slug: 'jewelry', icon: 'gem' },
  { name: 'Home & Decor', slug: 'home-decor', icon: 'home' },
  { name: 'Stationery', slug: 'stationery', icon: 'book' },
]

export const SEED_PRODUCTS = [
  {
    title: 'Handwoven Dhaka Topi',
    subtitle: 'Traditional Nepali cap',
    description: 'Handwoven Dhaka topi crafted by artisans in Palpa. The distinctive geometric pattern is woven on traditional handlooms using cotton thread. An essential accessory for Dashain, Tihar, weddings, and Nepali cultural events. Each topi takes 2-3 days to weave.',
    price: 850,
    inventory: 42,
    categorySlug: 'apparel',
    origin: 'Palpa',
    isHandmade: true,
    thumbnail: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&q=80',
    sku: 'DHAKA-TOP-001',
  },
  {
    title: 'Authentic Gurkha Khukuri',
    subtitle: 'Hand-forged in Bhojpur',
    description: 'Authentic Khukuri knife hand-forged by traditional Kami artisans in Bhojpur, eastern Nepal. Features a 10-inch curved carbon steel blade, rosewood handle, and brass fittings. Comes with traditional leather sheath and karda (small knife) and chakmak (sharpener). The national weapon of Nepal and a symbol of Gurkha bravery.',
    price: 4200,
    inventory: 15,
    categorySlug: 'handicrafts',
    origin: 'Bhojpur',
    isHandmade: true,
    thumbnail: 'https://images.unsplash.com/photo-1593642634443-44adaa06623a?w=600&q=80',
    sku: 'KHUK-BOJ-010',
  },
  {
    title: 'Pure Pashmina Shawl',
    subtitle: 'Loomed from highland Changthangi goat wool',
    description: 'Luxuriously soft pashmina shawl woven from the undercoat of Changthangi goats reared in the high Himalayas of Mustang and Dolpa. Lightweight yet incredibly warm. Each shawl is hand-woven on traditional looms in Kathmandu valley and takes 3-4 weeks to complete. Measures 200cm x 70cm.',
    price: 6800,
    compareAt: 8500,
    inventory: 8,
    categorySlug: 'apparel',
    origin: 'Mustang',
    isHandmade: true,
    thumbnail: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&q=80',
    sku: 'PASH-MUS-100',
  },
  {
    title: 'Ilam Orthodox Loose Tea',
    subtitle: 'Single-estate first flush',
    description: 'Single-estate orthodox loose-leaf black tea from the misty hills of Ilam, eastern Nepal. First-flush harvest (March-April) yields a bright, golden liquor with notes of honey, wild flowers, and a hint of muscatel. Hand-rolled and sun-dried using traditional methods. 250g pack.',
    price: 950,
    inventory: 120,
    categorySlug: 'tea-spices',
    origin: 'Ilam',
    isHandmade: false,
    thumbnail: 'https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=600&q=80',
    sku: 'TEA-ILM-FF-250',
  },
  {
    title: 'Tibetan Singing Bowl',
    subtitle: 'Hand-hammered 7-metal alloy',
    description: 'Hand-hammered singing bowl made in Patan by Newar artisans using traditional 7-metal alloy (gold, silver, mercury, copper, iron, tin, lead). Produces rich harmonic overtones when struck or circled with the included wooden mallet. Used for meditation, sound healing, and chakra balancing. 12cm diameter, includes cushion and mallet.',
    price: 1850,
    inventory: 25,
    categorySlug: 'home-decor',
    origin: 'Lalitpur',
    isHandmade: true,
    thumbnail: 'https://images.unsplash.com/photo-1611689342806-0863700ce1e4?w=600&q=80',
    sku: 'BOWL-PAT-7M-12',
  },
  {
    title: 'Thangka Painting — Green Tara',
    subtitle: 'Natural mineral pigments on cotton',
    description: 'Hand-painted Thangka of Green Tara (Syamatara) by a master artist in Bhaktapur. Painted with natural mineral pigments and 24k gold on prepared cotton canvas. Green Tara is the bodhisattva of compassion in action. Measures 50cm x 70cm, unframed. Takes 4-6 weeks to complete.',
    price: 12500,
    inventory: 4,
    categorySlug: 'home-decor',
    origin: 'Bhaktapur',
    isHandmade: true,
    thumbnail: 'https://images.unsplash.com/photo-1604608672516-3cb787a47a8c?w=600&q=80',
    sku: 'THNG-BKT-GT-50',
  },
  {
    title: 'Yak Wool Sweater',
    subtitle: 'Knitted in Mustang',
    description: 'Warm yak wool sweater hand-knitted by women artisans in Mustang. Naturally water-resistant and incredibly warm — perfect for Himalayan winters. The natural brown color comes undyed from the yak undercoat. Unisex fit. Hand wash only.',
    price: 3200,
    inventory: 18,
    categorySlug: 'apparel',
    origin: 'Mustang',
    isHandmade: true,
    thumbnail: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80',
    sku: 'YAK-MUS-SW-01',
  },
  {
    title: 'Rudraksha Mala 108 Beads',
    subtitle: 'From Nepal Himalayan rudraksha tree',
    description: 'Authentic 108-bead Rudraksha mala from the Elaeocarpus ganitrus trees grown in the foothills of Nepal Himalaya. Each bead is 18mm, naturally panchmukhi (five-faced). Strung on traditional red thread with cotton tassel. Used for japa meditation and worn as a protective talisman.',
    price: 1100,
    inventory: 60,
    categorySlug: 'jewelry',
    origin: 'Kavrepalanchok',
    isHandmade: true,
    thumbnail: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&q=80',
    sku: 'RUD-KAV-108-18',
  },
  {
    title: 'Hemp Backpack',
    subtitle: 'Hand-stitched in Solu',
    description: 'Durable daypack hand-stitched from wild hemp grown without chemicals in the Solu region. Features adjustable shoulder straps, main compartment with drawstring closure, front pocket, and cotton lining. Naturally antibacterial and gets softer with age. 35L capacity.',
    price: 2400,
    inventory: 30,
    categorySlug: 'apparel',
    origin: 'Solukhumbu',
    isHandmade: true,
    thumbnail: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80',
    sku: 'HEMP-SOL-BP-35',
  },
  {
    title: 'Timur (Nepali Pepper) 200g',
    subtitle: 'Wild-harvested Sichuan pepper',
    description: 'Wild-harvested Timur (Zanthoxylum armatum) from the mid-hills of Nepal. Distinctive citrusy, numbing flavor — a cornerstone of Nepali momo achar and chutneys. Sun-dried and hand-cleaned. 200g resealable pack. Also known as Nepali pepper or Himalayan pepper.',
    price: 480,
    inventory: 85,
    categorySlug: 'tea-spices',
    origin: 'Salyan',
    isHandmade: false,
    thumbnail: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=80',
    sku: 'SPC-SAL-TMR-200',
  },
  {
    title: 'Lokta Paper Journal',
    subtitle: 'Handmade from Daphne bush bark',
    description: 'Handmade journal crafted from Lokta paper, made from the bark of the Daphne bush that grows in the Himalayan foothills. Naturally moth-resistant and incredibly durable — Lokta paper can last 1,000+ years. 80 unlined pages, hardcover with traditional Nepali motif. Hand-stitched binding.',
    price: 750,
    inventory: 70,
    categorySlug: 'stationery',
    origin: 'Baglung',
    isHandmade: true,
    thumbnail: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600&q=80',
    sku: 'LOK-BAG-JR-80',
  },
  {
    title: 'Silver Turquoise Ring',
    subtitle: '925 silver, Hile turquoise',
    description: 'Handcrafted 925 sterling silver ring set with natural turquoise from Hile, eastern Nepal. Traditional Tibetan-inspired design with filigree work. Each ring is made to order by a Newar silversmith in Patan. Available in sizes 6-12 (US).',
    price: 2800,
    inventory: 12,
    categorySlug: 'jewelry',
    origin: 'Lalitpur',
    isHandmade: true,
    thumbnail: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&q=80',
    sku: 'JWL-PAT-TUR-R',
  },
]
