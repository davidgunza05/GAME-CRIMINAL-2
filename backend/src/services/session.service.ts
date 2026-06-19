import { prisma } from '../config/prisma'
import { SessionStatus } from '@prisma/client'
import { awardXP, incrementStats, XP_REWARDS } from './xp.service'
import { checkAndAwardBadges } from './badge.service'
import { sendSessionStarted, sendSessionCompleted } from './communication.service'

// ─── Access code generator ────────────────────────────────────────────────────

const generateAccessCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

const uniqueAccessCode = async (): Promise<string> => {
  let code = generateAccessCode()
  let tries = 0
  while (tries < 10) {
    const exists = await prisma.gameSession.findUnique({ where: { accessCode: code } })
    if (!exists) return code
    code = generateAccessCode()
    tries++
  }
  throw new Error('Could not generate unique access code')
}

// ─── Create Session ───────────────────────────────────────────────────────────

export const createSession = async (hostId: string, input: any) => {
  const { caseId, mode, scheduledAt, estimatedMinutes, location, meetingUrl, notes } = input

  // Validate case exists and is published
  const caseRecord = await prisma.case.findFirst({
    where: { id: caseId, isPublished: true },
    include: { stages: { orderBy: { order: 'asc' }, take: 1 } },
  })
  if (!caseRecord) throw new Error('CASE_NOT_FOUND')

  const accessCode = await uniqueAccessCode()
  const firstStage = caseRecord.stages[0]

  const session = await prisma.gameSession.create({
    data: {
      caseId,
      hostId,
      mode,
      accessCode,
      currentStageId: firstStage?.id ?? null,
      scheduledAt: scheduledAt ?? null,
      estimatedMinutes: estimatedMinutes ?? caseRecord.estimatedMinutes,
      location: location ?? null,
      meetingUrl: meetingUrl ?? null,
      notes: notes ?? null,
    },
    include: fullSessionInclude(),
  })

  // Auto-add host as participant
  await prisma.participant.create({
    data: { sessionId: session.id, userId: hostId, status: 'confirmed', joinedAt: new Date() },
  })

  return getSessionById(session.id)
}

// ─── Join Session by Code ─────────────────────────────────────────────────────

export const joinSessionByCode = async (
  accessCode: string,
  userId?: string,
  guest?: { name: string; email?: string; phone?: string }
) => {
  const session = await prisma.gameSession.findUnique({
    where: { accessCode },
    include: { case: { select: { maxPlayers: true, title: true } }, participants: true },
  })

  if (!session) throw new Error('SESSION_NOT_FOUND')
  if (session.status === 'completed' || session.status === 'cancelled') throw new Error('SESSION_CLOSED')
  if (session.participants.length >= session.case.maxPlayers) throw new Error('SESSION_FULL')

  // Check if user already in session
  if (userId) {
    const exists = session.participants.find((p) => p.userId === userId)
    if (exists) return getSessionById(session.id)
  }

  await prisma.participant.create({
    data: {
      sessionId: session.id,
      userId: userId ?? null,
      status: 'confirmed',
      joinedAt: new Date(),
      guestName: guest?.name ?? null,
      guestEmail: guest?.email ?? null,
      guestPhone: guest?.phone ?? null,
    },
  })

  return getSessionById(session.id)
}

// ─── Get Sessions ─────────────────────────────────────────────────────────────

export const getSessionById = async (id: string) => {
  return prisma.gameSession.findUnique({
    where: { id },
    include: fullSessionInclude(),
  })
}

export const getSessionByCode = async (code: string) => {
  return prisma.gameSession.findUnique({
    where: { accessCode: code },
    include: fullSessionInclude(),
  })
}

export const getUserSessions = async (userId: string, page = 1, limit = 10) => {
  const skip = (page - 1) * limit

  const [sessions, total] = await prisma.$transaction([
    prisma.gameSession.findMany({
      where: {
        OR: [
          { hostId: userId },
          { participants: { some: { userId } } },
        ],
      },
      skip, take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        case: { select: { id: true, title: true, slug: true, coverImageUrl: true, difficulty: true } },
        participants: { select: { id: true, status: true, userId: true, character: { select: { name: true } } } },
        currentStage: { select: { id: true, title: true, order: true } },
      },
    }),
    prisma.gameSession.count({
      where: { OR: [{ hostId: userId }, { participants: { some: { userId } } }] },
    }),
  ])

  return { sessions, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

export const adminListSessions = async (opts: { page: number; limit: number; status?: string }) => {
  const { page, limit, status } = opts
  const skip = (page - 1) * limit
  const where: any = {}
  if (status) where.status = status

  const [sessions, total] = await prisma.$transaction([
    prisma.gameSession.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        case: { select: { title: true } },
        host: { select: { username: true, email: true } },
        participants: { select: { id: true } },
      },
    }),
    prisma.gameSession.count({ where }),
  ])

  return { sessions, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

// ─── Session Lifecycle ────────────────────────────────────────────────────────

export const startSession = async (sessionId: string, hostId: string) => {
  const session = await prisma.gameSession.findUnique({ where: { id: sessionId } })
  if (!session) throw new Error('NOT_FOUND')
  if (session.hostId !== hostId) throw new Error('NOT_HOST')
  if (session.status !== 'pending') throw new Error('INVALID_STATUS')

  // Auto-unlock all evidence for first stage
  if (session.currentStageId) {
    const stageEvidence = await prisma.evidence.findMany({
      where: { stageId: session.currentStageId },
    })
    if (stageEvidence.length > 0) {
      await prisma.evidenceUnlock.createMany({
        data: stageEvidence.map((e) => ({ sessionId, evidenceId: e.id })),
        skipDuplicates: true,
      })
    }
  }

  // Award participation XP to all participants
  const participants_list = await prisma.participant.findMany({ where: { sessionId, userId: { not: null } } })
  for (const p of participants_list) {
    if (p.userId) {
      await awardXP(p.userId, XP_REWARDS.PARTICIPATION, 'Participação em sessão', sessionId, session.caseId)
      await incrementStats(p.userId, { sessionsPlayed: 1 })
    }
  }

  // Fire started emails (non-blocking)
  prisma.gameSession.findUnique({
    where: { id: sessionId },
    include: {
      case: { select: { title: true } },
      participants: { include: { user: { select: { email: true, displayName: true, username: true } } } },
    },
  }).then((s) => {
    if (!s) return
    for (const p of s.participants) {
      if (p.user?.email && p.userId !== s.hostId) {
        sendSessionStarted({
          to: p.user.email,
          toName: p.user.displayName || p.user.username,
          caseTitle: s.case.title,
          sessionId: s.id,
          userId: p.userId ?? undefined,
        }).catch(() => {})
      }
    }
  }).catch(() => {})

  return prisma.gameSession.update({
    where: { id: sessionId },
    data: { status: 'active', startedAt: new Date() },
    include: fullSessionInclude(),
  })
}

export const pauseSession = async (sessionId: string, hostId: string) => {
  const session = await prisma.gameSession.findUnique({ where: { id: sessionId } })
  if (!session || session.hostId !== hostId) throw new Error('NOT_HOST')
  if (session.status !== 'active') throw new Error('INVALID_STATUS')
  return prisma.gameSession.update({ where: { id: sessionId }, data: { status: 'paused' }, include: fullSessionInclude() })
}

export const resumeSession = async (sessionId: string, hostId: string) => {
  const session = await prisma.gameSession.findUnique({ where: { id: sessionId } })
  if (!session || session.hostId !== hostId) throw new Error('NOT_HOST')
  if (session.status !== 'paused') throw new Error('INVALID_STATUS')
  return prisma.gameSession.update({ where: { id: sessionId }, data: { status: 'active' }, include: fullSessionInclude() })
}

export const completeSession = async (sessionId: string, hostId: string) => {
  const session = await prisma.gameSession.findUnique({ where: { id: sessionId } })
  if (!session || session.hostId !== hostId) throw new Error('NOT_HOST')
  return prisma.gameSession.update({
    where: { id: sessionId },
    data: { status: 'completed', completedAt: new Date() },
    include: fullSessionInclude(),
  })
}

// ─── Assign Character ─────────────────────────────────────────────────────────

export const assignCharacter = async (sessionId: string, hostId: string, participantId: string, characterId: string) => {
  const session = await prisma.gameSession.findUnique({ where: { id: sessionId } })
  if (!session || session.hostId !== hostId) throw new Error('NOT_HOST')

  // Check character not already assigned in this session
  const alreadyAssigned = await prisma.participant.findFirst({
    where: { sessionId, characterId, id: { not: participantId } },
  })
  if (alreadyAssigned) throw new Error('CHARACTER_TAKEN')

  return prisma.participant.update({
    where: { id: participantId },
    data: { characterId },
    include: { character: true, user: { select: { username: true, displayName: true, avatarUrl: true } } },
  })
}

export const autoAssignCharacters = async (sessionId: string, hostId: string) => {
  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
    include: {
      participants: true,
      case: { include: { characters: true } },
    },
  })
  if (!session || session.hostId !== hostId) throw new Error('NOT_HOST')

  const participants = session.participants.filter((p) => !p.characterId)
  const characters = [...session.case.characters].sort(() => Math.random() - 0.5)

  await Promise.all(
    participants.map((p, i) => {
      const char = characters[i % characters.length]
      if (!char) return null
      return prisma.participant.update({ where: { id: p.id }, data: { characterId: char.id } })
    })
  )

  return getSessionById(sessionId)
}

// ─── Stage Advancement ────────────────────────────────────────────────────────

export const advanceToStage = async (sessionId: string, hostId: string, stageId: string) => {
  const session = await prisma.gameSession.findUnique({ where: { id: sessionId } })
  if (!session || session.hostId !== hostId) throw new Error('NOT_HOST')
  if (session.status !== 'active') throw new Error('SESSION_NOT_ACTIVE')

  // Validate stage belongs to case
  const stage = await prisma.gameStage.findFirst({ where: { id: stageId, caseId: session.caseId } })
  if (!stage) throw new Error('STAGE_NOT_FOUND')

  // Unlock all evidence for this stage
  const stageEvidence = await prisma.evidence.findMany({ where: { stageId } })
  if (stageEvidence.length > 0) {
    await prisma.evidenceUnlock.createMany({
      data: stageEvidence.map((e) => ({ sessionId, evidenceId: e.id })),
      skipDuplicates: true,
    })
  }

  return prisma.gameSession.update({
    where: { id: sessionId },
    data: { currentStageId: stageId },
    include: fullSessionInclude(),
  })
}

// ─── Evidence Unlock ─────────────────────────────────────────────────────────

export const unlockEvidence = async (sessionId: string, evidenceId: string, userId?: string) => {
  const session = await prisma.gameSession.findUnique({ where: { id: sessionId } })
  if (!session || session.status !== 'active') throw new Error('SESSION_NOT_ACTIVE')

  const evidence = await prisma.evidence.findFirst({ where: { id: evidenceId, caseId: session.caseId } })
  if (!evidence) throw new Error('EVIDENCE_NOT_FOUND')

  return prisma.evidenceUnlock.upsert({
    where: { sessionId_evidenceId: { sessionId, evidenceId } },
    create: { sessionId, evidenceId, unlockedById: userId ?? null },
    update: {},
  })
}

export const getSessionEvidence = async (sessionId: string) => {
  const session = await prisma.gameSession.findUnique({ where: { id: sessionId } })
  if (!session) throw new Error('NOT_FOUND')

  const unlocked = await prisma.evidenceUnlock.findMany({
    where: { sessionId },
    include: {
      evidence: true,
      unlockedBy: { select: { username: true } },
    },
  })

  return unlocked
}

// ─── Accusation ───────────────────────────────────────────────────────────────

export const submitAccusation = async (
  sessionId: string,
  userId: string,
  input: { suspectId: string; motive: string; method: string; evidenceCited: string[] }
) => {
  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
    include: {
      currentStage: true,
      case: { include: { stages: { where: { isLast: true } }, characters: { where: { isKiller: true } } } },
    },
  })
  if (!session) throw new Error('NOT_FOUND')
  if (session.status !== 'active') throw new Error('SESSION_NOT_ACTIVE')

  // Accusation only allowed on last stage
  const lastStage = session.case.stages[0]
  if (!lastStage || session.currentStageId !== lastStage.id) throw new Error('NOT_LAST_STAGE')

  const participant = await prisma.participant.findFirst({ where: { sessionId, userId } })
  if (!participant) throw new Error('NOT_PARTICIPANT')

  // Count previous attempts
  const prevAttempts = await prisma.accusation.count({ where: { sessionId, participantId: participant.id } })

  // Validate accusation
  const killer = session.case.characters.find((c) => c.isKiller)
  const isCorrect = killer?.id === input.suspectId
  const result = isCorrect ? 'correct' : 'incorrect'

  const feedbackText = isCorrect
    ? `Correto! ${killer?.name} era realmente o culpado. ${killer?.secrets}`
    : `Incorreto. ${killer?.alibi ?? 'O suspeito tem um álibi sólido.'}. Tenta novamente.`

  // Calculate score if correct
  if (isCorrect) {
    const timeBonus = Math.max(0, 1000 - prevAttempts * 200)
    await prisma.participant.update({
      where: { id: participant.id },
      data: { score: { increment: timeBonus + 500 } },
    })
  }

  const accusation = await prisma.accusation.create({
    data: {
      sessionId,
      participantId: participant.id,
      suspectId: input.suspectId,
      motive: input.motive,
      method: input.method,
      evidenceCited: input.evidenceCited,
      result,
      feedbackText,
      attemptNumber: prevAttempts + 1,
    },
    include: {
      suspect: { select: { id: true, name: true, avatarUrl: true } },
      participant: { include: { user: { select: { username: true } } } },
    },
  })

  // Award XP and check badges if correct
  if (isCorrect) {
    const isFirstTry = prevAttempts === 0
    const xpAmount = isFirstTry ? XP_REWARDS.CASE_SOLVED_FIRST_TRY : XP_REWARDS.CASE_SOLVED
    await awardXP(userId, xpAmount, isFirstTry ? 'Caso resolvido na primeira tentativa!' : 'Caso resolvido', sessionId, session.caseId)
    await awardXP(userId, XP_REWARDS.CORRECT_ACCUSATION, 'Acusação correta', sessionId)
    await incrementStats(userId, {
      sessionsSolved: 1,
      totalAccusations: 1,
      correctFirst: isFirstTry ? 1 : 0,
    })
    await checkAndAwardBadges(userId, sessionId)
  } else {
    await incrementStats(userId, { totalAccusations: 1 })
  }

  // Auto-complete session if correct
  if (isCorrect) {
    await prisma.gameSession.update({
      where: { id: sessionId },
      data: { status: 'completed', completedAt: new Date() },
    })
  }

  return accusation
}

export const getSessionAccusations = async (sessionId: string) => {
  return prisma.accusation.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
    include: {
      suspect: { select: { id: true, name: true, avatarUrl: true } },
      participant: {
        include: {
          user: { select: { username: true, displayName: true, avatarUrl: true } },
          character: { select: { name: true } },
        },
      },
    },
  })
}

export const getSessionResults = async (sessionId: string) => {
  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
    include: {
      case: {
        include: {
          characters: true,
          stages: { orderBy: { order: 'asc' } },
        },
      },
      participants: {
        orderBy: { score: 'desc' },
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          character: true,
          accusations: { orderBy: { createdAt: 'asc' } },
        },
      },
    },
  })
  if (!session) throw new Error('NOT_FOUND')

  const killer = session.case.characters.find((c) => c.isKiller)
  const unlockedCount = await prisma.evidenceUnlock.count({ where: { sessionId } })
  const totalEvidence = await prisma.evidence.count({ where: { caseId: session.caseId } })

  return { session, killer, stats: { unlockedEvidence: unlockedCount, totalEvidence } }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fullSessionInclude = () => ({
  case: {
    select: {
      id: true, title: true, slug: true, coverImageUrl: true,
      difficulty: true, minPlayers: true, maxPlayers: true,
    },
  },
  host: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
  currentStage: {
    include: {
      evidence: { select: { id: true, title: true, type: true, isRedHerring: true } },
    },
  },
  participants: {
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      character: {
        select: { id: true, name: true, description: true, avatarUrl: true, isKiller: true, isDetective: true },
      },
    },
  },
})
