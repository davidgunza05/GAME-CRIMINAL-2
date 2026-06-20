import { z } from 'zod'
import { CaseDifficulty, CaseType } from '@prisma/client'

// ─── Case Builder — Step 1: Basic Info ───────────────────────────────────────

export const builderCaseInfoSchema = z.object({
  title: z.string().min(3, 'Mínimo 3 caracteres').max(120).trim(),
  slug: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Apenas minúsculas, números e hífens')
    .trim(),
  description: z.string().min(20, 'Mínimo 20 caracteres').max(5000).trim(),
  shortDescription: z.string().max(300).trim().optional(),
  difficulty: z.nativeEnum(CaseDifficulty).default(CaseDifficulty.three),
  type: z.nativeEnum(CaseType).default(CaseType.digital),
  minPlayers: z.coerce.number().int().min(1).max(20).default(2),
  maxPlayers: z.coerce.number().int().min(1).max(50).default(8),
  estimatedMinutes: z.coerce.number().int().min(15).max(600).default(120),
  priceDigital: z.coerce.number().min(0).optional(),
  pricePhysical: z.coerce.number().min(0).optional(),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string().trim()).max(20).default([]),
})

// ─── Submit for review ────────────────────────────────────────────────────────

export const submitForReviewSchema = z.object({
  caseId: z.string().uuid(),
})

// ─── Moderation actions ───────────────────────────────────────────────────────

export const moderationActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'request_changes', 'publish', 'unpublish']),
  comment: z.string().max(2000).optional(),
  rejectionReason: z.string().max(2000).optional(),
  changeRequests: z.string().max(2000).optional(),
})

// ─── Case Review ──────────────────────────────────────────────────────────────

export const caseReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).trim().optional(),
})

// ─── List submissions (admin) ─────────────────────────────────────────────────

export const listSubmissionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  status: z.enum(['draft','submitted','under_review','approved','rejected','published']).optional(),
  authorId: z.string().uuid().optional(),
  search: z.string().trim().optional(),
})

export type BuilderCaseInfoInput = z.infer<typeof builderCaseInfoSchema>
export type ModerationActionInput = z.infer<typeof moderationActionSchema>
