import { Request, Response } from 'express'
import { z } from 'zod'
import slugify from 'slugify'
import { prisma } from '../utils/prisma'
import { notFound } from '../utils/AppError'

const categorySchema = z.object({
  name:        z.string().min(1).max(100),
  parentId:    z.string().nullable().optional(),
  description: z.string().optional(),
  imageUrl:    z.string().optional(),
  isActive:    z.boolean().default(true),
  sortOrder:   z.number().int().default(0),
})

export async function list(
  _req: Request,
  res:  Response
): Promise<void> {
  const categories = await prisma.category.findMany({
    where:   { isActive: true },
    include: { parent: { select: { id: true, name: true, slug: true } } },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })
  res.json({ success: true, data: categories })
}

export async function listAll(
  _req: Request,
  res:  Response
): Promise<void> {
  const categories = await prisma.category.findMany({
    include: { parent: { select: { id: true, name: true, slug: true } } },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })
  res.json({ success: true, data: categories })
}

export async function getBySlug(
  req: Request,
  res: Response
): Promise<void> {
  const cat = await prisma.category.findFirst({
    where:   { slug: req.params.slug, isActive: true },
    include: { parent: { select: { id: true, name: true, slug: true } } },
  })
  if (!cat) throw notFound('Category')
  res.json({ success: true, data: cat })
}

export async function create(
  req: Request,
  res: Response
): Promise<void> {
  const body = categorySchema.parse(req.body)
  const slug = slugify(body.name, { lower: true, strict: true })
  const cat  = await prisma.category.create({
    data: { ...body, slug },
  })
  res.status(201).json({ success: true, data: cat })
}

export async function update(
  req: Request,
  res: Response
): Promise<void> {
  const body: any = categorySchema.partial().parse(req.body)
  if (body.name) {
    body.slug = slugify(body.name, { lower: true, strict: true })
  }
  const cat = await prisma.category.update({
    where: { id: req.params.id },
    data:  body,
  })
  if (!cat) throw notFound('Category')
  res.json({ success: true, data: cat })
}

export async function remove(
  req: Request,
  res: Response
): Promise<void> {
  await prisma.category.update({
    where: { id: req.params.id },
    data:  { isActive: false },
  })
  res.json({ success: true, message: 'Category deactivated' })
}