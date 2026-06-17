import { Router } from 'express'
import * as contentController from '../controllers/content.controller'
import { authenticate, isAdmin, isAdminOrOrganizer } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import {
  createStageSchema, updateStageSchema,
  createCharacterSchema, updateCharacterSchema,
  createEvidenceSchema, updateEvidenceSchema,
} from '../models/game.schema'

const router = Router({ mergeParams: true }) // mergeParams to get :caseId

// ─── Stages ───────────────────────────────────────────────────────────────────

router.get('/stages', authenticate, isAdminOrOrganizer, contentController.getStages)
router.post('/stages', authenticate, isAdminOrOrganizer,
  validate(createStageSchema.omit({ caseId: true })), contentController.createStage)
router.put('/stages/:id', authenticate, isAdminOrOrganizer,
  validate(updateStageSchema), contentController.updateStage)
router.delete('/stages/:id', authenticate, isAdmin, contentController.deleteStage)

// ─── Characters ───────────────────────────────────────────────────────────────

router.get('/characters', authenticate, contentController.getCharacters)
router.post('/characters', authenticate, isAdminOrOrganizer,
  validate(createCharacterSchema.omit({ caseId: true })), contentController.createCharacter)
router.put('/characters/:id', authenticate, isAdminOrOrganizer,
  validate(updateCharacterSchema), contentController.updateCharacter)
router.delete('/characters/:id', authenticate, isAdmin, contentController.deleteCharacter)

// ─── Evidence ─────────────────────────────────────────────────────────────────

router.get('/evidence', authenticate, contentController.getEvidence)
router.post('/evidence', authenticate, isAdminOrOrganizer,
  validate(createEvidenceSchema.omit({ caseId: true })), contentController.createEvidence)
router.put('/evidence/:id', authenticate, isAdminOrOrganizer,
  validate(updateEvidenceSchema), contentController.updateEvidence)
router.delete('/evidence/:id', authenticate, isAdmin, contentController.deleteEvidence)

export default router
