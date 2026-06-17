import { UserRole } from '@prisma/client'
import { Request } from 'express'

// ─── User ────────────────────────────────────────────────────────────────────

export interface UserPayload {
  id: string
  email: string
  username: string
  role: UserRole
  isEmailVerified: boolean
}

export interface SafeUser {
  id: string
  email: string
  username: string
  role: UserRole
  displayName: string | null
  avatarUrl: string | null
  bio: string | null
  isEmailVerified: boolean
  isActive: boolean
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface JwtPayload {
  sub: string
  email: string
  username: string
  role: UserRole
  iat?: number
  exp?: number
}

// ─── Request ─────────────────────────────────────────────────────────────────

export interface AuthenticatedRequest extends Request {
  user: UserPayload
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
  errors?: Record<string, string[]>
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}
