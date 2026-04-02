import bcrypt from 'bcryptjs'
import { prisma } from '../utils/prisma'
import { AppError } from '../utils/AppError'
import { makeTokenPair, verifyRefreshToken } from '../utils/jwt'
import { JwtPayload } from '../types'

export async function register(input: {
  email:     string
  password:  string
  firstName: string
  lastName:  string
}) {
  const exists = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  })
  if (exists) throw new AppError('Email already registered', 409)

  const passwordHash = await bcrypt.hash(input.password, 12)

  const user = await prisma.user.create({
    data: {
      email:        input.email.toLowerCase(),
      passwordHash,
      firstName:    input.firstName,
      lastName:     input.lastName,
    },
  })

  const payload: JwtPayload = { userId: user.id, role: user.role }
  return { user, tokens: makeTokenPair(payload) }
}

export async function login(input: {
  email:    string
  password: string
}) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  })
  if (!user) throw new AppError('Invalid email or password', 401)
  if (!user.isActive) throw new AppError('Account suspended', 403)

  const valid = await bcrypt.compare(input.password, user.passwordHash)
  if (!valid) throw new AppError('Invalid email or password', 401)

  const payload: JwtPayload = { userId: user.id, role: user.role }
  return { user, tokens: makeTokenPair(payload) }
}

export async function refreshTokens(token: string) {
  let payload: JwtPayload
  try {
    payload = verifyRefreshToken(token)
  } catch {
    throw new AppError('Invalid refresh token', 401)
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  })
  if (!user || !user.isActive) {
    throw new AppError('User not found', 401)
  }

  return makeTokenPair({ userId: user.id, role: user.role })
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    include: { addresses: true },
  })
  if (!user) throw new AppError('User not found', 404)
  return user
}