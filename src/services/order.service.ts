import { prisma } from '../utils/prisma'
import { AppError, notFound } from '../utils/AppError'
import { parsePage, paginate } from '../utils/pagination'
import { generateOrderNumber } from '../utils/orderNumber'
import { OrderStatus } from '../types'

const FREE_SHIPPING_AT = 100
const SHIPPING_COST    = 9.99
const TAX_RATE         = 0.08

const ORDER_INCLUDE = {
  items:           true,
  shippingAddress: true,
  user: {
    select: {
      id:        true,
      firstName: true,
      lastName:  true,
      email:     true,
    },
  },
}

export async function createOrder(input: {
  userId?:         string
  guestEmail?:     string
  items: {
    productId:  string
    variantSku: string
    quantity:   number
  }[]
  shippingAddress: {
    firstName:  string
    lastName:   string
    phone?:     string
    street:     string
    apartment?: string
    city:       string
    state:      string
    zip:        string
    country:    string
  }
  paymentMethod?: string
  couponCode?:    string
  notes?:         string
}) {
  if (!input.userId && !input.guestEmail) {
    throw new AppError('Guest email is required for guest checkout', 400)
  }

  // Validate items and build order items
  const orderItems = await Promise.all(
    input.items.map(async ({ productId, variantSku, quantity }) => {
      const product = await prisma.product.findUnique({
        where:   { id: productId },
        include: { images: true, variants: true },
      })

      if (!product || !product.isActive) {
        throw new AppError(`Product not available: ${productId}`, 400)
      }

      const variant = product.variants.find((v) => v.sku === variantSku)
      if (!variant) throw new AppError(`Variant ${variantSku} not found`, 400)
      if (variant.stock < quantity) {
        throw new AppError(
          `Only ${variant.stock} units of "${product.name}" in stock`,
          400
        )
      }

      const primaryImage =
        product.images.find((i) => i.isPrimary)?.url ||
        product.images[0]?.url ||
        ''

      const variantParts = [variant.size, variant.color].filter(Boolean)

      return {
        productId,
        name:         product.name,
        image:        primaryImage,
        price:        Number(product.price) + Number(variant.additionalPrice),
        quantity,
        variantSku,
        variantLabel: variantParts.join(' / ') || variantSku,
        _variantId:   variant.id,
      }
    })
  )

  // Calculate totals
  const subtotal    = +orderItems.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)
  const shippingCost = subtotal >= FREE_SHIPPING_AT ? 0 : SHIPPING_COST
  const tax         = +(subtotal * TAX_RATE).toFixed(2)
  const total       = +(subtotal + shippingCost + tax).toFixed(2)

  // Create order in transaction
  const order = await prisma.$transaction(async (tx) => {
    // Deduct stock
    await Promise.all(
      orderItems.map(({ _variantId, quantity }) =>
        tx.productVariant.update({
          where: { id: _variantId },
          data:  { stock: { decrement: quantity } },
        })
      )
    )

    // Update totalSold
    await Promise.all(
      input.items.map(({ productId, quantity }) =>
        tx.product.update({
          where: { id: productId },
          data:  { totalSold: { increment: quantity } },
        })
      )
    )

    // Create order
    const newOrder = await tx.order.create({
      data: {
        orderNumber:  generateOrderNumber(),
        userId:       input.userId || null,
        guestEmail:   input.guestEmail,
        subtotal,
        shippingCost,
        tax,
        discount:     0,
        total,
        paymentMethod: input.paymentMethod || 'card',
        paymentStatus: 'PAID',
        status:        'PENDING',
        couponCode:    input.couponCode,
        notes:         input.notes,
        shippingAddress: {
          create: input.shippingAddress,
        },
        items: {
          create: orderItems.map(({ _variantId: _, ...item }) => item),
        },
      },
      include: ORDER_INCLUDE,
    })

    // Clear cart
    if (input.userId) {
      const cart = await tx.cart.findUnique({
        where: { userId: input.userId },
      })
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } })
      }
    }

    return newOrder
  })

  return order
}

export async function getUserOrders(
  userId: string,
  query:  { page?: string; limit?: string }
) {
  const { page, limit, skip } = parsePage(query)

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take:    limit,
      include: ORDER_INCLUDE,
    }),
    prisma.order.count({ where: { userId } }),
  ])

  return paginate(orders, total, page, limit)
}

export async function getOrderById(id: string, userId?: string) {
  const order = await prisma.order.findUnique({
    where:   { id },
    include: ORDER_INCLUDE,
  })

  if (!order) throw notFound('Order')

  if (userId && order.userId !== userId) {
    throw new AppError('Forbidden', 403)
  }

  return order
}

export async function adminListOrders(query: {
  page?:   string
  limit?:  string
  status?: string
  search?: string
}) {
  const { page, limit, skip } = parsePage(query)

  const where: any = {}
  if (query.status) where.status = query.status
  if (query.search) {
    where.OR = [
      { orderNumber: { contains: query.search, mode: 'insensitive' } },
      { guestEmail:  { contains: query.search, mode: 'insensitive' } },
    ]
  }

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take:    limit,
      include: ORDER_INCLUDE,
    }),
    prisma.order.count({ where }),
  ])

  return paginate(orders, total, page, limit)
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  return prisma.order.update({
    where:   { id },
    data:    { status },
    include: ORDER_INCLUDE,
  })
}