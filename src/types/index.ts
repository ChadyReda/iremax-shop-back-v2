import { Request } from 'express'

export type UserRole = 'CUSTOMER' | 'ADMIN'

export interface JwtPayload {
  userId: string
  role:   UserRole
  iat?:   number
  exp?:   number
}

export interface AuthRequest extends Request {
  user?: JwtPayload
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'

export type PayStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'

export interface ProductQuery {
  page?:       string
  limit?:      string
  category?:   string
  search?:     string
  minPrice?:   string
  maxPrice?:   string
  sizes?:      string
  colors?:     string
  sort?:       string
  featured?:   string
  newArrival?: string
}