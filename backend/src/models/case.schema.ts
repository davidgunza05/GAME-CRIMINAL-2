import { z } from 'zod'
import { CaseDifficulty, CaseType } from '@prisma/client'

export const createCaseSchema = z.object({
  title: z.string().min(3).max(120).trim(),
  slug: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug só pode conter letras minúsculas, números e hífens')
    .trim(),
  description: z.string().min(20).max(5000).trim(),
  shortDescription: z.string().max(300).trim().optional(),
  difficulty: z.nativeEnum(CaseDifficulty).default(CaseDifficulty.three),
  type: z.nativeEnum(CaseType).default(CaseType.digital),
  minPlayers: z.coerce.number().int().min(1).max(20).default(2),
  maxPlayers: z.coerce.number().int().min(1).max(50).default(8),
  estimatedMinutes: z.coerce.number().int().min(15).max(600).default(120),
  priceDigital: z.coerce.number().min(0).optional(),
  pricePhysical: z.coerce.number().min(0).optional(),
  coverImageUrl: z.string().url().optional(),
  previewImages: z.array(z.string().url()).max(10).default([]),
  tags: z.array(z.string().trim()).max(20).default([]),
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
})

export const updateCaseSchema = createCaseSchema.partial()

export const listCasesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
  search: z.string().trim().optional(),
  difficulty: z.nativeEnum(CaseDifficulty).optional(),
  type: z.nativeEnum(CaseType).optional(),
  minPlayers: z.coerce.number().int().min(1).optional(),
  maxPlayers: z.coerce.number().int().max(50).optional(),
  featured: z.coerce.boolean().optional(),
  tags: z.string().optional(), // comma-separated
  sortBy: z.enum(['createdAt', 'priceDigital', 'difficulty', 'sortOrder']).default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export type CreateCaseInput = z.infer<typeof createCaseSchema>
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>
export type ListCasesQuery = z.infer<typeof listCasesQuerySchema>
