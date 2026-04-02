import { Request, Response } from 'express'
import { z } from 'zod'
import * as productService from '../services/product.service'
import { AuthRequest, ProductQuery } from '../types'
import path from 'path'
import { AppError } from '../utils/AppError'

const variantSchema = z.object({
  sku:            z.string().min(1),
  size:           z.string().optional(),
  color:          z.string().optional(),
  colorHex:       z.string().optional(),
  stock:          z.number().int().min(0),
  additionalPrice: z.number().min(0).default(0),
})

const productSchema = z.object({
  name:             z.string().min(2).max(200),
  sku:              z.string().optional(),
  description:      z.string().min(10),
  shortDescription: z.string().min(5).max(500),
  categoryId:       z.string().min(1, 'Category is required'),
  brand:            z.string().optional(),
  price:            z.number().positive(),
  compareAtPrice:   z.number().positive().optional(),
  variants:         z.array(variantSchema).min(1),
  images:           z.array(z.object({
    url:       z.string(),
    alt:       z.string().default(''),
    isPrimary: z.boolean().default(false),
    sortOrder: z.number().default(0),
  })).default([]),
  tags:             z.array(z.string()).default([]),
  isFeatured:       z.boolean().default(false),
  isNewArrival:     z.boolean().default(true),
  isActive:         z.boolean().default(true),
})

export async function list(
  req: Request,
  res: Response
): Promise<void> {
  const result = await productService.listProducts(req.query as ProductQuery)
  res.json({ success: true, ...result })
}

export async function getOne(
  req: Request,
  res: Response
): Promise<void> {
  const product = await productService.getProductBySlug(req.params.slug)
  res.json({ success: true, data: product })
}

export async function getById(
  req: Request,
  res: Response
): Promise<void> {
  const product = await productService.getProductById(req.params.id)
  res.json({ success: true, data: product })
}

export async function getFeatured(
  req: Request,
  res: Response
): Promise<void> {
  const limit    = parseInt((req.query.limit as string) || '8')
  const products = await productService.getFeaturedProducts(limit)
  res.json({ success: true, data: products })
}

export async function getNewArrivals(
  req: Request,
  res: Response
): Promise<void> {
  const limit    = parseInt((req.query.limit as string) || '8')
  const products = await productService.getNewArrivals(limit)
  res.json({ success: true, data: products })
}

export async function getRelated(
  req: Request,
  res: Response
): Promise<void> {
  const product = await productService.getProductById(req.params.id)
  const related = await productService.getRelatedProducts(
    product.id,
    product.categoryId,
    4
  )
  res.json({ success: true, data: related })
}

export async function create(
  req: AuthRequest,
  res: Response
): Promise<void> {
  console.log('CREATE PRODUCT BODY:', JSON.stringify(req.body, null, 2))
  const body    = productSchema.parse(req.body)
  const product = await productService.createProduct(body)
  res.status(201).json({ success: true, data: product })
}

export async function update(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const body    = productSchema.partial().parse(req.body)
  const product = await productService.updateProduct(req.params.id, body)
  res.json({ success: true, data: product })
}

export async function remove(
  req: AuthRequest,
  res: Response
): Promise<void> {
  await productService.softDeleteProduct(req.params.id)
  res.json({ success: true, message: 'Product deactivated' })
}

export async function uploadImages(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const files = req.files as Express.Multer.File[]
  if (!files?.length) {
    res.status(400).json({ success: false, message: 'No files provided' })
    return
  }

  const { supabase } = await import('../utils/supabase')
  const urls: string[] = []

  for (const file of files) {
    // Force clean extension based on mimetype
    const extMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg':  '.jpg',
      'image/png':  '.png',
      'image/webp': '.webp',
    }
    const ext      = extMap[file.mimetype] || '.jpg'
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
    const filePath = `products/${filename}`

    const { error } = await supabase.storage
      .from('images')
      .upload(filePath, file.buffer, {
        contentType: 'image/jpeg',
        upsert:      false,
      })

    if (error) {
      console.error('Supabase upload error:', error)
      throw new AppError(`Failed to upload image: ${error.message}`, 500)
    }

    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)

    urls.push(data.publicUrl)
  }

  res.json({ success: true, data: { urls } })
}