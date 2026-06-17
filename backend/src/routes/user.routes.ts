import { Router } from 'express'
import * as userController from '../controllers/user.controller'
import { authenticate, isAdmin } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import {
  updateProfileSchema,
  changePasswordSchema,
  changeUsernameSchema,
  listUsersQuerySchema,
  changeUserRoleSchema,
} from '../models/user.schema'

const router = Router()

// ─── My Profile ───────────────────────────────────────────────────────────────

// GET /api/users/me
router.get('/me', authenticate, userController.getMyProfile)

// PATCH /api/users/me
router.patch('/me', authenticate, validate(updateProfileSchema), userController.updateMyProfile)

// PATCH /api/users/me/password
router.patch('/me/password', authenticate, validate(changePasswordSchema), userController.changePassword)

// PATCH /api/users/me/username
router.patch('/me/username', authenticate, validate(changeUsernameSchema), userController.changeUsername)

// ─── Public Profiles ──────────────────────────────────────────────────────────

// GET /api/users/:username/profile
router.get('/:username/profile', userController.getPublicProfile)

// ─── Admin ────────────────────────────────────────────────────────────────────

// GET /api/users (admin)
router.get('/', authenticate, isAdmin, validate(listUsersQuerySchema, 'query'), userController.listUsers)

// GET /api/users/:id (admin)
router.get('/:id', authenticate, isAdmin, userController.getUserById)

// PATCH /api/users/:id/active (admin)
router.patch('/:id/active', authenticate, isAdmin, userController.toggleUserActive)

// PATCH /api/users/:id/role (admin)
router.patch('/:id/role', authenticate, isAdmin, validate(changeUserRoleSchema), userController.changeUserRole)

export default router
