import { Router } from 'express'
import * as gc from '../controllers/gamification.controller'
import { authenticate, isAdmin } from '../middleware/auth.middleware'
import { z } from 'zod'
import { validate } from '../middleware/validate.middleware'

const router = Router()

// ─── My profile ───────────────────────────────────────────────────────────────
router.get('/profile/me',        authenticate, gc.getMyProfile)
router.get('/profile/me/xp',     authenticate, gc.getXpHistory)
router.get('/profile/me/rank',   authenticate, gc.getMyRank)
router.get('/profile/me/badges', authenticate, gc.getMyBadges)

// ─── Public user profiles ──────────────────────────────────────────────────────
router.get('/profile/:userId',        authenticate, gc.getUserProfile)
router.get('/profile/:userId/badges', authenticate, gc.getUserBadges)

// ─── Leaderboards ──────────────────────────────────────────────────────────────
router.get('/leaderboard/global',          authenticate, gc.getGlobalLeaderboard)
router.get('/leaderboard/case/:caseId',    authenticate, gc.getCaseLeaderboard)

// ─── Admin: badges ─────────────────────────────────────────────────────────────
router.get('/admin/badges',          authenticate, isAdmin, gc.adminListBadges)
router.post('/admin/badges',         authenticate, isAdmin, gc.adminCreateBadge)
router.put('/admin/badges/:id',      authenticate, isAdmin, gc.adminUpdateBadge)
router.delete('/admin/badges/:id',   authenticate, isAdmin, gc.adminDeleteBadge)

// ─── Admin: communication logs ─────────────────────────────────────────────────
router.get('/admin/comms',           authenticate, isAdmin, gc.getCommLogs)
router.post('/admin/comms/send',     authenticate, isAdmin, gc.sendInviteManual)

export default router
