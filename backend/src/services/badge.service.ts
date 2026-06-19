import { prisma } from '../config/prisma'
import { BadgeRarity } from '@prisma/client'

// ─── Badge criteria types ─────────────────────────────────────────────────────

interface BadgeCriteria {
  type: 'sessions_played' | 'sessions_solved' | 'correct_first' | 'evidence_found' |
        'total_xp' | 'level' | 'total_accusations' | 'specific_session'
  threshold?: number
  sessionId?: string
}

// ─── Seed default badges ──────────────────────────────────────────────────────

export const DEFAULT_BADGES = [
  {
    slug: 'first-blood',
    name: 'Primeiro Sangue',
    description: 'Completa a tua primeira investigação.',
    icon: '🩸',
    rarity: BadgeRarity.common,
    criteria: { type: 'sessions_played', threshold: 1 },
  },
  {
    slug: 'detective-rookie',
    name: 'Detetive Novato',
    description: 'Resolve o teu primeiro caso.',
    icon: '🔍',
    rarity: BadgeRarity.common,
    criteria: { type: 'sessions_solved', threshold: 1 },
  },
  {
    slug: 'sharp-eye',
    name: 'Olho Afiado',
    description: 'Resolve um caso na primeira tentativa.',
    icon: '👁️',
    rarity: BadgeRarity.uncommon,
    criteria: { type: 'correct_first', threshold: 1 },
  },
  {
    slug: 'evidence-collector',
    name: 'Colecionador de Pistas',
    description: 'Desbloqueia 50 evidências no total.',
    icon: '📎',
    rarity: BadgeRarity.uncommon,
    criteria: { type: 'evidence_found', threshold: 50 },
  },
  {
    slug: 'seasoned-detective',
    name: 'Detetive Experiente',
    description: 'Completa 10 investigações.',
    icon: '🎖️',
    rarity: BadgeRarity.rare,
    criteria: { type: 'sessions_played', threshold: 10 },
  },
  {
    slug: 'master-solver',
    name: 'Mestre Detetive',
    description: 'Resolve 10 casos corretamente.',
    icon: '🏆',
    rarity: BadgeRarity.rare,
    criteria: { type: 'sessions_solved', threshold: 10 },
  },
  {
    slug: 'perfectionist',
    name: 'Perfeccionista',
    description: 'Resolve 5 casos na primeira tentativa.',
    icon: '⭐',
    rarity: BadgeRarity.epic,
    criteria: { type: 'correct_first', threshold: 5 },
  },
  {
    slug: 'xp-1000',
    name: 'Mil Pontos',
    description: 'Acumula 1000 pontos de XP.',
    icon: '💫',
    rarity: BadgeRarity.common,
    criteria: { type: 'total_xp', threshold: 1000 },
  },
  {
    slug: 'xp-10000',
    name: 'Lenda das Investigações',
    description: 'Acumula 10.000 pontos de XP.',
    icon: '👑',
    rarity: BadgeRarity.legendary,
    criteria: { type: 'total_xp', threshold: 10000 },
  },
  {
    slug: 'level-5',
    name: 'Nível 5',
    description: 'Atinge o nível 5.',
    icon: '🌟',
    rarity: BadgeRarity.uncommon,
    criteria: { type: 'level', threshold: 5 },
  },
  {
    slug: 'level-10',
    name: 'Nível 10',
    description: 'Atinge o nível 10.',
    icon: '🔥',
    rarity: BadgeRarity.rare,
    criteria: { type: 'level', threshold: 10 },
  },
  {
    slug: 'evidence-hunter',
    name: 'Caçador de Pistas',
    description: 'Desbloqueia 200 evidências no total.',
    icon: '🗂️',
    rarity: BadgeRarity.epic,
    criteria: { type: 'evidence_found', threshold: 200 },
  },
]

// ─── Upsert all default badges ────────────────────────────────────────────────

export const seedBadges = async () => {
  for (const badge of DEFAULT_BADGES) {
    await prisma.badge.upsert({
      where: { slug: badge.slug },
      update: {},
      create: { ...badge, criteria: badge.criteria as any },
    })
  }
}

// ─── Check & award earned badges ─────────────────────────────────────────────

export const checkAndAwardBadges = async (
  userId: string,
  sessionId?: string
): Promise<Array<{ badge: any; isNew: boolean }>> => {
  const profile = await prisma.playerProfile.findUnique({ where: { userId } })
  if (!profile) return []

  const activeBadges = await prisma.badge.findMany({ where: { isActive: true } })
  const alreadyEarned = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeId: true },
  })
  const earnedIds = new Set(alreadyEarned.map((b) => b.badgeId))

  const toAward: any[] = []

  for (const badge of activeBadges) {
    if (earnedIds.has(badge.id)) continue
    const criteria = badge.criteria as BadgeCriteria

    let earned = false
    switch (criteria.type) {
      case 'sessions_played':
        earned = profile.sessionsPlayed >= (criteria.threshold ?? 0)
        break
      case 'sessions_solved':
        earned = profile.sessionsSolved >= (criteria.threshold ?? 0)
        break
      case 'correct_first':
        earned = profile.correctFirst >= (criteria.threshold ?? 0)
        break
      case 'evidence_found':
        earned = profile.evidenceFound >= (criteria.threshold ?? 0)
        break
      case 'total_xp':
        earned = profile.totalXp >= (criteria.threshold ?? 0)
        break
      case 'level':
        earned = profile.level >= (criteria.threshold ?? 0)
        break
      case 'total_accusations':
        earned = profile.totalAccusations >= (criteria.threshold ?? 0)
        break
    }

    if (earned) toAward.push({ badge, isNew: true })
  }

  if (toAward.length > 0) {
    await prisma.userBadge.createMany({
      data: toAward.map(({ badge }) => ({
        userId,
        badgeId: badge.id,
        sessionId: sessionId ?? null,
      })),
      skipDuplicates: true,
    })
  }

  return toAward
}

// ─── List all badges with earned status ──────────────────────────────────────

export const listBadgesForUser = async (userId: string) => {
  const [allBadges, earned] = await Promise.all([
    prisma.badge.findMany({ where: { isActive: true }, orderBy: [{ rarity: 'asc' }, { name: 'asc' }] }),
    prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { awardedAt: 'desc' },
    }),
  ])

  const earnedMap = new Map(earned.map((e) => [e.badgeId, e]))

  return allBadges.map((badge) => ({
    ...badge,
    earned: earnedMap.has(badge.id),
    awardedAt: earnedMap.get(badge.id)?.awardedAt ?? null,
  }))
}

// ─── Admin CRUD ───────────────────────────────────────────────────────────────

export const adminListBadges = async () => {
  return prisma.badge.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { awards: true } } },
  })
}

export const createBadge = async (data: any) => {
  return prisma.badge.create({ data })
}

export const updateBadge = async (id: string, data: any) => {
  return prisma.badge.update({ where: { id }, data })
}

export const deleteBadge = async (id: string) => {
  return prisma.badge.delete({ where: { id } })
}
