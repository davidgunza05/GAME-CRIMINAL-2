import { Request, Response } from 'express'
import * as contentService from '../services/content.service'
import { sendSuccess, sendCreated, sendError, sendNotFound } from '../utils/response'

// ─── Stages ───────────────────────────────────────────────────────────────────

export const getStages = async (req: Request, res: Response): Promise<void> => {
  const stages = await contentService.getStagesByCase(req.params.caseId)
  sendSuccess(res, { stages })
}

export const createStage = async (req: Request, res: Response): Promise<void> => {
  const stage = await contentService.createStage({ ...req.body, caseId: req.params.caseId })
  sendCreated(res, { stage }, 'Stage criada')
}

export const updateStage = async (req: Request, res: Response): Promise<void> => {
  const stage = await contentService.updateStage(req.params.id, req.body)
  sendSuccess(res, { stage }, 'Stage atualizada')
}

export const deleteStage = async (req: Request, res: Response): Promise<void> => {
  await contentService.deleteStage(req.params.id)
  sendSuccess(res, null, 'Stage eliminada')
}

// ─── Characters ───────────────────────────────────────────────────────────────

export const getCharacters = async (req: Request, res: Response): Promise<void> => {
  const characters = await contentService.getCharactersByCase(req.params.caseId)
  sendSuccess(res, { characters })
}

export const createCharacter = async (req: Request, res: Response): Promise<void> => {
  const character = await contentService.createCharacter({ ...req.body, caseId: req.params.caseId })
  sendCreated(res, { character }, 'Personagem criada')
}

export const updateCharacter = async (req: Request, res: Response): Promise<void> => {
  const character = await contentService.updateCharacter(req.params.id, req.body)
  sendSuccess(res, { character }, 'Personagem atualizada')
}

export const deleteCharacter = async (req: Request, res: Response): Promise<void> => {
  await contentService.deleteCharacter(req.params.id)
  sendSuccess(res, null, 'Personagem eliminada')
}

// ─── Evidence ─────────────────────────────────────────────────────────────────

export const getEvidence = async (req: Request, res: Response): Promise<void> => {
  const evidence = await contentService.getEvidenceByCase(req.params.caseId)
  sendSuccess(res, { evidence })
}

export const createEvidence = async (req: Request, res: Response): Promise<void> => {
  const evidence = await contentService.createEvidence({ ...req.body, caseId: req.params.caseId })
  sendCreated(res, { evidence }, 'Evidência criada')
}

export const updateEvidence = async (req: Request, res: Response): Promise<void> => {
  const evidence = await contentService.updateEvidence(req.params.id, req.body)
  sendSuccess(res, { evidence }, 'Evidência atualizada')
}

export const deleteEvidence = async (req: Request, res: Response): Promise<void> => {
  await contentService.deleteEvidence(req.params.id)
  sendSuccess(res, null, 'Evidência eliminada')
}
