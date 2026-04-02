import { Response, NextFunction } from 'express'
import { AuthRequest, UserRole } from '../types'
import { verifyAccessToken } from '../utils/jwt'
import { AppError } from '../utils/AppError'

export function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401)
  }
  try {
    req.user = verifyAccessToken(header.slice(7))
    next()
  } catch {
    throw new AppError('Invalid or expired token', 401)
  }
}

export function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = verifyAccessToken(header.slice(7))
    } catch {
      // silently ignore
    }
  }
  next()
}

export function requireRole(...roles: UserRole[]) {
  return (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) throw new AppError('Authentication required', 401)
    if (!roles.includes(req.user.role)) {
      throw new AppError('Insufficient permissions', 403)
    }
    next()
  }
}

export const requireAdmin = requireRole('ADMIN')