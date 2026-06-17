import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import * as authController from '../controllers/auth.controller'
import { authenticate } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../models/auth.schema'

const router = Router()

// ─── Rate limiters ────────────────────────────────────────────────────────────

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10000000,
  message: { success: false, message: 'Demasiadas tentativas. Tenta novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  message: { success: false, message: 'Demasiados pedidos de email. Tenta novamente mais tarde.' },
})

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/auth/register
router.post('/register', authLimiter, validate(registerSchema), authController.register)

// POST /api/auth/login
router.post('/login', authLimiter, validate(loginSchema), authController.login)

// POST /api/auth/refresh
router.post('/refresh', authController.refresh)

// POST /api/auth/logout
router.post('/logout', authController.logout)

// POST /api/auth/logout-all
router.post('/logout-all', authenticate, authController.logoutAll)

// POST /api/auth/verify-email
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail)

// POST /api/auth/resend-verification
router.post('/resend-verification', emailLimiter, validate(resendVerificationSchema), authController.resendVerification)

// POST /api/auth/forgot-password
router.post('/forgot-password', emailLimiter, validate(forgotPasswordSchema), authController.forgotPassword)

// POST /api/auth/reset-password
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword)

// GET /api/auth/me
router.get('/me', authenticate, authController.me)

export default router
