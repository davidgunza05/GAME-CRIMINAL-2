import { z } from 'zod'
import { UserRole } from '@prisma/client'

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres')
    .trim()
    .optional(),
  bio: z
    .string()
    .max(300, 'Bio deve ter no máximo 300 caracteres')
    .trim()
    .optional(),
  avatarUrl: z.string().url('URL de avatar inválida').optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password atual é obrigatória'),
  newPassword: z
    .string()
    .min(8, 'Nova password deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Nova password deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Nova password deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Nova password deve conter pelo menos um número'),
})

export const changeUsernameSchema = z.object({
  username: z
    .string()
    .min(3, 'Username deve ter pelo menos 3 caracteres')
    .max(30, 'Username deve ter no máximo 30 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username só pode conter letras, números e underscore')
    .toLowerCase()
    .trim(),
})

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  role: z.nativeEnum(UserRole).optional(),
})

export const changeUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
})
