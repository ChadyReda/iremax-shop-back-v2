import { Response } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '../utils/prisma'
import { AuthRequest } from '../types'
import { notFound, AppError } from '../utils/AppError'

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName:  z.string().min(1).max(50).optional(),
  phone:     z.string().optional(),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8, 'New password must be at least 8 characters'),
})

const addressSchema = z.object({
  label:     z.string().default('Home'),
  firstName: z.string().min(1),
  lastName:  z.string().min(1),
  phone:     z.string().optional(),
  street:    z.string().min(1),
  apartment: z.string().optional(),
  city:      z.string().min(1),
  state:     z.string().min(1),
  zip:       z.string().min(1),
  country:   z.string().min(2).default('US'),
  isDefault: z.boolean().default(false),
})

export async function getProfile(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const user = await prisma.user.findUnique({
    where:   { id: req.user!.userId },
    include: { addresses: true },
  })
  if (!user) throw notFound('User')
  res.json({ success: true, data: user })
}

export async function updateProfile(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const body = updateProfileSchema.parse(req.body)
  const user = await prisma.user.update({
    where:   { id: req.user!.userId },
    data:    body,
    include: { addresses: true },
  })
  res.json({ success: true, data: user })
}

export async function changePassword(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body)

  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
  })
  if (!user) throw notFound('User')

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) throw new AppError('Current password is incorrect', 400)

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { id: req.user!.userId },
    data:  { passwordHash },
  })

  res.json({ success: true, message: 'Password updated' })
}

export async function addAddress(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const body = addressSchema.parse(req.body)

  if (body.isDefault) {
    await prisma.address.updateMany({
      where: { userId: req.user!.userId },
      data:  { isDefault: false },
    })
  }

  await prisma.address.create({
    data: { ...body, userId: req.user!.userId },
  })

  const addresses = await prisma.address.findMany({
    where: { userId: req.user!.userId },
  })
  res.status(201).json({ success: true, data: addresses })
}

export async function removeAddress(
  req: AuthRequest,
  res: Response
): Promise<void> {
  await prisma.address.delete({
    where: { id: req.params.addressId as string },
  })

  const addresses = await prisma.address.findMany({
    where: { userId: req.user!.userId },
  })
  res.json({ success: true, data: addresses })
}