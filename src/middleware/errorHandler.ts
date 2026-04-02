import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../utils/AppError'
import { config } from '../config'

export function errorHandler(
  err:  unknown,
  _req: Request,
  res:  Response,
  _next: NextFunction
): void {
  // Zod validation errors
if (err instanceof ZodError) {
  res.status(422).json({
    success: false,
    message: 'Validation failed',
    errors:  (err.issues || err.errors || []).map((e: any) => ({
      field:   e.path?.join('.') || '',
      message: e.message,
    })),
  })
  return
}

  // Known application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    })
    return
  }

  // Prisma unique constraint violation
  const prismaErr = err as any
  if (prismaErr?.code === 'P2002') {
    const field = prismaErr.meta?.target?.[0] || 'field'
    res.status(409).json({
      success: false,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
    })
    return
  }

  // Prisma record not found
  if (prismaErr?.code === 'P2025') {
    res.status(404).json({
      success: false,
      message: 'Record not found',
    })
    return
  }

  // Unexpected errors
  console.error('[Unhandled Error]', err)
  res.status(500).json({
    success:  false,
    message:  config.isDev
      ? (err instanceof Error ? err.message : 'Internal server error')
      : 'Internal server error',
  })
}