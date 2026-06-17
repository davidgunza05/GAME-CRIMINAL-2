import { z } from 'zod'

const passwordSchema = z
  .string()
  .min(8, 'Password deve ter pelo menos 8 caracteres')
  .regex(/[A-Z]/, 'Password deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Password deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Password deve conter pelo menos um número')

export const registerSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase().trim(),
  username: z
    .string()
    .min(3, 'Username deve ter pelo menos 3 caracteres')
    .max(30, 'Username deve ter no máximo 30 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username só pode conter letras, números e underscore')
    .toLowerCase()
    .trim(),
  password: passwordSchema,
  displayName: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres')
    .trim()
    .optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase().trim(),
  password: z.string().min(1, 'Password é obrigatória'),
})

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
})

export const resendVerificationSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase().trim(),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase().trim(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  password: passwordSchema,
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
