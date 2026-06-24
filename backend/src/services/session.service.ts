import { prisma } from '../config/prisma'
import { SessionStatus } from '@prisma/client'
import { awardXP, incrementStats, XP_REWARDS } from './xp.service'
import { checkAndAwardBadges } from './badge.service'
import { sendSessionStarted, sendSessionCompleted } from './communication.service'
import { hasAccess } from './case-access.service'

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

  // 1. Validar caso publicado
  const caseRecord = await prisma.case.findFirst({
    where: { id: caseId, isPublished: true },
    include: { stages: { orderBy: { order: 'asc' }, take: 1 } },
  })
  if (!caseRecord) throw new Error('CASE_NOT_FOUND')

  // 2. Se caso é pago, verificar acesso
  const isPaid = caseRecord.priceDigital && Number(caseRecord.priceDigital) > 0
  if (isPaid) {
    // Admin tem acesso sempre
    const host = await prisma.user.findUnique({ where: { id: hostId }, select: { role: true } })
    if (host?.role !== 'admin') {
      const userHasAccess = await hasAccess(hostId, caseId)
      if (!userHasAccess) throw new Error('CASE_ACCESS_REQUIRED')
    }
  }

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

  // Auto-add host como participante
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

  const count = session.participants.length
  if (count >= session.case.maxPlayers) throw new Error('SESSION_FULL')

  if (userId) {
    const existing = session.participants.find((p) => p.userId === userId)
    if (existing) return getSessionById(session.id)

    await prisma.participant.create({
      data: { sessionId: session.id, userId, status: 'confirmed', joinedAt: new Date() },
    })
  } else if (guest) {
    await prisma.participant.create({
      data: {
        sessionId: session.id,
        guestName: guest.name,
        guestEmail: guest.email ?? null,
        guestPhone: guest.phone ?? null,
        status: 'confirmed',
        joinedAt: new Date(),
      },
    })
  }

  return getSessionById(session.id)
}

// ─── Get Sessions ─────────────────────────────────────────────────────────────

export const getUserSessions = async (userId: string, page = 1, limit = 10) => {
  const skip = (page - 1) * limit
  const where = {
    OR: [
      { hostId: userId },
      { participants: { some: { userId } } },
    ],
  }
  const [sessions, total] = await Promise.all([
    prisma.gameSession.findMany({
      where,
      include: {
        case: { select: { id: true, title: true, slug: true, coverImageUrl: true, difficulty: true } },
        participants: { select: { id: true, userId: true, guestName: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.gameSession.count({ where }),
  ])
  return { sessions, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }
}

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

// ─── Session Control ──────────────────────────────────────────────────────────

export const startSession = async (sessionId: string) => {
  return prisma.gameSession.update({
    where: { id: sessionId },
    data: { status: SessionStatus.active, startedAt: new Date() },
    include: fullSessionInclude(),
  })
}

export const pauseSession = async (sessionId: string) => {
  return prisma.gameSession.update({
    where: { id: sessionId },
    data: { status: SessionStatus.paused },
    include: fullSessionInclude(),
  })
}

export const resumeSession = async (sessionId: string) => {
  return prisma.gameSession.update({
    where: { id: sessionId },
    data: { status: SessionStatus.active },
    include: fullSessionInclude(),
  })
}

export const completeSession = async (sessionId: string) => {
  const session = await prisma.gameSession.update({
    where: { id: sessionId },
    data: { status: SessionStatus.completed, completedAt: new Date() },
    include: { participants: { include: { user: true } }, case: true },
  })

  // Award XP e badges a todos os participantes
  for (const p of session.participants) {
    if (!p.userId) continue
    await awardXP(p.userId, XP_REWARDS.SESSION_COMPLETE, 'session_complete', sessionId)
    await incrementStats(p.userId, { sessionsCompleted: 1 })
    await checkAndAwardBadges(p.userId)
  }

  try {
    await sendSessionCompleted(session as any)
  } catch {}

  return getSessionById(sessionId)
}

export const advanceStage = async (sessionId: string, stageId: string) => {
  return prisma.gameSession.update({
    where: { id: sessionId },
    data: { currentStageId: stageId },
    include: fullSessionInclude(),
  })
}

export const adminGetSessions = async (query: any) => {
  const { page = 1, limit = 20, status, search } = query
  const skip = (page - 1) * Number(limit)
  const where: any = {}
  if (status) where.status = status
  if (search) where.OR = [
    { accessCode: { contains: search, mode: 'insensitive' } },
    { case: { title: { contains: search, mode: 'insensitive' } } },
  ]
  const [sessions, total] = await Promise.all([
    prisma.gameSession.findMany({
      where,
      include: {
        case: { select: { id: true, title: true } },
        host: { select: { id: true, username: true, email: true } },
        participants: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.gameSession.count({ where }),
  ])
  return { sessions, meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fullSessionInclude = () => ({
  case: {
    select: {
      id: true, slug: true, title: true, coverImageUrl: true,
      difficulty: true, minPlayers: true, maxPlayers: true, estimatedMinutes: true,
    },
  },
  host: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
  participants: {
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true, role: true } },
      character: { select: { id: true, name: true, avatarUrl: true } },
    },
  },
  currentStage: { select: { id: true, title: true, order: true } },
})
