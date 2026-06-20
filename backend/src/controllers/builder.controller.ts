import { Request, Response } from 'express'
import * as builderService from '../services/builder.service'
import { sendSuccess, sendCreated, sendError, sendNotFound, sendForbidden } from '../utils/response'
import { AuthenticatedRequest } from '../types'

// ─── My drafts ────────────────────────────────────────────────────────────────

export const getMySubmissions = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthenticatedRequest).user.id
  const { page = 1, limit = 10 } = req.query as any
  const data = await builderService.getMySubmissions(userId, Number(page), Number(limit))
  sendSuccess(res, data)
}

export const getMyCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id
    const data = await builderService.getMySubmissionByCaseId(req.params.caseId, userId)
    sendSuccess(res, { submission: data })
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') sendNotFound(res, 'Caso não encontrado')
    else throw err
  }
}

// ─── Create ───────────────────────────────────────────────────────────────────

export const createCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id
    const submission = await builderService.createDraftCase(userId, req.body)
    sendCreated(res, { submission }, 'Rascunho criado!')
  } catch (err: any) {
    if (err.message === 'SLUG_TAKEN') sendError(res, 'Este slug já está em uso', 409)
    else throw err
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id
    const submission = await builderService.updateDraftCase(req.params.caseId, userId, req.body)
    sendSuccess(res, { submission }, 'Caso atualizado')
  } catch (err: any) {
    const msgs: Record<string, [string, number]> = {
      NOT_FOUND:     ['Caso não encontrado', 404],
      FORBIDDEN:     ['Sem permissão para editar este caso', 403],
      NOT_EDITABLE:  ['Este caso não pode ser editado no estado atual', 400],
      SLUG_TAKEN:    ['Este slug já está em uso', 409],
    }
    const [msg, status] = msgs[err.message] ?? ['Erro ao atualizar', 400]
    sendError(res, msg, status)
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export const deleteCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id
    await builderService.deleteDraftCase(req.params.caseId, userId)
    sendSuccess(res, null, 'Rascunho eliminado')
  } catch (err: any) {
    const msgs: Record<string, [string, number]> = {
      NOT_FOUND:     ['Caso não encontrado', 404],
      FORBIDDEN:     ['Sem permissão para eliminar este caso', 403],
      NOT_DELETABLE: ['Só podes eliminar casos em rascunho ou rejeitados', 400],
    }
    const [msg, status] = msgs[err.message] ?? ['Erro ao eliminar', 400]
    sendError(res, msg, status)
  }
}

// ─── Validate ─────────────────────────────────────────────────────────────────

export const validateCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id
    // Verify ownership
    await builderService.getMySubmissionByCaseId(req.params.caseId, userId)
    const result = await builderService.validateCaseCompleteness(req.params.caseId)
    sendSuccess(res, result)
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') sendNotFound(res, 'Caso não encontrado')
    else throw err
  }
}

// ─── Submit ───────────────────────────────────────────────────────────────────

export const submitForReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id
    const submission = await builderService.submitForReview(req.params.caseId, userId)
    sendSuccess(res, { submission }, 'Caso submetido para revisão!')
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') { sendNotFound(res, 'Caso não encontrado'); return }
    if (err.message === 'FORBIDDEN') { sendForbidden(res, 'Sem permissão'); return }
    if (err.message === 'ALREADY_SUBMITTED') { sendError(res, 'Caso já foi submetido', 400); return }
    if (err.message?.startsWith('INCOMPLETE:')) {
      const errors = err.message.replace('INCOMPLETE:', '').split('|')
      sendError(res, 'O caso está incompleto', 422, { completeness: errors })
      return
    }
    throw err
  }
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const getCaseReviews = async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 10 } = req.query as any
  const data = await builderService.getCaseReviews(req.params.caseId, Number(page), Number(limit))
  sendSuccess(res, data)
}

export const submitReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id
    const { rating, comment } = req.body
    const review = await builderService.upsertReview(req.params.caseId, userId, rating, comment)
    sendSuccess(res, { review }, 'Review submetida!')
  } catch (err: any) {
    if (err.message === 'NOT_PLAYED') sendError(res, 'Tens de concluir este caso antes de fazer uma review', 403)
    else throw err
  }
}

// ─── Admin: moderation ────────────────────────────────────────────────────────

export const adminListSubmissions = async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 20, status, search } = req.query as any
  const data = await builderService.adminListSubmissions({ page: Number(page), limit: Number(limit), status, search })
  sendSuccess(res, data)
}

export const adminGetSubmission = async (req: Request, res: Response): Promise<void> => {
  const sub = await builderService.adminGetSubmission(req.params.id)
  if (!sub) { sendNotFound(res, 'Submissão não encontrada'); return }
  sendSuccess(res, { submission: sub })
}

export const adminModerate = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as AuthenticatedRequest).user.id
    const { action, comment, rejectionReason, changeRequests } = req.body
    const sub = await builderService.adminModerateSubmission(
      req.params.id, adminId, action,
      { comment, rejectionReason, changeRequests }
    )
    const msgs: Record<string, string> = {
      approve: 'Caso aprovado',
      reject: 'Caso rejeitado',
      request_changes: 'Alterações solicitadas',
      publish: 'Caso publicado!',
      unpublish: 'Caso despublicado',
    }
    sendSuccess(res, { submission: sub }, msgs[action] ?? 'Ação aplicada')
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') sendNotFound(res, 'Submissão não encontrada')
    else if (err.message === 'INVALID_ACTION') sendError(res, 'Ação inválida', 400)
    else throw err
  }
}
