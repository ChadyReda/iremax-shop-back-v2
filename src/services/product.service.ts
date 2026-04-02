import slugify from 'slugify'
import { prisma } from '../utils/prisma'
import { AppError, notFound } from '../utils/AppError'
import { parsePage, paginate } from '../utils/pagination'
import { ProductQuery } from '../types'

export async function listProducts(query: ProductQuery) {
  const { page, limit, skip } = parsePage(query)

  const where: any = { isActive: true }

  if (query.category) {
    const cat = await prisma.category.findUnique({
      where: { slug: query.category },
    })
    if (!cat) return paginate([], 0, page, limit)
    where.categoryId = cat.id
  }

  if (query.search) {
    where.OR = [
      { name:             { contains: query.search, mode: 'insensitive' } },
      { description:      { contains: query.search, mode: 'insensitive' } },
      { shortDescription: { contains: query.search, mode: 'insensitive' } },
    ]
  }

  if (query.minPrice || query.maxPrice) {
    where.price = {}
    if (query.minPrice) where.price.gte = parseFloat(query.minPrice)
    if (query.maxPrice) where.price.lte = parseFloat(query.maxPrice)
  }

  if (query.sizes) {
    const sizes = query.sizes.split(',').map((s) => s.trim())
    where.variants = { some: { size: { in: sizes } } }
  }

  if (query.colors) {
    const colors = query.colors.split(',').map((c) => c.trim())
    where.variants = { some: { color: { in: colors } } }
  }

  if (query.featured   === 'true') where.isFeatured   = true
  if (query.newArrival === 'true') where.isNewArrival = true

  let orderBy: any = { createdAt: 'desc' }
  switch (query.sort) {
    case 'price_asc':  orderBy = { price: 'asc' };         break
    case 'price_desc': orderBy = { price: 'desc' };        break
    case 'popular':    orderBy = { totalSold: 'desc' };    break
    case 'rating':     orderBy = { averageRating: 'desc' }; break
    case 'oldest':     orderBy = { createdAt: 'asc' };     break
  }

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images:   true,
        variants: true,
      },
    }),
    prisma.product.count({ where }),
  ])

  return paginate(products, total, page, limit)
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where:   { slug, isActive: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images:   true,
      variants: true,
    },
  })
  if (!product) throw notFound('Product')
  return product
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where:   { id },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images:   true,
      variants: true,
    },
  })
  if (!product) throw notFound('Product')
  return product
}

export async function getFeaturedProducts(limit = 8) {
  return prisma.product.findMany({
    where:   { isFeatured: true, isActive: true },
    orderBy: { totalSold: 'desc' },
    take:    limit,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images:   true,
      variants: true,
    },
  })
}

export async function getNewArrivals(limit = 8) {
  return prisma.product.findMany({
    where:   { isNewArrival: true, isActive: true },
    orderBy: { createdAt: 'desc' },
    take:    limit,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images:   true,
      variants: true,
    },
  })
}

export async function getRelatedProducts(
  productId:  string,
  categoryId: string,
  limit = 4
) {
  return prisma.product.findMany({
    where: {
      id:         { not: productId },
      categoryId,
      isActive:   true,
    },
    take:    limit,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images:   true,
      variants: true,
    },
  })
}

export async function createProduct(data: any) {
  const slug = slugify(data.name, { lower: true, strict: true })
  const sku  = data.sku || `SKU-${Date.now()}`

  const { variants, images, tags, ...rest } = data

  return prisma.product.create({
    data: {
      ...rest,
      slug,
      sku,
      tags: tags || [],
      images: {
        create: images || [],
      },
      variants: {
        create: variants || [],
      },
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images:   true,
      variants: true,
    },
  })
}

export async function updateProduct(id: string, data: any) {
  const { variants, images, tags, ...rest } = data

  if (rest.name) {
    rest.slug = slugify(rest.name, { lower: true, strict: true })
  }

  return prisma.product.update({
    where: { id },
    data: {
      ...rest,
      ...(tags     && { tags }),
      ...(images   && {
        images: {
          deleteMany: {},
          create: images,
        },
      }),
      ...(variants && {
        variants: {
          deleteMany: {},
          create: variants,
        },
      }),
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images:   true,
      variants: true,
    },
  })
}

export async function softDeleteProduct(id: string) {
  return prisma.product.update({
    where: { id },
    data:  { isActive: false },
  })
}