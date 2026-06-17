import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { JwtPayload, TokenPair, UserPayload } from '../types'

export const generateAccessToken = (user: UserPayload): string => {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    } as JwtPayload,
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  )
}

export const generateRefreshToken = (userId: string, family: string): string => {
  return jwt.sign(
    { sub: userId, family },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions
  )
}

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload
}

export const verifyRefreshToken = (token: string): { sub: string; family: string } => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string; family: string }
}

export const generateTokenPair = (user: UserPayload, family: string): TokenPair => {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user.id, family),
  }
}

export const getRefreshTokenExpiry = (): Date => {
  const days = parseInt(env.JWT_REFRESH_EXPIRES_IN.replace('d', ''))
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}
