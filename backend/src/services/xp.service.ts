import { prisma } from '../config/prisma'

// ─── XP Config ───────────────────────────────────────────────────────────────

export const XP_REWARDS = {
  SESSION_COMPLETED:       100,
  CASE_SOLVED_FIRST_TRY:   500,
  CASE_SOLVED:             300,
  CORRECT_ACCUSATION:      200,
  EVIDENCE_UNLOCKED:        10,
  PARTICIPATION:            50,
  SPEED_BONUS_UNDER_30MIN: 150,
  SPEED_BONUS_UNDER_60MIN:  75,
} as const

// XP thresholds per level (cumulative)
const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 900, 1400, 2100, 3000, 4200, 5700,
  7500, 9800, 12600, 16000, 20000, 25000, 31000, 38500, 47500, 58000,
]

export const xpToLevel = (xp: number): number => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}

export const xpToNextLevel = (xp: number): { current: number; needed: number; progress: number } => {
  const level = xpToLevel(xp)
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  const needed = nextThreshold - currentThreshold
  const progress = xp - currentThreshold
  return { current: progress, needed, progress: Math.min(100, Math.round((progress / needed) * 100)) }
}

// ─── Award XP ─────────────────────────────────────────────────────────────────

export const awardXP = async (
  userId: string,
  amount: number,
  reason: string,
  sessionId?: string,
  caseId?: string
) => {
  const [xpEvent, profile] = await prisma.$transaction(async (tx) => {
    const event = await tx.xpEvent.create({
      data: { userId, amount, reason, sessionId: sessionId ?? null, caseId: caseId ?? null },
    })

    // Upsert profile totals
    const existing = await tx.playerProfile.findUnique({ where: { userId } })
    const newTotal = (existing?.totalXp ?? 0) + amount
    const newLevel = xpToLevel(newTotal)

    const profile = await tx.playerProfile.upsert({
      where: { userId },
      create: { userId, totalXp: amount, level: newLevel },
      update: { totalXp: { increment: amount }, level: newLevel },
    })

    return [event, profile]
  })

  return { xpEvent, profile, leveledUp: profile.level > (profile.level - 1) }
}

// ─── Increment profile stats ──────────────────────────────────────────────────

export const incrementStats = async (
  userId: string,
  stats: {
    sessionsPlayed?: number
    sessionsSolved?: number
    totalAccusations?: number
    correctFirst?: number
    evidenceFound?: number
  }
) => {
  return prisma.playerProfile.upsert({
    where: { userId },
    create: {
      userId,
      totalXp: 0,
      level: 1,
      sessionsPlayed:   stats.sessionsPlayed ?? 0,
      sessionsSolved:   stats.sessionsSolved ?? 0,
      totalAccusations: stats.totalAccusations ?? 0,
      correctFirst:     stats.correctFirst ?? 0,
      evidenceFound:    stats.evidenceFound ?? 0,
    },
    update: {
      ...(stats.sessionsPlayed   && { sessionsPlayed:   { increment: stats.sessionsPlayed } }),
      ...(stats.sessionsSolved   && { sessionsSolved:   { increment: stats.sessionsSolved } }),
      ...(stats.totalAccusations && { totalAccusations: { increment: stats.totalAccusations } }),
      ...(stats.correctFirst     && { correctFirst:     { increment: stats.correctFirst } }),
      ...(stats.evidenceFound    && { evidenceFound:    { increment: stats.evidenceFound } }),
    },
  })
}

// ─── Get profile ──────────────────────────────────────────────────────────────

export const getPlayerProfile = async (userId: string) => {
  const profile = await prisma.playerProfile.upsert({
    where: { userId },
    create: { userId, totalXp: 0, level: 1 },
    update: {},
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  })

  const xpProgress = xpToNextLevel(profile.totalXp)
  const badges = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true },
    orderBy: { awardedAt: 'desc' },
  })
  const recentXp = await prisma.xpEvent.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return { profile, xpProgress, badges, recentXp }
}

export const getXpHistory = async (userId: string, page = 1, limit = 20) => {
  const skip = (page - 1) * limit
  const [events, total] = await prisma.$transaction([
    prisma.xpEvent.findMany({
      where: { userId },
      skip, take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.xpEvent.count({ where: { userId } }),
  ])
  return { events, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}
