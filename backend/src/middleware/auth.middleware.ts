import { Request, Response, NextFunction } from 'express'
import { UserRole } from '@prisma/client'
import { verifyAccessToken } from '../utils/jwt'
import { sendUnauthorized, sendForbidden } from '../utils/response'
import { AuthenticatedRequest, UserPayload } from '../types'

// ─── Authenticate ─────────────────────────────────────────────────────────────

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    sendUnauthorized(res, 'Token de acesso não fornecido')
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = verifyAccessToken(token)
    ;(req as AuthenticatedRequest).user = {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
      role: payload.role,
      isEmailVerified: true,
    } as UserPayload
    next()
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      sendUnauthorized(res, 'Token expirado')
    } else {
      sendUnauthorized(res, 'Token inválido')
    }
  }
}

// ─── Require Email Verified ───────────────────────────────────────────────────

export const requireEmailVerified = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const user = (req as AuthenticatedRequest).user
  if (!user?.isEmailVerified) {
    sendForbidden(res, 'Email não verificado. Verifica o teu email para continuar.')
    return
  }
  next()
}

// ─── Authorize by Role ────────────────────────────────────────────────────────

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user
    if (!user) {
      sendUnauthorized(res)
      return
    }
    if (!roles.includes(user.role)) {
      sendForbidden(res, 'Não tens permissão para aceder a este recurso')
      return
    }
    next()
  }
}

// ─── Shorthand role guards ────────────────────────────────────────────────────

export const isAdmin = authorize(UserRole.admin)
export const isAdminOrOrganizer = authorize(UserRole.admin, UserRole.organizer)
export const isAnyRole = authorize(UserRole.admin, UserRole.organizer, UserRole.player)

// ─── Optional Auth (doesn't fail if no token) ────────────────────────────────

export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1]
      const payload = verifyAccessToken(token)
      ;(req as AuthenticatedRequest).user = {
        id: payload.sub,
        email: payload.email,
        username: payload.username,
        role: payload.role,
        isEmailVerified: true,
      } as UserPayload
    } catch {
      // silently ignore invalid token
    }
  }
  next()
}
