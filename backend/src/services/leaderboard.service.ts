import { prisma } from '../config/prisma'

// ─── Global leaderboard ───────────────────────────────────────────────────────

export const getGlobalLeaderboard = async (
  page = 1,
  limit = 20,
  sortBy: 'totalXp' | 'sessionsSolved' | 'correctFirst' | 'level' = 'totalXp'
) => {
  const skip = (page - 1) * limit

  const [profiles, total] = await prisma.$transaction([
    prisma.playerProfile.findMany({
      skip,
      take: limit,
      orderBy: { [sortBy]: 'desc' },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    }),
    prisma.playerProfile.count(),
  ])

  return {
    leaderboard: profiles.map((p, i) => ({ ...p, rank: skip + i + 1 })),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

// ─── Per-case leaderboard ─────────────────────────────────────────────────────

export const getCaseLeaderboard = async (caseId: string, limit = 10) => {
  // Best score per user for this case
  const results = await prisma.participant.groupBy({
    by: ['userId'],
    where: {
      session: { caseId, status: 'completed' },
      userId: { not: null },
    },
    _max: { score: true },
    orderBy: { _max: { score: 'desc' } },
    take: limit,
  })

  const userIds = results.map((r) => r.userId!).filter(Boolean)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, username: true, displayName: true, avatarUrl: true },
  })
  const userMap = new Map(users.map((u) => [u.id, u]))

  return results.map((r, i) => ({
    rank: i + 1,
    userId: r.userId,
    score: r._max.score ?? 0,
    user: r.userId ? userMap.get(r.userId) ?? null : null,
  }))
}

// ─── User rank ────────────────────────────────────────────────────────────────

export const getUserRank = async (userId: string) => {
  const profile = await prisma.playerProfile.findUnique({ where: { userId } })
  if (!profile) return null

  const rank = await prisma.playerProfile.count({
    where: { totalXp: { gt: profile.totalXp } },
  })

  return { rank: rank + 1, profile }
}
