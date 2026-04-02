import { Response } from 'express'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { AuthRequest } from '../types'
import { AppError, notFound } from '../utils/AppError'
import { parsePage, paginate } from '../utils/pagination'

export async function getDashboardStats(
  _req: AuthRequest,
  res:  Response
): Promise<void> {
  const now           = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000)

  const [
    totalUsers,
    totalProducts,
    totalOrders,
    revenueResult,
    monthlyRevenueResult,
    weeklyOrders,
    recentOrders,
    topProducts,
    ordersByStatus,
    lowStockProducts,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER', isActive: true } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.order.aggregate({
      where:   { paymentStatus: 'PAID' },
      _sum:    { total: true },
    }),
    prisma.order.aggregate({
      where:   { paymentStatus: 'PAID', createdAt: { gte: thirtyDaysAgo } },
      _sum:    { total: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take:    5,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        shippingAddress: true,
        items: true,
      },
    }),
    prisma.product.findMany({
      where:   { isActive: true },
      orderBy: { totalSold: 'desc' },
      take:    5,
      include: { images: true },
    }),
    prisma.order.groupBy({
      by:    ['status'],
      _count: { status: true },
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        variants: { some: { stock: { lte: 5 } } },
      },
      include: { variants: true, images: true },
      take:    10,
    }),
  ])

  res.json({
    success: true,
    data: {
      overview: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue:   Number(revenueResult._sum.total       || 0),
        monthlyRevenue: Number(monthlyRevenueResult._sum.total || 0),
        weeklyOrders,
      },
      recentOrders,
      topProducts,
      ordersByStatus: ordersByStatus.reduce(
        (acc, { status, _count }) => {
          acc[status] = _count.status
          return acc
        },
        {} as Record<string, number>
      ),
      lowStockProducts,
    },
  })
}

export async function listUsers(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const { page, limit, skip } = parsePage(req.query as any)
  const search = (req.query.search as string) || ''

  const where: any = {}
  if (search) {
    where.OR = [
      { email:     { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName:  { contains: search, mode: 'insensitive' } },
    ]
  }

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take:    limit,
    }),
    prisma.user.count({ where }),
  ])

  res.json({ success: true, ...paginate(users, total, page, limit) })
}

export async function updateUserRole(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const { role } = z.object({
    role: z.enum(['CUSTOMER', 'ADMIN']),
  }).parse(req.body)

  if (req.params.id === req.user!.userId) {
    throw new AppError('Cannot change your own role', 400)
  }

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data:  { role },
  })
  if (!user) throw notFound('User')
  res.json({ success: true, data: user })
}

export async function updateUserStatus(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const { isActive } = z.object({
    isActive: z.boolean(),
  }).parse(req.body)

  if (req.params.id === req.user!.userId) {
    throw new AppError('Cannot deactivate your own account', 400)
  }

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data:  { isActive },
  })
  if (!user) throw notFound('User')
  res.json({ success: true, data: user })
}