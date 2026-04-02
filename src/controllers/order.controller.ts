import { Response } from 'express'
import { z } from 'zod'
import * as orderService from '../services/order.service'
import { AuthRequest, OrderStatus } from '../types'

const addressSchema = z.object({
  firstName: z.string().min(1),
  lastName:  z.string().min(1),
  phone:     z.string().optional(),
  street:    z.string().min(1),
  apartment: z.string().optional(),
  city:      z.string().min(1),
  state:     z.string().min(1),
  zip:       z.string().min(1),
  country:   z.string().min(2).default('US'),
})

const createOrderSchema = z.object({
  guestEmail: z.string().email().optional(),
  items: z.array(
    z.object({
      productId:  z.string().min(1),
      variantSku: z.string().min(1),
      quantity:   z.number().int().min(1),
    })
  ).min(1, 'Order must have at least one item'),
  shippingAddress: addressSchema,
  paymentMethod:   z.string().default('card'),
  couponCode:      z.string().optional(),
  notes:           z.string().optional(),
})

export async function create(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const body  = createOrderSchema.parse(req.body)
  const order = await orderService.createOrder({
    ...body,
    userId: req.user?.userId,
  })
  res.status(201).json({ success: true, data: order })
}

export async function myOrders(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const result = await orderService.getUserOrders(
    req.user!.userId,
    req.query as any
  )
  res.json({ success: true, ...result })
}

export async function getOne(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const order = await orderService.getOrderById(
    req.params.id,
    req.user?.userId
  )
  res.json({ success: true, data: order })
}

export async function adminList(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const result = await orderService.adminListOrders(req.query as any)
  res.json({ success: true, ...result })
}

export async function updateStatus(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const { status } = z.object({
    status: z.enum([
      'PENDING',
      'CONFIRMED',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
    ]),
  }).parse(req.body)

  const order = await orderService.updateOrderStatus(
    req.params.id,
    status as OrderStatus
  )
  res.json({ success: true, data: order })
}