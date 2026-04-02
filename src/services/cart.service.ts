import { prisma } from '../utils/prisma'
import { AppError } from '../utils/AppError'

const INCLUDE = {
  items: {
    include: {
      product: {
        include: {
          images:   true,
          variants: true,
          category: { select: { id: true, name: true, slug: true } },
        },
      },
      variant: true,
    },
  },
}

export async function getCart(userId: string) {
  let cart = await prisma.cart.findUnique({
    where:   { userId },
    include: INCLUDE,
  })

  if (!cart) {
    cart = await prisma.cart.create({
      data:    { userId },
      include: INCLUDE,
    })
  }

  return cart
}

export async function addItem(
  userId:     string,
  productId:  string,
  variantSku: string,
  quantity:   number
) {
  const product = await prisma.product.findUnique({
    where:   { id: productId },
    include: { variants: true },
  })
  if (!product || !product.isActive) {
    throw new AppError('Product not available', 400)
  }

  const variant = product.variants.find((v) => v.sku === variantSku)
  if (!variant) throw new AppError('Variant not found', 400)
  if (variant.stock < quantity) throw new AppError('Insufficient stock', 400)

  let cart = await prisma.cart.findUnique({ where: { userId } })
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } })
  }

  const existingItem = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId, variantSku },
  })

  if (existingItem) {
    const newQty = existingItem.quantity + quantity
    if (newQty > variant.stock) throw new AppError('Insufficient stock', 400)
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data:  { quantity: newQty },
    })
  } else {
    await prisma.cartItem.create({
      data: {
        cartId:     cart.id,
        productId,
        variantSku,
        variantId:  variant.id,
        quantity,
      },
    })
  }

  return prisma.cart.findUnique({
    where:   { userId },
    include: INCLUDE,
  })
}

export async function updateItem(
  userId:     string,
  variantSku: string,
  quantity:   number
) {
  const cart = await prisma.cart.findUnique({ where: { userId } })
  if (!cart) throw new AppError('Cart not found', 404)

  const item = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, variantSku },
  })
  if (!item) throw new AppError('Item not in cart', 404)

  const variant = await prisma.productVariant.findUnique({
    where: { sku: variantSku },
  })
  if (variant && variant.stock < quantity) {
    throw new AppError('Insufficient stock', 400)
  }

  await prisma.cartItem.update({
    where: { id: item.id },
    data:  { quantity },
  })

  return prisma.cart.findUnique({
    where:   { userId },
    include: INCLUDE,
  })
}

export async function removeItem(userId: string, variantSku: string) {
  const cart = await prisma.cart.findUnique({ where: { userId } })
  if (!cart) throw new AppError('Cart not found', 404)

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id, variantSku },
  })

  return prisma.cart.findUnique({
    where:   { userId },
    include: INCLUDE,
  })
}

export async function clearCart(userId: string) {
  const cart = await prisma.cart.findUnique({ where: { userId } })
  if (!cart) return

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  })
}