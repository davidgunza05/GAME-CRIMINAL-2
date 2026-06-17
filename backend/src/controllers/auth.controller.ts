import { Request, Response } from 'express'
import * as authService from '../services/auth.service'
import { sendSuccess, sendCreated, sendError, sendUnauthorized } from '../utils/response'
import { AuthenticatedRequest } from '../types'

const REFRESH_TOKEN_COOKIE = 'refresh_token'
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth',
}

// ─── Register ─────────────────────────────────────────────────────────────────

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user } = await authService.registerUser(req.body)
    sendCreated(res, { user }, 'Conta criada com sucesso. Verifica o teu email para ativar a conta.')
  } catch (err: any) {
    if (err.message === 'EMAIL_TAKEN') {
      sendError(res, 'Este email já está registado', 409)
    } else if (err.message === 'USERNAME_TAKEN') {
      sendError(res, 'Este username já está em uso', 409)
    } else {
      throw err
    }
  }
}

// ─── Verify Email ─────────────────────────────────────────────────────────────

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body
    const user = await authService.verifyEmail(token)
    sendSuccess(res, { user }, 'Email verificado com sucesso! Podes fazer login.')
  } catch (err: any) {
    const messages: Record<string, string> = {
      TOKEN_INVALID: 'Link de verificação inválido',
      TOKEN_USED: 'Este link já foi utilizado',
      TOKEN_EXPIRED: 'Link de verificação expirado. Solicita um novo.',
      ALREADY_VERIFIED: 'O teu email já foi verificado',
    }
    sendError(res, messages[err.message] ?? 'Erro ao verificar email', 400)
  }
}

// ─── Resend Verification ──────────────────────────────────────────────────────

export const resendVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    await authService.resendVerificationEmail(req.body.email)
    sendSuccess(res, null, 'Se o email existir na nossa base de dados, receberás um novo link de verificação.')
  } catch (err: any) {
    if (err.message === 'ALREADY_VERIFIED') {
      sendError(res, 'O teu email já foi verificado', 400)
    } else {
      throw err
    }
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const userAgent = req.headers['user-agent']
    const ipAddress = req.ip

    const { user, tokens } = await authService.loginUser({
      ...req.body,
      userAgent,
      ipAddress,
    })

    // Set refresh token as httpOnly cookie
    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, COOKIE_OPTIONS)

    sendSuccess(res, {
      user,
      accessToken: tokens.accessToken,
    }, 'Login efetuado com sucesso')
  } catch (err: any) {
    const messages: Record<string, string> = {
      INVALID_CREDENTIALS: 'Email ou password incorretos',
      ACCOUNT_DISABLED: 'Conta desativada. Contacta o suporte.',
    }
    sendError(res, messages[err.message] ?? 'Erro ao fazer login', 401)
  }
}

// ─── Refresh ──────────────────────────────────────────────────────────────────

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    // Accept from cookie or body
    const rawToken =
      req.cookies?.[REFRESH_TOKEN_COOKIE] ??
      req.body?.refreshToken

    if (!rawToken) {
      sendUnauthorized(res, 'Refresh token não fornecido')
      return
    }

    const userAgent = req.headers['user-agent']
    const ipAddress = req.ip

    const { user, tokens } = await authService.refreshTokens(rawToken, userAgent, ipAddress)

    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, COOKIE_OPTIONS)

    sendSuccess(res, {
      user,
      accessToken: tokens.accessToken,
    }, 'Token renovado com sucesso')
  } catch (err: any) {
    const messages: Record<string, string> = {
      TOKEN_INVALID: 'Token inválido',
      TOKEN_EXPIRED: 'Sessão expirada. Faz login novamente.',
      TOKEN_REVOKED: 'Sessão revogada. Faz login novamente.',
      TOKEN_REUSE_DETECTED: 'Atividade suspeita detetada. Faz login novamente.',
      ACCOUNT_DISABLED: 'Conta desativada.',
    }
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/api/auth' })
    sendUnauthorized(res, messages[err.message] ?? 'Sessão inválida')
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logout = async (req: Request, res: Response): Promise<void> => {
  const rawToken = req.cookies?.[REFRESH_TOKEN_COOKIE] ?? req.body?.refreshToken

  if (rawToken) {
    await authService.logoutUser(rawToken).catch(() => {})
  }

  res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/api/auth' })
  sendSuccess(res, null, 'Logout efetuado com sucesso')
}

// ─── Logout All Devices ───────────────────────────────────────────────────────

export const logoutAll = async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthenticatedRequest).user
  await authService.logoutAllDevices(user.id)
  res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/api/auth' })
  sendSuccess(res, null, 'Sessão encerrada em todos os dispositivos')
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  await authService.forgotPassword(req.body.email)
  sendSuccess(res, null, 'Se o email existir na nossa base de dados, receberás um link para redefinir a tua password.')
}

// ─── Reset Password ───────────────────────────────────────────────────────────

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body
    await authService.resetPassword(token, password)
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/api/auth' })
    sendSuccess(res, null, 'Password redefinida com sucesso. Podes fazer login com a nova password.')
  } catch (err: any) {
    const messages: Record<string, string> = {
      TOKEN_INVALID: 'Link de redefinição inválido',
      TOKEN_USED: 'Este link já foi utilizado',
      TOKEN_EXPIRED: 'Link expirado. Solicita um novo.',
    }
    sendError(res, messages[err.message] ?? 'Erro ao redefinir password', 400)
  }
}

// ─── Me ───────────────────────────────────────────────────────────────────────

export const me = async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthenticatedRequest).user
  sendSuccess(res, { user })
}
