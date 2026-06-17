import { Router } from 'express'
import authRoutes from './auth.routes'
import userRoutes from './user.routes'
import caseRoutes from './case.routes'
import orderRoutes from './order.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/cases', caseRoutes)
router.use('/orders', orderRoutes)

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: '🔍 Crime Game API — Online',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  })
})

export default router
