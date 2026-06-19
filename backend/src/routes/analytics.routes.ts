import { Router } from 'express'
import * as analyticsController from '../controllers/analytics.controller'
import { authenticate, isAdmin } from '../middleware/auth.middleware'

const router = Router()

// All analytics routes are admin-only
router.use(authenticate, isAdmin)

router.get('/',           analyticsController.getFullAnalytics)
router.get('/kpis',       analyticsController.getOverviewKPIs)
router.get('/revenue',    analyticsController.getRevenueChart)
router.get('/users',      analyticsController.getUserGrowth)
router.get('/sessions',   analyticsController.getSessionsChart)
router.get('/feed',       analyticsController.getActivityFeed)
router.get('/top-cases',  analyticsController.getTopCases)
router.get('/drop-off',   analyticsController.getDropOff)
router.get('/retention',  analyticsController.getRetention)

export default router
