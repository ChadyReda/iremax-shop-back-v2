import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { prisma } from '../utils/prisma'
import { AppError } from '../utils/AppError'
import { z } from 'zod'

const r: Router = Router()

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title:  z.string().min(1).max(100),
  body:   z.string().min(10).max(1000),
})

// Get reviews for a product
r.get('/products/:productId/reviews', async (req, res) => {
  const reviews = await prisma.review.findMany({
    where:   { productId: req.params.productId, isApproved: true },
    include: { user: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ success: true, data: reviews })
})

// Create a review (only buyers)
r.post('/products/:productId/reviews', authenticate, async (req: any, res) => {
  const userId    = req.user.userId
  const productId = req.params.productId

  // Check if user has ordered this product
  const order = await prisma.order.findFirst({
    where: {
      userId,
      status: { in: ['DELIVERED', 'CONFIRMED', 'SHIPPED'] },
      items:  { some: { productId } },
    },
  })

  if (!order) {
    throw new AppError('You can only review products you have purchased', 403)
  }

  // Check if already reviewed
  const existing = await prisma.review.findFirst({
    where: { userId, productId },
  })

  if (existing) {
    throw new AppError('You have already reviewed this product', 409)
  }

  const body   = reviewSchema.parse(req.body)
  const review = await prisma.review.create({
    data: {
      ...body,
      userId,
      productId,
      isVerifiedPurchase: true,
    },
    include: { user: { select: { firstName: true, lastName: true } } },
  })

  // Update product average rating
  const stats = await prisma.review.aggregate({
    where:  { productId, isApproved: true },
    _avg:   { rating: true },
    _count: { rating: true },
  })

  await prisma.product.update({
    where: { id: productId },
    data: {
      averageRating: stats._avg.rating || 0,
      reviewCount:   stats._count.rating,
    },
  })

  res.status(201).json({ success: true, data: review })
})

export default r