import { prisma } from '../config/prisma'

// ─── Overview KPIs ────────────────────────────────────────────────────────────

export const getOverviewKPIs = async () => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const last7d  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000)

  const [
    totalUsers, newUsersMonth, newUsersLastMonth,
    totalOrders, ordersMonth, ordersLastMonth,
    totalRevenue, revenueMonth, revenueLastMonth,
    activeSessions, completedSessions, totalSessions,
    publishedCases, totalXpAwarded,
    newUsersLast7d, ordersLast7d,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),

    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.order.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),

    prisma.payment.aggregate({ where: { status: 'paid' }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: 'paid', paidAt: { gte: startOfMonth } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: 'paid', paidAt: { gte: startOfLastMonth, lte: endOfLastMonth } }, _sum: { amount: true } }),

    prisma.gameSession.count({ where: { status: 'active' } }),
    prisma.gameSession.count({ where: { status: 'completed' } }),
    prisma.gameSession.count(),

    prisma.case.count({ where: { isPublished: true } }),
    prisma.xpEvent.aggregate({ _sum: { amount: true } }),

    prisma.user.count({ where: { createdAt: { gte: last7d } } }),
    prisma.order.count({ where: { createdAt: { gte: last7d } } }),
  ])

  const pct = (current: number, previous: number) =>
    previous === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 100)

  return {
    users: {
      total: totalUsers,
      thisMonth: newUsersMonth,
      last7d: newUsersLast7d,
      pctChange: pct(newUsersMonth, newUsersLastMonth),
    },
    orders: {
      total: totalOrders,
      thisMonth: ordersMonth,
      last7d: ordersLast7d,
      pctChange: pct(ordersMonth, ordersLastMonth),
    },
    revenue: {
      total: Number(totalRevenue._sum.amount ?? 0),
      thisMonth: Number(revenueMonth._sum.amount ?? 0),
      pctChange: pct(
        Number(revenueMonth._sum.amount ?? 0),
        Number(revenueLastMonth._sum.amount ?? 0)
      ),
    },
    sessions: {
      total: totalSessions,
      active: activeSessions,
      completed: completedSessions,
      completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
    },
    cases: { published: publishedCases },
    xp: { totalAwarded: totalXpAwarded._sum.amount ?? 0 },
  }
}

// ─── Revenue over time ────────────────────────────────────────────────────────

export const getRevenueChart = async (days = 30) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const payments = await prisma.payment.findMany({
    where: { status: 'paid', paidAt: { gte: since } },
    select: { paidAt: true, amount: true },
    orderBy: { paidAt: 'asc' },
  })

  // Group by date
  const map = new Map<string, number>()
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 86400000)
    map.set(d.toISOString().slice(0, 10), 0)
  }
  for (const p of payments) {
    if (!p.paidAt) continue
    const key = p.paidAt.toISOString().slice(0, 10)
    map.set(key, (map.get(key) ?? 0) + Number(p.amount))
  }

  return Array.from(map.entries()).map(([date, revenue]) => ({ date, revenue }))
}

// ─── User registrations over time ────────────────────────────────────────────

export const getUserGrowthChart = async (days = 30) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const users = await prisma.user.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  const map = new Map<string, number>()
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 86400000)
    map.set(d.toISOString().slice(0, 10), 0)
  }
  for (const u of users) {
    const key = u.createdAt.toISOString().slice(0, 10)
    map.set(key, (map.get(key) ?? 0) + 1)
  }

  // Cumulative
  let cumulative = await prisma.user.count({ where: { createdAt: { lt: since } } })
  return Array.from(map.entries()).map(([date, newUsers]) => {
    cumulative += newUsers
    return { date, newUsers, total: cumulative }
  })
}

// ─── Sessions over time ───────────────────────────────────────────────────────

export const getSessionsChart = async (days = 30) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const sessions = await prisma.gameSession.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true, status: true },
    orderBy: { createdAt: 'asc' },
  })

  const map = new Map<string, { created: number; completed: number }>()
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 86400000)
    map.set(d.toISOString().slice(0, 10), { created: 0, completed: 0 })
  }
  for (const s of sessions) {
    const key = s.createdAt.toISOString().slice(0, 10)
    const entry = map.get(key) ?? { created: 0, completed: 0 }
    entry.created++
    if (s.status === 'completed') entry.completed++
    map.set(key, entry)
  }

  return Array.from(map.entries()).map(([date, v]) => ({ date, ...v }))
}

// ─── Stage completion rates ───────────────────────────────────────────────────

export const getStageCompletionRates = async () => {
  const cases = await prisma.case.findMany({
    where: { isPublished: true },
    include: {
      stages: { orderBy: { order: 'asc' } },
      sessions: { where: { status: 'completed' }, select: { id: true, currentStageId: true } },
    },
    take: 5,
  })

  return cases.map((c) => {
    const totalCompleted = c.sessions.length
    return {
      caseId: c.id,
      caseTitle: c.title,
      stages: c.stages.map((stage) => {
        const reachedCount = c.sessions.filter(
          (s) => s.currentStageId === stage.id || c.stages.findIndex(st => st.id === s.currentStageId) >= c.stages.findIndex(st => st.id === stage.id)
        ).length
        return {
          stageId: stage.id,
          title: stage.title,
          order: stage.order,
          isLast: stage.isLast,
          reachedCount,
          reachedPct: totalCompleted > 0 ? Math.round((reachedCount / totalCompleted) * 100) : 0,
        }
      }),
    }
  })
}

// ─── Top cases by revenue ─────────────────────────────────────────────────────

export const getTopCasesByRevenue = async (limit = 5) => {
  const items = await prisma.orderItem.groupBy({
    by: ['caseId'],
    _sum: { total: true },
    _count: { id: true },
    orderBy: { _sum: { total: 'desc' } },
    take: limit,
  })

  const caseIds = items.map((i) => i.caseId)
  const cases = await prisma.case.findMany({
    where: { id: { in: caseIds } },
    select: { id: true, title: true, coverImageUrl: true },
  })
  const caseMap = new Map(cases.map((c) => [c.id, c]))

  return items.map((item) => ({
    case: caseMap.get(item.caseId),
    revenue: Number(item._sum.total ?? 0),
    orders: item._count.id,
  }))
}

// ─── Most common accusations ──────────────────────────────────────────────────

export const getAccusationStats = async () => {
  const accusations = await prisma.accusation.groupBy({
    by: ['suspectId', 'result'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 20,
  })

  const suspectIds = [...new Set(accusations.map((a) => a.suspectId))]
  const characters = await prisma.character.findMany({
    where: { id: { in: suspectIds } },
    select: { id: true, name: true, isKiller: true },
  })
  const charMap = new Map(characters.map((c) => [c.id, c]))

  return accusations.map((a) => ({
    suspect: charMap.get(a.suspectId),
    result: a.result,
    count: a._count.id,
  }))
}

// ─── Drop-off points ──────────────────────────────────────────────────────────

export const getDropOffStats = async () => {
  const [pending, active, paused, completed, cancelled] = await Promise.all([
    prisma.gameSession.count({ where: { status: 'pending' } }),
    prisma.gameSession.count({ where: { status: 'active' } }),
    prisma.gameSession.count({ where: { status: 'paused' } }),
    prisma.gameSession.count({ where: { status: 'completed' } }),
    prisma.gameSession.count({ where: { status: 'cancelled' } }),
  ])

  const total = pending + active + paused + completed + cancelled

  return [
    { status: 'Pendente',    count: pending,   pct: total > 0 ? Math.round((pending / total) * 100) : 0 },
    { status: 'Ativa',       count: active,    pct: total > 0 ? Math.round((active / total) * 100) : 0 },
    { status: 'Pausada',     count: paused,    pct: total > 0 ? Math.round((paused / total) * 100) : 0 },
    { status: 'Concluída',   count: completed, pct: total > 0 ? Math.round((completed / total) * 100) : 0 },
    { status: 'Cancelada',   count: cancelled, pct: total > 0 ? Math.round((cancelled / total) * 100) : 0 },
  ]
}

// ─── Player retention ─────────────────────────────────────────────────────────

export const getPlayerRetention = async () => {
  const [played1, played2to5, played6to10, playedMore] = await Promise.all([
    prisma.playerProfile.count({ where: { sessionsPlayed: 1 } }),
    prisma.playerProfile.count({ where: { sessionsPlayed: { gte: 2, lte: 5 } } }),
    prisma.playerProfile.count({ where: { sessionsPlayed: { gte: 6, lte: 10 } } }),
    prisma.playerProfile.count({ where: { sessionsPlayed: { gt: 10 } } }),
  ])

  return [
    { label: '1 sessão',      count: played1,      color: '#C0392B' },
    { label: '2–5 sessões',   count: played2to5,   color: '#E67E22' },
    { label: '6–10 sessões',  count: played6to10,  color: '#2980B9' },
    { label: '10+ sessões',   count: playedMore,   color: '#27AE60' },
  ]
}

// ─── Recent activity feed ─────────────────────────────────────────────────────

export const getActivityFeed = async (limit = 15) => {
  const [recentUsers, recentOrders, recentSessions, recentAccusations] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' }, take: 5,
      select: { username: true, email: true, createdAt: true, role: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' }, take: 5,
      select: {
        orderNumber: true, total: true, status: true, createdAt: true,
        user: { select: { username: true } },
      },
    }),
    prisma.gameSession.findMany({
      orderBy: { createdAt: 'desc' }, take: 5,
      select: {
        accessCode: true, status: true, createdAt: true,
        case: { select: { title: true } },
        host: { select: { username: true } },
      },
    }),
    prisma.accusation.findMany({
      orderBy: { createdAt: 'desc' }, take: 5,
      select: {
        result: true, createdAt: true,
        suspect: { select: { name: true } },
        participant: { include: { user: { select: { username: true } } } },
      },
    }),
  ])

  const events: Array<{ type: string; label: string; sub: string; time: Date; color: string }> = []

  for (const u of recentUsers) {
    events.push({ type: 'user', label: `Novo utilizador: @${u.username}`, sub: u.email, time: u.createdAt, color: '#2980B9' })
  }
  for (const o of recentOrders) {
    events.push({ type: 'order', label: `Encomenda ${o.orderNumber}`, sub: `€${Number(o.total).toFixed(2)} · @${o.user?.username}`, time: o.createdAt, color: '#27AE60' })
  }
  for (const s of recentSessions) {
    events.push({ type: 'session', label: `Sessão: ${s.case?.title}`, sub: `Código ${s.accessCode} · @${s.host?.username}`, time: s.createdAt, color: '#8E44AD' })
  }
  for (const a of recentAccusations) {
    const isCorrect = a.result === 'correct'
    events.push({
      type: 'accusation',
      label: `Acusação ${isCorrect ? '✅' : '❌'}: ${a.suspect?.name}`,
      sub: `@${a.participant?.user?.username}`,
      time: a.createdAt,
      color: isCorrect ? '#27AE60' : '#C0392B',
    })
  }

  return events.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, limit)
}

// ─── Average session time ─────────────────────────────────────────────────────

export const getAvgSessionTime = async () => {
  const sessions = await prisma.gameSession.findMany({
    where: { status: 'completed', startedAt: { not: null }, completedAt: { not: null } },
    select: { startedAt: true, completedAt: true },
    take: 200,
  })

  if (sessions.length === 0) return { avgMinutes: 0, sessions: 0 }

  const totalMs = sessions.reduce((sum, s) => {
    return sum + (s.completedAt!.getTime() - s.startedAt!.getTime())
  }, 0)

  return {
    avgMinutes: Math.round(totalMs / sessions.length / 60000),
    sessions: sessions.length,
  }
}

// ─── Full analytics bundle ────────────────────────────────────────────────────

export const getFullAnalytics = async (days = 30) => {
  const [
    kpis, revenueChart, userGrowth, sessionsChart,
    stageCompletion, topCases, accusationStats,
    dropOff, retention, activityFeed, avgSessionTime,
  ] = await Promise.all([
    getOverviewKPIs(),
    getRevenueChart(days),
    getUserGrowthChart(days),
    getSessionsChart(days),
    getStageCompletionRates(),
    getTopCasesByRevenue(),
    getAccusationStats(),
    getDropOffStats(),
    getPlayerRetention(),
    getActivityFeed(),
    getAvgSessionTime(),
  ])

  return {
    kpis, revenueChart, userGrowth, sessionsChart,
    stageCompletion, topCases, accusationStats,
    dropOff, retention, activityFeed, avgSessionTime,
    generatedAt: new Date().toISOString(),
  }
}
