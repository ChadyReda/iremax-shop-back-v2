import jwt from 'jsonwebtoken'
import { config } from '../config'
import { JwtPayload } from '../types'

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpires,
  } as jwt.SignOptions)
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpires,
  } as jwt.SignOptions)
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.accessSecret) as JwtPayload
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload
}

export function makeTokenPair(payload: JwtPayload) {
  return {
    accessToken:  signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  }
}