import { Response } from 'express'
import { z } from 'zod'
import * as cartService from '../services/cart.service'
import { AuthRequest } from '../types'

const addItemSchema = z.object({
  productId:  z.string().min(1),
  variantSku: z.string().min(1),
  quantity:   z.coerce.number().int().min(1).default(1),
})

const updateSchema = z.object({
  quantity: z.coerce.number().int().min(1),
})

export async function getCart(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const cart = await cartService.getCart(req.user!.userId)
  res.json({ success: true, data: cart })
}

export async function addItem(
  req: AuthRequest,
  res: Response
): Promise<void> {
  console.log('ADD TO CART BODY:', req.body)
  const { productId, variantSku, quantity } = addItemSchema.parse(req.body)
  const cart = await cartService.addItem(
    req.user!.userId,
    productId,
    variantSku,
    quantity
  )
  res.json({ success: true, data: cart })
}

export async function updateItem(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const { quantity } = updateSchema.parse(req.body)
  const cart = await cartService.updateItem(
    req.user!.userId,
    req.params.sku,
    quantity
  )
  res.json({ success: true, data: cart })
}

export async function removeItem(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const cart = await cartService.removeItem(
    req.user!.userId,
    req.params.sku
  )
  res.json({ success: true, data: cart })
}

export async function clearCart(
  req: AuthRequest,
  res: Response
): Promise<void> {
  await cartService.clearCart(req.user!.userId)
  res.json({ success: true, message: 'Cart cleared' })
}