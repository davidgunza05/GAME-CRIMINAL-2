import { z } from 'zod'
import { EvidenceType, SessionMode } from '@prisma/client'

// ─── Game Stage ───────────────────────────────────────────────────────────────

export const createStageSchema = z.object({
  caseId: z.string().uuid(),
  order: z.coerce.number().int().min(1),
  title: z.string().min(2).max(120).trim(),
  description: z.string().min(10).max(2000).trim(),
  isLast: z.boolean().default(false),
})

export const updateStageSchema = createStageSchema.omit({ caseId: true }).partial()

// ─── Character ────────────────────────────────────────────────────────────────

export const createCharacterSchema = z.object({
  caseId: z.string().uuid(),
  name: z.string().min(2).max(80).trim(),
  description: z.string().min(5).max(500).trim(),
  backstory: z.string().min(10).max(3000).trim(),
  objectives: z.string().min(5).max(1000).trim(),
  secrets: z.string().min(5).max(1000).trim(),
  alibi: z.string().min(5).max(1000).trim(),
  isKiller: z.boolean().default(false),
  isDetective: z.boolean().default(false),
  avatarUrl: z.string().optional().transform(v => v || undefined).pipe(z.string().url().optional()),
})

export const updateCharacterSchema = createCharacterSchema.omit({ caseId: true }).partial()

// ─── Evidence ─────────────────────────────────────────────────────────────────

export const createEvidenceSchema = z.object({
  caseId: z.string().uuid(),
  // stageId: string vazia → undefined (frontend envia '' quando não selecionado)
  stageId: z.string().uuid().optional().or(z.literal('')).transform(v => v || undefined),
  title: z.string().min(2).max(120).trim(),
  description: z.string().min(5).max(2000).trim(),
  type: z.nativeEnum(EvidenceType),
  // contentUrl: string vazia → undefined; URL válido → mantém
  contentUrl: z.string().optional().transform(v => v || undefined).pipe(
    z.string().url().optional()
  ),
  contentText: z.string().max(5000).optional().transform(v => v || undefined),
  isRedHerring: z.boolean().default(false),
  qrCode: z.string().max(500).optional().transform(v => v || undefined),
  // sortOrder: string vazia, null ou undefined → 0
  sortOrder: z.union([z.number(), z.string(), z.null(), z.undefined()])
    .transform(v => {
      const n = Number(v)
      return isNaN(n) ? 0 : Math.floor(n)
    })
    .default(0),
})

export const updateEvidenceSchema = createEvidenceSchema.omit({ caseId: true }).partial()

// ─── Session ──────────────────────────────────────────────────────────────────

export const createSessionSchema = z.object({
  caseId: z.string().uuid(),
  mode: z.nativeEnum(SessionMode).default(SessionMode.multiplayer),
  scheduledAt: z.coerce.date().optional(),
  estimatedMinutes: z.coerce.number().int().min(15).max(600).optional(),
  location: z.string().max(300).optional(),
  meetingUrl: z.string().optional().transform(v => v || undefined).pipe(z.string().url().optional()),
  notes: z.string().max(1000).optional(),
})

export const updateSessionSchema = createSessionSchema.omit({ caseId: true }).partial()

export const joinSessionSchema = z.object({
  accessCode: z.string().min(6).max(10).toUpperCase().trim(),
  guestName: z.string().min(2).max(80).trim().optional(),
  guestEmail: z.string().email().optional(),
})

export const assignCharacterSchema = z.object({
  participantId: z.string().uuid(),
  characterId: z.string().uuid(),
})

// ─── Game Engine ──────────────────────────────────────────────────────────────

export const advanceStageSchema = z.object({
  sessionId: z.string().uuid(),
  stageId: z.string().uuid(),
})

export const unlockEvidenceSchema = z.object({
  sessionId: z.string().uuid(),
  evidenceId: z.string().uuid(),
})

// ─── Accusation ───────────────────────────────────────────────────────────────

export const submitAccusationSchema = z.object({
  sessionId: z.string().uuid(),
  suspectId: z.string().uuid(),
  motive: z.string().min(10).max(1000).trim(),
  method: z.string().min(5).max(500).trim(),
  evidenceCited: z.array(z.string().uuid()).min(1, 'Cita pelo menos uma evidência'),
})
