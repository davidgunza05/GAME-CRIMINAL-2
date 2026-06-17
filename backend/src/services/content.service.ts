import { prisma } from '../config/prisma'

// ─── Stages ───────────────────────────────────────────────────────────────────

export const getStagesByCase = async (caseId: string) => {
  return prisma.gameStage.findMany({
    where: { caseId },
    orderBy: { order: 'asc' },
    include: {
      evidence: {
        orderBy: { sortOrder: 'asc' },
        select: { id: true, title: true, type: true, isRedHerring: true, sortOrder: true },
      },
    },
  })
}

export const createStage = async (data: any) => {
  // Ensure only one isLast per case
  if (data.isLast) {
    await prisma.gameStage.updateMany({
      where: { caseId: data.caseId },
      data: { isLast: false },
    })
  }
  return prisma.gameStage.create({ data })
}

export const updateStage = async (id: string, data: any) => {
  if (data.isLast) {
    const stage = await prisma.gameStage.findUnique({ where: { id } })
    if (stage) {
      await prisma.gameStage.updateMany({
        where: { caseId: stage.caseId, id: { not: id } },
        data: { isLast: false },
      })
    }
  }
  return prisma.gameStage.update({ where: { id }, data })
}

export const deleteStage = async (id: string) => {
  return prisma.gameStage.delete({ where: { id } })
}

// ─── Characters ───────────────────────────────────────────────────────────────

export const getCharactersByCase = async (caseId: string) => {
  return prisma.character.findMany({
    where: { caseId },
    orderBy: { name: 'asc' },
  })
}

export const createCharacter = async (data: any) => {
  return prisma.character.create({ data })
}

export const updateCharacter = async (id: string, data: any) => {
  return prisma.character.update({ where: { id }, data })
}

export const deleteCharacter = async (id: string) => {
  return prisma.character.delete({ where: { id } })
}

// ─── Evidence ─────────────────────────────────────────────────────────────────

export const getEvidenceByCase = async (caseId: string) => {
  return prisma.evidence.findMany({
    where: { caseId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: { stage: { select: { id: true, title: true, order: true } } },
  })
}

export const createEvidence = async (data: any) => {
  return prisma.evidence.create({ data, include: { stage: true } })
}

export const updateEvidence = async (id: string, data: any) => {
  return prisma.evidence.update({ where: { id }, data })
}

export const deleteEvidence = async (id: string) => {
  return prisma.evidence.delete({ where: { id } })
}
