import { Router } from 'express'
import * as sessionController from '../controllers/session.controller'
import { authenticate, isAdmin, optionalAuth } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import {
  createSessionSchema, joinSessionSchema,
  assignCharacterSchema, advanceStageSchema,
  unlockEvidenceSchema, submitAccusationSchema,
} from '../models/game.schema'
import { z } from 'zod'

const router = Router()

// ─── My Sessions ──────────────────────────────────────────────────────────────

router.get('/my', authenticate, sessionController.getMySessions)
router.post('/', authenticate, validate(createSessionSchema), sessionController.createSession)
router.post('/join', optionalAuth, validate(joinSessionSchema), sessionController.joinSession)

// ─── Session lookup ───────────────────────────────────────────────────────────

router.get('/code/:code', authenticate, sessionController.getSessionByCode)
router.get('/:id', authenticate, sessionController.getSession)

// ─── Lifecycle ────────────────────────────────────────────────────────────────

router.post('/:id/start',    authenticate, sessionController.startSession)
router.post('/:id/pause',    authenticate, sessionController.pauseSession)
router.post('/:id/resume',   authenticate, sessionController.resumeSession)
router.post('/:id/complete', authenticate, sessionController.completeSession)

// ─── Characters ───────────────────────────────────────────────────────────────

router.post('/:id/assign-character', authenticate,
  validate(assignCharacterSchema), sessionController.assignCharacter)
router.post('/:id/auto-assign', authenticate, sessionController.autoAssign)

// ─── Stage Advancement ────────────────────────────────────────────────────────

router.post('/:id/advance-stage', authenticate,
  validate(z.object({ stageId: z.string().uuid() })), sessionController.advanceStage)

// ─── Evidence ─────────────────────────────────────────────────────────────────

router.get('/:id/evidence', authenticate, sessionController.getEvidence)
router.post('/:id/evidence/unlock', authenticate,
  validate(z.object({ evidenceId: z.string().uuid() })), sessionController.unlockEvidence)

// ─── Accusations ──────────────────────────────────────────────────────────────

router.post('/:id/accuse', authenticate,
  validate(submitAccusationSchema.omit({ sessionId: true })), sessionController.submitAccusation)
router.get('/:id/accusations', authenticate, sessionController.getAccusations)
router.get('/:id/results', authenticate, sessionController.getResults)

// ─── Admin ────────────────────────────────────────────────────────────────────

router.get('/admin/all', authenticate, isAdmin, sessionController.adminListSessions)

export default router
