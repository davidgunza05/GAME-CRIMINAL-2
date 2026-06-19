import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

// ─── My gamification profile ──────────────────────────────────────────────────

export const useMyGamificationProfile = () =>
  useQuery({
    queryKey: ['game', 'profile', 'me'],
    queryFn: async () => {
      const r = await api.get('/game/profile/me')
      return r.data.data
    },
    staleTime: 30 * 1000,
  })

export const useMyXpHistory = (page = 1) =>
  useQuery({
    queryKey: ['game', 'xp', 'history', page],
    queryFn: async () => {
      const r = await api.get(`/game/profile/me/xp?page=${page}`)
      return r.data.data
    },
  })

export const useMyRank = () =>
  useQuery({
    queryKey: ['game', 'rank', 'me'],
    queryFn: async () => {
      const r = await api.get('/game/profile/me/rank')
      return r.data.data
    },
  })

export const useMyBadges = () =>
  useQuery({
    queryKey: ['game', 'badges', 'me'],
    queryFn: async () => {
      const r = await api.get('/game/profile/me/badges')
      return r.data.data.badges
    },
  })

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export const useGlobalLeaderboard = (
  page = 1,
  sortBy: 'totalXp' | 'sessionsSolved' | 'correctFirst' | 'level' = 'totalXp'
) =>
  useQuery({
    queryKey: ['game', 'leaderboard', 'global', page, sortBy],
    queryFn: async () => {
      const r = await api.get(`/game/leaderboard/global?page=${page}&limit=20&sortBy=${sortBy}`)
      return r.data.data
    },
    staleTime: 60 * 1000,
  })

export const useCaseLeaderboard = (caseId: string) =>
  useQuery({
    queryKey: ['game', 'leaderboard', 'case', caseId],
    queryFn: async () => {
      const r = await api.get(`/game/leaderboard/case/${caseId}?limit=10`)
      return r.data.data.leaderboard
    },
    enabled: !!caseId,
  })

// ─── Public user profile ──────────────────────────────────────────────────────

export const useUserGamificationProfile = (userId: string) =>
  useQuery({
    queryKey: ['game', 'profile', userId],
    queryFn: async () => {
      const r = await api.get(`/game/profile/${userId}`)
      return r.data.data
    },
    enabled: !!userId,
  })
