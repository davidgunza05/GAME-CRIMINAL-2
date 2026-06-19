import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export const useAnalytics = (days = 30) =>
  useQuery({
    queryKey: ['analytics', 'full', days],
    queryFn: async () => {
      const r = await api.get(`/analytics?days=${days}`)
      return r.data.data
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })

export const useAnalyticsKPIs = () =>
  useQuery({
    queryKey: ['analytics', 'kpis'],
    queryFn: async () => {
      const r = await api.get('/analytics/kpis')
      return r.data.data
    },
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  })

export const useActivityFeed = () =>
  useQuery({
    queryKey: ['analytics', 'feed'],
    queryFn: async () => {
      const r = await api.get('/analytics/feed')
      return r.data.data.feed
    },
    refetchInterval: 30 * 1000,
  })
