import { Request, Response } from 'express'
import * as caseService from '../services/case.service'
import * as accessService from '../services/case-access.service'
import { sendSuccess, sendCreated, sendError, sendNotFound } from '../utils/response'
import { AuthenticatedRequest } from '../types'

// ─── Public ───────────────────────────────────────────────────────────────────

export const listCases = async (req: Request, res: Response): Promise<void> => {
  const result = await caseService.listPublishedCases(req.query as any)
  sendSuccess(res, result)
}

export const getCaseBySlug = async (req: Request, res: Response): Promise<void> => {
  const c = await caseService.getPublishedCaseBySlug(req.params.slug)
  if (!c) { sendNotFound(res, 'Caso não encontrado'); return }
  sendSuccess(res, { case: c })
}

export const getFeaturedCases = async (req: Request, res: Response): Promise<void> => {
  const cases = await caseService.getFeaturedCases()
  sendSuccess(res, { cases })
}

export const getAllTags = async (_req: Request, res: Response): Promise<void> => {
  const tags = await caseService.getAllTags()
  sendSuccess(res, { tags })
}

// ─── Acesso do utilizador ─────────────────────────────────────────────────────

export const getMyCases = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthenticatedRequest).user.id
  const items = await accessService.getUserCases(userId)
  sendSuccess(res, { cases: items.map((i) => i.case) })
}

export const checkCaseAccess = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthenticatedRequest).user.id
  const c = await caseService.getPublishedCaseBySlug(req.params.slug)
  if (!c) { sendNotFound(res, 'Caso não encontrado'); return }

  const hasAccess = await accessService.hasAccess(userId, c.id)
  sendSuccess(res, { hasAccess })
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminListCases = async (req: Request, res: Response): Promise<void> => {
  const result = await caseService.adminListCases(req.query as any)
  sendSuccess(res, result)
}

export const adminGetCase = async (req: Request, res: Response): Promise<void> => {
  const c = await caseService.getCaseById(req.params.id)
  if (!c) { sendNotFound(res, 'Caso não encontrado'); return }
  sendSuccess(res, { case: c })
}

export const createCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const c = await caseService.createCase(req.body)
    sendCreated(res, { case: c }, 'Caso criado com sucesso')
  } catch (err: any) {
    if (err.message === 'SLUG_TAKEN') sendError(res, 'Este slug já está em uso', 409)
    else throw err
  }
}

export const updateCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const c = await caseService.updateCase(req.params.id, req.body)
    sendSuccess(res, { case: c }, 'Caso atualizado')
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') sendNotFound(res, 'Caso não encontrado')
    else if (err.message === 'SLUG_TAKEN') sendError(res, 'Este slug já está em uso', 409)
    else throw err
  }
}

export const deleteCase = async (req: Request, res: Response): Promise<void> => {
  try {
    await caseService.deleteCase(req.params.id)
    sendSuccess(res, null, 'Caso eliminado')
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') sendNotFound(res, 'Caso não encontrado')
    else throw err
  }
}

export const togglePublish = async (req: Request, res: Response): Promise<void> => {
  const c = await caseService.togglePublish(req.params.id, req.body.isPublished)
  sendSuccess(res, { case: c }, `Caso ${req.body.isPublished ? 'publicado' : 'despublicado'}`)
}

export const toggleFeatured = async (req: Request, res: Response): Promise<void> => {
  const c = await caseService.toggleFeatured(req.params.id, req.body.isFeatured)
  sendSuccess(res, { case: c }, `Caso ${req.body.isFeatured ? 'destacado' : 'removido dos destaques'}`)
}

export const adminGrantAccess = async (req: Request, res: Response): Promise<void> => {
  try {
    const { caseId } = req.params
    const { userId } = req.body
    await accessService.adminGrantAccess(userId, caseId)
    sendSuccess(res, null, 'Acesso concedido com sucesso')
  } catch (err: any) {
    sendError(res, 'Erro ao conceder acesso', 400)
  }
}
