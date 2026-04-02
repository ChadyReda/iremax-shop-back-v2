import { Request, Response } from 'express'
import { z } from 'zod'
import * as authService from '../services/auth.service'
import { AuthRequest } from '../types'
import { config } from '../config'

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   config.isProd,
  sameSite: 'lax' as const,
  maxAge:   7 * 24 * 60 * 60 * 1000,
}

const registerSchema = z.object({
  email:     z.string().email('Invalid email'),
  password:  z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1).max(50),
  lastName:  z.string().min(1).max(50),
})

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

export async function register(
  req: Request,
  res: Response
): Promise<void> {
  const body           = registerSchema.parse(req.body)
  const { user, tokens } = await authService.register(body)
  res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTS)
  res.status(201).json({
    success: true,
    data: {
      user,
      accessToken: tokens.accessToken,
    },
  })
}

export async function login(
  req: Request,
  res: Response
): Promise<void> {
  const body           = loginSchema.parse(req.body)
  const { user, tokens } = await authService.login(body)
  res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTS)
  res.json({
    success: true,
    data: {
      user,
      accessToken: tokens.accessToken,
    },
  })
}

export async function logout(
  _req: Request,
  res:  Response
): Promise<void> {
  res.clearCookie('refreshToken')
  res.json({ success: true, message: 'Logged out successfully' })
}

export async function refresh(
  req: Request,
  res: Response
): Promise<void> {
  const token = req.cookies?.refreshToken
  if (!token) {
    res.status(401).json({
      success: false,
      message: 'No refresh token provided',
    })
    return
  }
  const tokens = await authService.refreshTokens(token)
  res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTS)
  res.json({
    success: true,
    data: { accessToken: tokens.accessToken },
  })
}

export async function me(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const user = await authService.getMe(req.user!.userId)
  res.json({ success: true, data: { user } })
}