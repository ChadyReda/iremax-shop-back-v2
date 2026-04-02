import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import slugify from 'slugify'

const prisma = new PrismaClient()

async function seed() {
  console.log('🌱 Seeding database...\n')

  // Clean
  await prisma.cartItem.deleteMany()
  await prisma.cart.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.shippingAddress.deleteMany()
  await prisma.order.deleteMany()
  await prisma.productVariant.deleteMany()
  await prisma.productImage.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.address.deleteMany()
  await prisma.user.deleteMany()

  // ── Users ──────────────────────────────────────
  const adminHash    = await bcrypt.hash('Admin@1234', 12)
  const customerHash = await bcrypt.hash('Customer@1234', 12)

  await prisma.user.create({
    data: {
      email:        'admin@elara.com',
      passwordHash: adminHash,
      firstName:    'Sofia',
      lastName:     'Marchetti',
      role:         'ADMIN',
    },
  })

  await prisma.user.create({
    data: {
      email:        'jane@example.com',
      passwordHash: customerHash,
      firstName:    'Jane',
      lastName:     'Laurent',
      addresses: {
        create: {
          label:     'Home',
          firstName: 'Jane',
          lastName:  'Laurent',
          street:    '142 Bloom Street',
          city:      'New York',
          state:     'NY',
          zip:       '10001',
          country:   'US',
          isDefault: true,
        },
      },
    },
  })

  console.log('✅ Users created')

  // ── Categories ─────────────────────────────────
  const categoryData = [
    { name: 'Clothing',          imageUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600',        sortOrder: 1  },
    { name: 'Dresses',           imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600',     sortOrder: 2  },
    { name: 'Tops & Blouses',    imageUrl: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600',        sortOrder: 3  },
    { name: 'Bottoms',           imageUrl: 'https://images.unsplash.com/photo-1551854838-212c9a5e3b8b?w=600',        sortOrder: 4  },
    { name: 'Pajamas',           imageUrl: 'https://images.unsplash.com/photo-1586329813697-f7a0fc9e9d4d?w=600',     sortOrder: 5  },
    { name: 'Makeup',            imageUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600',     sortOrder: 6  },
    { name: 'Skincare',          imageUrl: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600',        sortOrder: 7  },
    { name: 'Bags & Handbags',   imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600',        sortOrder: 8  },
    { name: 'Shoes',             imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600',        sortOrder: 9  },
    { name: 'Accessories',       imageUrl: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=600',     sortOrder: 10 },
  ]

  const categories: Record<string, string> = {}
  for (const cat of categoryData) {
    const slug    = slugify(cat.name, { lower: true, strict: true })
    const created = await prisma.category.create({
      data: { ...cat, slug },
    })
    categories[slug] = created.id
  }

  console.log(`✅ ${categoryData.length} categories created`)

  // ── Products ───────────────────────────────────
  const products = [
    {
      name:             'Ivory Linen Wide-Leg Trousers',
      sku:              'BTM-001',
      shortDescription: 'Relaxed wide-leg trousers in breathable linen blend',
      description:      'Effortlessly elegant trousers cut from a premium linen-cotton blend. High waist, wide legs, and a relaxed drape. Side pockets, invisible zip closure.',
      categorySlug:     'bottoms',
      brand:            'Elara Studio',
      price:            89.00,
      compareAtPrice:   120.00,
      isFeatured:       true,
      isNewArrival:     false,
      tags:             ['linen', 'trousers', 'wide-leg', 'summer'],
      images: [
        { url: 'https://images.unsplash.com/photo-1551854838-212c9a5e3b8b?w=800', alt: 'Ivory Linen Trousers', isPrimary: true, sortOrder: 0 },
      ],
      variants: [
        { sku: 'BTM-001-XS', size: 'XS', stock: 8,  additionalPrice: 0 },
        { sku: 'BTM-001-S',  size: 'S',  stock: 15, additionalPrice: 0 },
        { sku: 'BTM-001-M',  size: 'M',  stock: 20, additionalPrice: 0 },
        { sku: 'BTM-001-L',  size: 'L',  stock: 12, additionalPrice: 0 },
        { sku: 'BTM-001-XL', size: 'XL', stock: 6,  additionalPrice: 0 },
      ],
    },
    {
      name:             'Silk Charmeuse Slip Dress',
      sku:              'DRS-001',
      shortDescription: 'Fluid silk slip dress with adjustable straps',
      description:      'Cut from pure silk charmeuse, this bias-cut slip dress skims the body with effortless grace. Adjustable spaghetti straps, V-neckline, raw-edge hem.',
      categorySlug:     'dresses',
      brand:            'Elara Silk',
      price:            195.00,
      compareAtPrice:   250.00,
      isFeatured:       true,
      isNewArrival:     true,
      tags:             ['silk', 'slip', 'dress', 'evening', 'luxury'],
      images: [
        { url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800', alt: 'Silk Slip Dress', isPrimary: true, sortOrder: 0 },
      ],
      variants: [
        { sku: 'DRS-001-BLK-XS', size: 'XS', color: 'Black', colorHex: '#1a1a1a', stock: 5,  additionalPrice: 0 },
        { sku: 'DRS-001-BLK-S',  size: 'S',  color: 'Black', colorHex: '#1a1a1a', stock: 8,  additionalPrice: 0 },
        { sku: 'DRS-001-BLK-M',  size: 'M',  color: 'Black', colorHex: '#1a1a1a', stock: 10, additionalPrice: 0 },
        { sku: 'DRS-001-CRM-S',  size: 'S',  color: 'Cream', colorHex: '#f5f5dc', stock: 7,  additionalPrice: 0 },
        { sku: 'DRS-001-CRM-M',  size: 'M',  color: 'Cream', colorHex: '#f5f5dc', stock: 9,  additionalPrice: 0 },
        { sku: 'DRS-001-RSE-S',  size: 'S',  color: 'Rose',  colorHex: '#e8a0a0', stock: 6,  additionalPrice: 0 },
        { sku: 'DRS-001-RSE-M',  size: 'M',  color: 'Rose',  colorHex: '#e8a0a0', stock: 8,  additionalPrice: 0 },
      ],
    },
    {
      name:             'Cashmere Cloud Pajama Set',
      sku:              'PJM-001',
      shortDescription: '100% Mongolian cashmere pajama set in cloud grey',
      description:      'Woven from 100% Grade-A Mongolian cashmere. Button-front top and wide-leg pants with elastic waist. Unbelievably soft against the skin.',
      categorySlug:     'pajamas',
      brand:            'Elara Sleep',
      price:            285.00,
      compareAtPrice:   340.00,
      isFeatured:       true,
      isNewArrival:     false,
      tags:             ['cashmere', 'pajamas', 'luxury', 'gift'],
      images: [
        { url: 'https://images.unsplash.com/photo-1586329813697-f7a0fc9e9d4d?w=800', alt: 'Cashmere Pajama Set', isPrimary: true, sortOrder: 0 },
      ],
      variants: [
        { sku: 'PJM-001-GRY-S', size: 'S', color: 'Cloud Grey', colorHex: '#b0b0b0', stock: 6, additionalPrice: 0 },
        { sku: 'PJM-001-GRY-M', size: 'M', color: 'Cloud Grey', colorHex: '#b0b0b0', stock: 8, additionalPrice: 0 },
        { sku: 'PJM-001-GRY-L', size: 'L', color: 'Cloud Grey', colorHex: '#b0b0b0', stock: 5, additionalPrice: 0 },
        { sku: 'PJM-001-IVY-S', size: 'S', color: 'Ivory',      colorHex: '#fffff0', stock: 7, additionalPrice: 0 },
        { sku: 'PJM-001-IVY-M', size: 'M', color: 'Ivory',      colorHex: '#fffff0', stock: 9, additionalPrice: 0 },
      ],
    },
    {
      name:             'Velvet Matte Lip Collection',
      sku:              'MKP-001',
      shortDescription: 'Long-wear matte lipstick in 8 curated shades',
      description:      'Best-selling matte lip formula in 8 carefully edited shades. Enriched with hyaluronic acid and vitamin E. Lasts up to 12 hours. Vegan and cruelty-free.',
      categorySlug:     'makeup',
      brand:            'Elara Beauty',
      price:            34.00,
      isFeatured:       false,
      isNewArrival:     true,
      tags:             ['makeup', 'lipstick', 'matte', 'vegan'],
      images: [
        { url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800', alt: 'Matte Lipstick', isPrimary: true, sortOrder: 0 },
      ],
      variants: [
        { sku: 'MKP-001-NUD', color: 'Nude Rose',   colorHex: '#c48b7a', stock: 40, additionalPrice: 0 },
        { sku: 'MKP-001-RED', color: 'Scarlet Red',  colorHex: '#dc143c', stock: 50, additionalPrice: 0 },
        { sku: 'MKP-001-BRY', color: 'Berry',        colorHex: '#8b1a4a', stock: 30, additionalPrice: 0 },
        { sku: 'MKP-001-CRL', color: 'Coral',        colorHex: '#ff7f50', stock: 25, additionalPrice: 0 },
      ],
    },
    {
      name:             'Retinol Resurfacing Night Serum',
      sku:              'SKN-001',
      shortDescription: '0.3% encapsulated retinol with hyaluronic acid',
      description:      'Gentle yet effective retinol serum for nightly use. Features 0.3% encapsulated retinol, 3 forms of hyaluronic acid and niacinamide. Reduces fine lines without irritation.',
      categorySlug:     'skincare',
      brand:            'Elara Skin',
      price:            68.00,
      compareAtPrice:   85.00,
      isFeatured:       false,
      isNewArrival:     false,
      tags:             ['skincare', 'retinol', 'serum', 'anti-aging'],
      images: [
        { url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800', alt: 'Retinol Serum', isPrimary: true, sortOrder: 0 },
      ],
      variants: [
        { sku: 'SKN-001-30ML', color: '30ml', stock: 45, additionalPrice: 0  },
        { sku: 'SKN-001-50ML', color: '50ml', stock: 30, additionalPrice: 20 },
      ],
    },
    {
      name:             'Italian Leather Bucket Bag',
      sku:              'BAG-001',
      shortDescription: 'Hand-stitched Italian full-grain leather bucket bag',
      description:      'Crafted in Florence by third-generation artisans. Full-grain vegetable-tanned leather. Spacious interior, inner zip pocket, adjustable shoulder strap, brass hardware.',
      categorySlug: 'bags-and-handbags',
      brand:            'Elara Leather',
      price:            345.00,
      isFeatured:       true,
      isNewArrival:     true,
      tags:             ['leather', 'bag', 'italian', 'luxury', 'handmade'],
      images: [
        { url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800', alt: 'Leather Bucket Bag', isPrimary: true, sortOrder: 0 },
      ],
      variants: [
        { sku: 'BAG-001-TAN', color: 'Cognac Tan',     colorHex: '#8B6914', stock: 12, additionalPrice: 0 },
        { sku: 'BAG-001-BLK', color: 'Midnight Black',  colorHex: '#1a1a1a', stock: 10, additionalPrice: 0 },
        { sku: 'BAG-001-CHY', color: 'Cherry',          colorHex: '#800020', stock: 8,  additionalPrice: 0 },
      ],
    },
    {
      name:             'Suede Block Heel Mules',
      sku:              'SHO-001',
      shortDescription: 'Italian suede mules with sculptural block heel',
      description:      'Cut from soft Italian suede with a 6cm sculptural block heel. Square open toe, slip-on style, leather-lined insole.',
      categorySlug:     'shoes',
      brand:            'Elara Footwear',
      price:            165.00,
      compareAtPrice:   210.00,
      isFeatured:       false,
      isNewArrival:     true,
      tags:             ['shoes', 'heels', 'mules', 'suede', 'italian'],
      images: [
        { url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800', alt: 'Suede Block Heel Mules', isPrimary: true, sortOrder: 0 },
      ],
      variants: [
        { sku: 'SHO-001-BEG-36', size: '36', color: 'Beige', colorHex: '#f5deb3', stock: 5,  additionalPrice: 0 },
        { sku: 'SHO-001-BEG-37', size: '37', color: 'Beige', colorHex: '#f5deb3', stock: 7,  additionalPrice: 0 },
        { sku: 'SHO-001-BEG-38', size: '38', color: 'Beige', colorHex: '#f5deb3', stock: 9,  additionalPrice: 0 },
        { sku: 'SHO-001-BLK-37', size: '37', color: 'Black', colorHex: '#1a1a1a', stock: 8,  additionalPrice: 0 },
        { sku: 'SHO-001-BLK-38', size: '38', color: 'Black', colorHex: '#1a1a1a', stock: 10, additionalPrice: 0 },
      ],
    },
    {
      name:             'Pearl Strand Layering Necklace Set',
      sku:              'ACC-001',
      shortDescription: 'Set of 3 freshwater pearl necklaces for layering',
      description:      'Three graduated freshwater pearl necklaces designed for effortless layering. Sterling silver chains, hypoallergenic clasps. Choker (38cm), mid-length (45cm), long strand (60cm).',
      categorySlug:     'accessories',
      brand:            'Elara Jewels',
      price:            95.00,
      compareAtPrice:   125.00,
      isFeatured:       false,
      isNewArrival:     false,
      tags:             ['jewelry', 'pearls', 'necklace', 'layering', 'gift'],
      images: [
        { url: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800', alt: 'Pearl Necklace Set', isPrimary: true, sortOrder: 0 },
      ],
      variants: [
        { sku: 'ACC-001-ONE', stock: 35, additionalPrice: 0 },
      ],
    },
  ]

  for (const p of products) {
    const { categorySlug, variants, images, ...rest } = p
    const categoryId = categories[categorySlug]
    if (!categoryId) {
      console.warn(`⚠️  Category not found: ${categorySlug}`)
      continue
    }
    const slug = slugify(p.name, { lower: true, strict: true })
    await prisma.product.create({
      data: {
        ...rest,
        slug,
        categoryId,
        images:   { create: images },
        variants: { create: variants },
      },
    })
  }

  console.log(`✅ ${products.length} products created`)

  await prisma.$disconnect()

  console.log('\n🎉 Seed complete!\n')
  console.log('Login credentials:')
  console.log('  Admin:    admin@elara.com    / Admin@1234')
  console.log('  Customer: jane@example.com   / Customer@1234\n')
}

seed().catch(async (err) => {
  console.error('❌ Seed failed:', err)
  await prisma.$disconnect()
  process.exit(1)
})