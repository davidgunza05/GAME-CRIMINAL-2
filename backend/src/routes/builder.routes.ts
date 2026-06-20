import { Router } from 'express'
import * as builderController from '../controllers/builder.controller'
import * as contentController from '../controllers/content.controller'
import { authenticate, isAdmin, isAdminOrOrganizer } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import {
  builderCaseInfoSchema, moderationActionSchema, caseReviewSchema,
} from '../models/builder.schema'
import { z } from 'zod'

const router = Router()

// ─── My cases (admin + organizer) ────────────────────────────────────────────
router.get('/my', authenticate, isAdminOrOrganizer, builderController.getMySubmissions)
router.post('/', authenticate, isAdminOrOrganizer, validate(builderCaseInfoSchema), builderController.createCase)
router.get('/:caseId', authenticate, isAdminOrOrganizer, builderController.getMyCase)
router.patch('/:caseId', authenticate, isAdminOrOrganizer, validate(builderCaseInfoSchema.partial()), builderController.updateCase)
router.delete('/:caseId', authenticate, isAdminOrOrganizer, builderController.deleteCase)
router.get('/:caseId/validate', authenticate, isAdminOrOrganizer, builderController.validateCase)
router.post('/:caseId/submit', authenticate, isAdminOrOrganizer, validate(z.object({})), builderController.submitForReview)

// ─── Stage / Character / Evidence management (reuse content routes) ───────────
// These are already on /cases/:caseId/stages|characters|evidence
// We expose them here too for convenience in the builder UI
router.get('/:caseId/stages',     authenticate, isAdminOrOrganizer, (req, res) => { req.params.caseId = req.params.caseId; contentController.getStages(req, res) })
router.post('/:caseId/stages',    authenticate, isAdminOrOrganizer, contentController.createStage)
router.put('/:caseId/stages/:id', authenticate, isAdminOrOrganizer, contentController.updateStage)
router.delete('/:caseId/stages/:id', authenticate, isAdmin, contentController.deleteStage)

router.get('/:caseId/characters',     authenticate, isAdminOrOrganizer, contentController.getCharacters)
router.post('/:caseId/characters',    authenticate, isAdminOrOrganizer, contentController.createCharacter)
router.put('/:caseId/characters/:id', authenticate, isAdminOrOrganizer, contentController.updateCharacter)
router.delete('/:caseId/characters/:id', authenticate, isAdmin, contentController.deleteCharacter)

router.get('/:caseId/evidence',     authenticate, isAdminOrOrganizer, contentController.getEvidence)
router.post('/:caseId/evidence',    authenticate, isAdminOrOrganizer, contentController.createEvidence)
router.put('/:caseId/evidence/:id', authenticate, isAdminOrOrganizer, contentController.updateEvidence)
router.delete('/:caseId/evidence/:id', authenticate, isAdmin, contentController.deleteEvidence)

// ─── Reviews (authenticated players) ─────────────────────────────────────────
router.get('/:caseId/reviews', authenticate, builderController.getCaseReviews)
router.post('/:caseId/reviews', authenticate, validate(caseReviewSchema), builderController.submitReview)

// ─── Admin moderation ─────────────────────────────────────────────────────────
router.get('/admin/submissions', authenticate, isAdmin, builderController.adminListSubmissions)
router.get('/admin/submissions/:id', authenticate, isAdmin, builderController.adminGetSubmission)
router.post('/admin/submissions/:id/moderate', authenticate, isAdmin, validate(moderationActionSchema), builderController.adminModerate)

export default router
