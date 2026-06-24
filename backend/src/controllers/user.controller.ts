import { Request, Response } from 'express'
import * as userService from '../services/user.service'
import { sendSuccess, sendError, sendNotFound } from '../utils/response'
import { AuthenticatedRequest } from '../types'
import { prisma } from '../config/prisma'

// ─── Get My Profile ───────────────────────────────────────────────────────────

export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  const { id } = (req as AuthenticatedRequest).user
  const user = await userService.getUserById(id)
  if (!user) { sendNotFound(res, 'Utilizador não encontrado'); return }
  sendSuccess(res, { user })
}

// ─── Update My Profile ────────────────────────────────────────────────────────

export const updateMyProfile = async (req: Request, res: Response): Promise<void> => {
  const { id } = (req as AuthenticatedRequest).user
  const user = await userService.updateProfile(id, req.body)
  sendSuccess(res, { user }, 'Perfil atualizado com sucesso')
}

// ─── Change Password ──────────────────────────────────────────────────────────

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = (req as AuthenticatedRequest).user
    const { currentPassword, newPassword } = req.body
    await userService.changePassword(id, currentPassword, newPassword)
    sendSuccess(res, null, 'Password alterada com sucesso')
  } catch (err: any) {
    if (err.message === 'INVALID_CURRENT_PASSWORD') {
      sendError(res, 'Password atual incorreta', 400)
    } else {
      throw err
    }
  }
}

// ─── Change Username ──────────────────────────────────────────────────────────

export const changeUsername = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = (req as AuthenticatedRequest).user
    const user = await userService.changeUsername(id, req.body.username)
    sendSuccess(res, { user }, 'Username alterado com sucesso')
  } catch (err: any) {
    if (err.message === 'USERNAME_TAKEN') {
      sendError(res, 'Este username já está em uso', 409)
    } else {
      throw err
    }
  }
}

// ─── Get Public Profile ───────────────────────────────────────────────────────

export const getPublicProfile = async (req: Request, res: Response): Promise<void> => {
  const user = await userService.getUserByUsername(req.params.username)
  if (!user || !user.isActive) { sendNotFound(res, 'Utilizador não encontrado'); return }
  // Return only public fields
  sendSuccess(res, {
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      createdAt: user.createdAt,
    },
  })
}

// ─── Admin: List Users ────────────────────────────────────────────────────────

export const listUsers = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, search, role } = req.query as any
  const result = await userService.listUsers({ page, limit, search, role })
  sendSuccess(res, result)
}

// ─── Admin: Get User ──────────────────────────────────────────────────────────

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  const user = await userService.getUserById(req.params.id)
  if (!user) { sendNotFound(res, 'Utilizador não encontrado'); return }
  sendSuccess(res, { user })
}

// ─── Admin: Toggle Active ─────────────────────────────────────────────────────

export const toggleUserActive = async (req: Request, res: Response): Promise<void> => {
  const { isActive } = req.body
  const user = await userService.toggleUserActive(req.params.id, isActive)
  sendSuccess(res, { user }, `Utilizador ${isActive ? 'ativado' : 'desativado'} com sucesso`)
}

// ─── Admin: Change Role ───────────────────────────────────────────────────────

export const changeUserRole = async (req: Request, res: Response): Promise<void> => {
  const user = await userService.changeUserRole(req.params.id, req.body.role)
  sendSuccess(res, { user }, 'Role do utilizador alterada com sucesso')
}

export const getMyStats = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthenticatedRequest).user.id

  const [casesBought, sessionsTotal, sessionsCompleted, xpProfile] = await Promise.all([
    prisma.caseAccess.count({ where: { userId } }),
    prisma.gameSession.count({
      where: { OR: [{ hostId: userId }, { participants: { some: { userId } } }] },
    }),
    prisma.gameSession.count({
      where: {
        status: 'completed',
        OR: [{ hostId: userId }, { participants: { some: { userId } } }],
      },
    }),
    prisma.playerProfile.findUnique({
      where: { userId },
      select: { totalXp: true, level: true },
    }),
  ])

  sendSuccess(res, {
    casesBought,
    sessionsTotal,
    sessionsCompleted,
    totalXp: xpProfile?.totalXp ?? 0,
    level: xpProfile?.level ?? 1,
  })
}
