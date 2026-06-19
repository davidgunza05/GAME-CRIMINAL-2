import { Request, Response } from 'express'
import * as xpService from '../services/xp.service'
import * as badgeService from '../services/badge.service'
import * as leaderboardService from '../services/leaderboard.service'
import * as commService from '../services/communication.service'
import { sendSuccess, sendCreated, sendError, sendNotFound } from '../utils/response'
import { AuthenticatedRequest } from '../types'

// ─── Profile & XP ─────────────────────────────────────────────────────────────

export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthenticatedRequest).user.id
  const data = await xpService.getPlayerProfile(userId)
  sendSuccess(res, data)
}

export const getXpHistory = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthenticatedRequest).user.id
  const { page = 1, limit = 20 } = req.query as any
  const data = await xpService.getXpHistory(userId, Number(page), Number(limit))
  sendSuccess(res, data)
}

export const getMyRank = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthenticatedRequest).user.id
  const rank = await leaderboardService.getUserRank(userId)
  if (!rank) { sendNotFound(res, 'Perfil não encontrado'); return }
  sendSuccess(res, rank)
}

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  const data = await xpService.getPlayerProfile(req.params.userId)
  sendSuccess(res, data)
}

// ─── Badges ───────────────────────────────────────────────────────────────────

export const getMyBadges = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthenticatedRequest).user.id
  const badges = await badgeService.listBadgesForUser(userId)
  sendSuccess(res, { badges })
}

export const getUserBadges = async (req: Request, res: Response): Promise<void> => {
  const badges = await badgeService.listBadgesForUser(req.params.userId)
  sendSuccess(res, { badges })
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export const getGlobalLeaderboard = async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 20, sortBy = 'totalXp' } = req.query as any
  const data = await leaderboardService.getGlobalLeaderboard(
    Number(page),
    Number(limit),
    sortBy as any
  )
  sendSuccess(res, data)
}

export const getCaseLeaderboard = async (req: Request, res: Response): Promise<void> => {
  const { limit = 10 } = req.query as any
  const data = await leaderboardService.getCaseLeaderboard(req.params.caseId, Number(limit))
  sendSuccess(res, { leaderboard: data })
}

// ─── Admin: Badges CRUD ───────────────────────────────────────────────────────

export const adminListBadges = async (_req: Request, res: Response): Promise<void> => {
  const badges = await badgeService.adminListBadges()
  sendSuccess(res, { badges })
}

export const adminCreateBadge = async (req: Request, res: Response): Promise<void> => {
  const badge = await badgeService.createBadge(req.body)
  sendCreated(res, { badge }, 'Badge criada')
}

export const adminUpdateBadge = async (req: Request, res: Response): Promise<void> => {
  const badge = await badgeService.updateBadge(req.params.id, req.body)
  sendSuccess(res, { badge }, 'Badge atualizada')
}

export const adminDeleteBadge = async (req: Request, res: Response): Promise<void> => {
  await badgeService.deleteBadge(req.params.id)
  sendSuccess(res, null, 'Badge eliminada')
}

// ─── Communication Logs ───────────────────────────────────────────────────────

export const getCommLogs = async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 30, sessionId, userId, status } = req.query as any
  const data = await commService.getCommLogs({ page: Number(page), limit: Number(limit), sessionId, userId, status })
  sendSuccess(res, data)
}

// ─── Manual comms (admin trigger) ────────────────────────────────────────────

export const sendInviteManual = async (req: Request, res: Response): Promise<void> => {
  try {
    const { to, toName, caseTitle, accessCode, hostName, sessionId, channel, phone } = req.body

    if (channel === 'whatsapp' && phone) {
      await commService.sendWhatsAppInvite({ to: phone, toName, caseTitle, accessCode, hostName, sessionId })
    } else {
      await commService.sendSessionInvite({ to, toName, caseTitle, accessCode, hostName, sessionId })
    }

    sendSuccess(res, null, 'Comunicação enviada')
  } catch (err: any) {
    sendError(res, 'Erro ao enviar comunicação', 500)
  }
}
