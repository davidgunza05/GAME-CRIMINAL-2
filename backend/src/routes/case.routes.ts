import { Router } from 'express'
import * as caseController from '../controllers/case.controller'
import { authenticate, isAdmin } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { createCaseSchema, updateCaseSchema, listCasesQuerySchema } from '../models/case.schema'
import { z } from 'zod'

const router = Router()

// ─── Public ───────────────────────────────────────────────────────────────────

router.get('/', validate(listCasesQuerySchema, 'query'), caseController.listCases)
router.get('/featured', caseController.getFeaturedCases)
router.get('/tags', caseController.getAllTags)
router.get('/:slug', caseController.getCaseBySlug)

// ─── Admin ────────────────────────────────────────────────────────────────────

router.get('/admin/all', authenticate, isAdmin,
  validate(listCasesQuerySchema, 'query'), caseController.adminListCases)

router.get('/admin/:id', authenticate, isAdmin, caseController.adminGetCase)

router.post('/', authenticate, isAdmin,
  validate(createCaseSchema), caseController.createCase)

router.put('/:id', authenticate, isAdmin,
  validate(updateCaseSchema), caseController.updateCase)

router.delete('/:id', authenticate, isAdmin, caseController.deleteCase)

router.patch('/:id/publish', authenticate, isAdmin,
  validate(z.object({ isPublished: z.boolean() })), caseController.togglePublish)

router.patch('/:id/featured', authenticate, isAdmin,
  validate(z.object({ isFeatured: z.boolean() })), caseController.toggleFeatured)

export default router
