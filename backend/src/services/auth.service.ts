import { prisma } from '../config/prisma'
import { TokenType } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import {
  hashPassword,
  comparePassword,
  generateSecureToken,
  hashToken,
  getEmailTokenExpiry,
  getPasswordResetExpiry,
} from '../utils/crypto'
import {
  generateTokenPair,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} from '../utils/jwt'
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from './email.service'
import { SafeUser, TokenPair, UserPayload } from '../types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toSafeUser = (user: any): SafeUser => {
  const { passwordHash, ...safe } = user
  return safe as SafeUser
}

const toUserPayload = (user: any): UserPayload => ({
  id: user.id,
  email: user.email,
  username: user.username,
  role: user.role,
  isEmailVerified: user.isEmailVerified,
})

// ─── Register ─────────────────────────────────────────────────────────────────

export interface RegisterInput {
  email: string
  username: string
  password: string
  displayName?: string
}

export const registerUser = async (
  input: RegisterInput
): Promise<{ user: SafeUser }> => {
  const { email, username, password, displayName } = input

  // Check duplicates
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  })
  if (existing) {
    if (existing.email === email) throw new Error('EMAIL_TAKEN')
    if (existing.username === username) throw new Error('USERNAME_TAKEN')
  }

  const passwordHash = await hashPassword(password)

  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
      displayName: displayName || username,
    },
  })

  // Generate & store verification token
  const { token, tokenHash } = generateEmailToken()
  await prisma.userToken.create({
    data: {
      userId: user.id,
      token: tokenHash,
      type: TokenType.email_verification,
      expiresAt: getEmailTokenExpiry(),
    },
  })

  // Send verification email (non-blocking)
  sendVerificationEmail(user.email, user.username, token).catch(() => {})

  return { user: toSafeUser(user) }
}

// ─── Verify Email ─────────────────────────────────────────────────────────────

export const verifyEmail = async (rawToken: string): Promise<SafeUser> => {
  const tokenHash = hashToken(rawToken)

  const record = await prisma.userToken.findUnique({
    where: { token: tokenHash },
    include: { user: true },
  })

  if (!record) throw new Error('TOKEN_INVALID')
  if (record.type !== TokenType.email_verification) throw new Error('TOKEN_INVALID')
  if (record.usedAt) throw new Error('TOKEN_USED')
  if (record.expiresAt < new Date()) throw new Error('TOKEN_EXPIRED')
  if (record.user.isEmailVerified) throw new Error('ALREADY_VERIFIED')

  const [user] = await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { isEmailVerified: true },
    }),
    prisma.userToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ])

  sendWelcomeEmail(user.email, user.username).catch(() => {})

  return toSafeUser(user)
}

// ─── Resend Verification ──────────────────────────────────────────────────────

export const resendVerificationEmail = async (email: string): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return // silently ignore to prevent enumeration
  if (user.isEmailVerified) throw new Error('ALREADY_VERIFIED')

  // Invalidate previous tokens
  await prisma.userToken.updateMany({
    where: {
      userId: user.id,
      type: TokenType.email_verification,
      usedAt: null,
    },
    data: { usedAt: new Date() },
  })

  const { token, tokenHash } = generateEmailToken()
  await prisma.userToken.create({
    data: {
      userId: user.id,
      token: tokenHash,
      type: TokenType.email_verification,
      expiresAt: getEmailTokenExpiry(),
    },
  })

  await sendVerificationEmail(user.email, user.username, token)
}

// ─── Login ────────────────────────────────────────────────────────────────────

export interface LoginInput {
  email: string
  password: string
  userAgent?: string
  ipAddress?: string
}

export const loginUser = async (
  input: LoginInput
): Promise<{ user: SafeUser; tokens: TokenPair }> => {
  const { email, password, userAgent, ipAddress } = input

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new Error('INVALID_CREDENTIALS')
  if (!user.isActive) throw new Error('ACCOUNT_DISABLED')

  const valid = await comparePassword(password, user.passwordHash)
  if (!valid) throw new Error('INVALID_CREDENTIALS')

  // Email ainda não verificado — reenviar token e bloquear login
  if (!user.isEmailVerified) {
    // Invalidar tokens anteriores e gerar novo
    await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } })
    const { token, tokenHash } = generateEmailToken()
    await prisma.emailVerificationToken.create({
      data: { userId: user.id, token: tokenHash, expiresAt: getEmailTokenExpiry() },
    })
    sendVerificationEmail(user.email, user.username, token).catch(() => {})
    throw new Error('EMAIL_NOT_VERIFIED')
  }

  const family = uuidv4()
  const tokens = generateTokenPair(toUserPayload(user), family)
  const tokenHash = hashToken(tokens.refreshToken)

  await prisma.$transaction([
    prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        family,
        expiresAt: getRefreshTokenExpiry(),
        userAgent: userAgent ?? null,
        ipAddress: ipAddress ?? null,
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }),
  ])

  return { user: toSafeUser(user), tokens }
}

// ─── Refresh Token ────────────────────────────────────────────────────────────

export const refreshTokens = async (
  rawRefreshToken: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ user: SafeUser; tokens: TokenPair }> => {
  let payload: { sub: string; family: string }

  try {
    payload = verifyRefreshToken(rawRefreshToken)
  } catch {
    throw new Error('TOKEN_INVALID')
  }

  const tokenHash = hashToken(rawRefreshToken)
  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  })

  // Reuse detection — if token not found but family exists, revoke all
  if (!storedToken) {
    await prisma.refreshToken.updateMany({
      where: { family: payload.family },
      data: { isRevoked: true },
    })
    throw new Error('TOKEN_REUSE_DETECTED')
  }

  if (storedToken.isRevoked) throw new Error('TOKEN_REVOKED')
  if (storedToken.expiresAt < new Date()) throw new Error('TOKEN_EXPIRED')

  const user = storedToken.user
  if (!user.isActive) throw new Error('ACCOUNT_DISABLED')

  // Rotate token — revoke old, create new in same family
  const newFamily = uuidv4()
  const tokens = generateTokenPair(toUserPayload(user), newFamily)
  const newTokenHash = hashToken(tokens.refreshToken)

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    }),
    prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: newTokenHash,
        family: newFamily,
        expiresAt: getRefreshTokenExpiry(),
        userAgent: userAgent ?? null,
        ipAddress: ipAddress ?? null,
      },
    }),
  ])

  return { user: toSafeUser(user), tokens }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logoutUser = async (rawRefreshToken: string): Promise<void> => {
  const tokenHash = hashToken(rawRefreshToken)
  await prisma.refreshToken.updateMany({
    where: { tokenHash },
    data: { isRevoked: true },
  })
}

export const logoutAllDevices = async (userId: string): Promise<void> => {
  await prisma.refreshToken.updateMany({
    where: { userId, isRevoked: false },
    data: { isRevoked: true },
  })
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

export const forgotPassword = async (email: string): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return // silently ignore

  // Invalidate previous reset tokens
  await prisma.userToken.updateMany({
    where: { userId: user.id, type: TokenType.password_reset, usedAt: null },
    data: { usedAt: new Date() },
  })

  const { token, tokenHash } = generateEmailToken()
  await prisma.userToken.create({
    data: {
      userId: user.id,
      token: tokenHash,
      type: TokenType.password_reset,
      expiresAt: getPasswordResetExpiry(),
    },
  })

  await sendPasswordResetEmail(user.email, user.username, token)
}

// ─── Reset Password ───────────────────────────────────────────────────────────

export const resetPassword = async (
  rawToken: string,
  newPassword: string
): Promise<void> => {
  const tokenHash = hashToken(rawToken)

  const record = await prisma.userToken.findUnique({
    where: { token: tokenHash },
    include: { user: true },
  })

  if (!record) throw new Error('TOKEN_INVALID')
  if (record.type !== TokenType.password_reset) throw new Error('TOKEN_INVALID')
  if (record.usedAt) throw new Error('TOKEN_USED')
  if (record.expiresAt < new Date()) throw new Error('TOKEN_EXPIRED')

  const passwordHash = await hashPassword(newPassword)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.userToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    // Revoke all refresh tokens for security
    prisma.refreshToken.updateMany({
      where: { userId: record.userId },
      data: { isRevoked: true },
    }),
  ])
}

// ─── Private helpers ─────────────────────────────────────────────────────────

const generateEmailToken = (): { token: string; tokenHash: string } => {
  const token = generateSecureToken()
  const tokenHash = hashToken(token)
  return { token, tokenHash }
}
