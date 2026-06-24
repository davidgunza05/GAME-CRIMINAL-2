import { Request, Response } from 'express'
import * as sessionService from '../services/session.service'
import { emitToSession, EVENTS } from '../sockets/game.socket'
import { sendSuccess, sendCreated, sendError, sendNotFound } from '../utils/response'
import { AuthenticatedRequest } from '../types'

// ─── Create & Join ────────────────────────────────────────────────────────────

export const createSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = (req as AuthenticatedRequest).user.id
    const session = await sessionService.createSession(hostId, req.body)
    sendCreated(res, { session }, 'Sessão criada com sucesso')
  } catch (err: any) {
    if (err.message === 'CASE_NOT_FOUND') sendError(res, 'Caso não encontrado ou não publicado', 404)
    else if (err.message === 'CASE_ACCESS_REQUIRED') sendError(res, 'Precisas de comprar este caso para criar uma sessão', 403)
    else throw err
  }
}

export const joinSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id
    const { accessCode, guestName, guestEmail } = req.body
    const session = await sessionService.joinSessionByCode(
      accessCode, userId,
      !userId && guestName ? { name: guestName, email: guestEmail } : undefined
    )
    // Notify room
    emitToSession(session!.id, EVENTS.SESSION_UPDATED, { session })
    sendSuccess(res, { session }, 'Entraste na sessão!')
  } catch (err: any) {
    const msgs: Record<string, [string, number]> = {
      SESSION_NOT_FOUND: ['Código de acesso inválido', 404],
      SESSION_CLOSED:    ['Esta sessão já terminou', 400],
      SESSION_FULL:      ['Sessão completa', 400],
    }
    const [msg, status] = msgs[err.message] ?? ['Erro ao entrar na sessão', 400]
    sendError(res, msg, status)
  }
}

export const getMySessions = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthenticatedRequest).user.id
  const { page = 1, limit = 10 } = req.query as any
  const result = await sessionService.getUserSessions(userId, Number(page), Number(limit))
  sendSuccess(res, result)
}

export const getSession = async (req: Request, res: Response): Promise<void> => {
  const session = await sessionService.getSessionById(req.params.id)
  if (!session) { sendNotFound(res, 'Sessão não encontrada'); return }
  sendSuccess(res, { session })
}

export const getSessionByCode = async (req: Request, res: Response): Promise<void> => {
  const session = await sessionService.getSessionByCode(req.params.code.toUpperCase())
  if (!session) { sendNotFound(res, 'Código inválido'); return }
  sendSuccess(res, { session })
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

export const startSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = (req as AuthenticatedRequest).user.id
    const session = await sessionService.startSession(req.params.id, hostId)
    emitToSession(session!.id, EVENTS.SESSION_STARTED, { session })
    sendSuccess(res, { session }, 'Sessão iniciada!')
  } catch (err: any) {
    handleSessionError(res, err)
  }
}

export const pauseSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = (req as AuthenticatedRequest).user.id
    const session = await sessionService.pauseSession(req.params.id, hostId)
    emitToSession(session!.id, EVENTS.SESSION_PAUSED, { session })
    sendSuccess(res, { session }, 'Sessão pausada')
  } catch (err: any) {
    handleSessionError(res, err)
  }
}

export const resumeSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = (req as AuthenticatedRequest).user.id
    const session = await sessionService.resumeSession(req.params.id, hostId)
    emitToSession(session!.id, EVENTS.SESSION_RESUMED, { session })
    sendSuccess(res, { session }, 'Sessão retomada')
  } catch (err: any) {
    handleSessionError(res, err)
  }
}

export const completeSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = (req as AuthenticatedRequest).user.id
    const session = await sessionService.completeSession(req.params.id, hostId)
    emitToSession(session!.id, EVENTS.SESSION_COMPLETED, { session })
    sendSuccess(res, { session }, 'Sessão concluída')
  } catch (err: any) {
    handleSessionError(res, err)
  }
}

// ─── Characters ───────────────────────────────────────────────────────────────

export const assignCharacter = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = (req as AuthenticatedRequest).user.id
    const { participantId, characterId } = req.body
    const participant = await sessionService.assignCharacter(req.params.id, hostId, participantId, characterId)
    emitToSession(req.params.id, EVENTS.SESSION_UPDATED, { type: 'character_assigned', participant })
    sendSuccess(res, { participant }, 'Personagem atribuída')
  } catch (err: any) {
    if (err.message === 'CHARACTER_TAKEN') sendError(res, 'Esta personagem já está atribuída', 409)
    else handleSessionError(res, err)
  }
}

export const autoAssign = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = (req as AuthenticatedRequest).user.id
    const session = await sessionService.autoAssignCharacters(req.params.id, hostId)
    emitToSession(req.params.id, EVENTS.SESSION_UPDATED, { session })
    sendSuccess(res, { session }, 'Personagens distribuídas automaticamente')
  } catch (err: any) {
    handleSessionError(res, err)
  }
}

// ─── Stage Advancement ────────────────────────────────────────────────────────

export const advanceStage = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = (req as AuthenticatedRequest).user.id
    const { stageId } = req.body
    const session = await sessionService.advanceToStage(req.params.id, hostId, stageId)
    emitToSession(req.params.id, EVENTS.STAGE_ADVANCED, { session, newStageId: stageId })
    sendSuccess(res, { session }, 'Stage avançada')
  } catch (err: any) {
    if (err.message === 'STAGE_NOT_FOUND') sendError(res, 'Stage não encontrada', 404)
    else if (err.message === 'SESSION_NOT_ACTIVE') sendError(res, 'Sessão não está ativa', 400)
    else handleSessionError(res, err)
  }
}

// ─── Evidence ─────────────────────────────────────────────────────────────────

export const getEvidence = async (req: Request, res: Response): Promise<void> => {
  const evidence = await sessionService.getSessionEvidence(req.params.id)
  sendSuccess(res, { evidence })
}

export const unlockEvidence = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id
    const unlock = await sessionService.unlockEvidence(req.params.id, req.body.evidenceId, userId)
    emitToSession(req.params.id, EVENTS.EVIDENCE_UNLOCKED, { unlock })
    sendSuccess(res, { unlock }, 'Evidência desbloqueada')
  } catch (err: any) {
    if (err.message === 'SESSION_NOT_ACTIVE') sendError(res, 'Sessão não está ativa', 400)
    else if (err.message === 'EVIDENCE_NOT_FOUND') sendNotFound(res, 'Evidência não encontrada')
    else throw err
  }
}

// ─── Accusations ──────────────────────────────────────────────────────────────

export const submitAccusation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id
    const accusation = await sessionService.submitAccusation(req.params.id, userId, req.body)

    emitToSession(req.params.id, EVENTS.ACCUSATION_RESULT, {
      accusation,
      isCorrect: accusation.result === 'correct',
    })

    sendSuccess(res, { accusation }, accusation.result === 'correct'
      ? '🎉 Correto! Resolveste o caso!'
      : '❌ Incorreto. Tenta novamente.'
    )
  } catch (err: any) {
    const msgs: Record<string, string> = {
      NOT_LAST_STAGE:    'A acusação só pode ser submetida na última stage',
      SESSION_NOT_ACTIVE:'Sessão não está ativa',
      NOT_PARTICIPANT:   'Não és participante desta sessão',
    }
    sendError(res, msgs[err.message] ?? 'Erro ao submeter acusação', 400)
  }
}

export const getAccusations = async (req: Request, res: Response): Promise<void> => {
  const accusations = await sessionService.getSessionAccusations(req.params.id)
  sendSuccess(res, { accusations })
}

export const getResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const results = await sessionService.getSessionResults(req.params.id)
    sendSuccess(res, results)
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') sendNotFound(res, 'Sessão não encontrada')
    else throw err
  }
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminListSessions = async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 20, status } = req.query as any
  const result = await sessionService.adminListSessions({ page: Number(page), limit: Number(limit), status })
  sendSuccess(res, result)
}

// ─── Error handler ────────────────────────────────────────────────────────────

const handleSessionError = (res: Response, err: any) => {
  const msgs: Record<string, [string, number]> = {
    NOT_FOUND:      ['Sessão não encontrada', 404],
    NOT_HOST:       ['Apenas o host pode fazer isto', 403],
    INVALID_STATUS: ['Operação inválida para o estado atual da sessão', 400],
  }
  const [msg, status] = msgs[err.message] ?? ['Erro na sessão', 400]
  sendError(res, msg, status)
}
