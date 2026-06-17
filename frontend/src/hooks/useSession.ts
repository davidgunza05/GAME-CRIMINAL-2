import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import api from '@/lib/api'

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const useMySessions = (page = 1) =>
  useQuery({
    queryKey: ['sessions', 'my', page],
    queryFn: async () => { const r = await api.get(`/sessions/my?page=${page}`); return r.data.data },
  })

export const useSession = (id: string) =>
  useQuery({
    queryKey: ['sessions', id],
    queryFn: async () => { const r = await api.get(`/sessions/${id}`); return r.data.data.session },
    enabled: !!id,
    refetchInterval: false,
  })

export const useSessionByCode = (code: string) =>
  useQuery({
    queryKey: ['sessions', 'code', code],
    queryFn: async () => { const r = await api.get(`/sessions/code/${code}`); return r.data.data.session },
    enabled: !!code && code.length === 8,
  })

export const useCreateSession = () => {
  const router = useRouter()
  return useMutation({
    mutationFn: async (data: any) => { const r = await api.post('/sessions', data); return r.data.data.session },
    onSuccess: (s) => { toast.success('Sessão criada!'); router.push(`/dashboard/sessions/${s.id}/lobby`) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erro ao criar sessão'),
  })
}

export const useJoinSession = () => {
  const router = useRouter()
  return useMutation({
    mutationFn: async (data: any) => { const r = await api.post('/sessions/join', data); return r.data.data.session },
    onSuccess: (s) => { toast.success(`Bem-vindo à sessão!`); router.push(`/dashboard/sessions/${s.id}/lobby`) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Código inválido'),
  })
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

const lifecycleMutation = (endpoint: string, msg: string) => () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => { const r = await api.post(`/sessions/${id}/${endpoint}`); return r.data.data.session },
    onSuccess: (s) => { qc.setQueryData(['sessions', s.id], s); toast.success(msg) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erro'),
  })
}

export const useStartSession    = lifecycleMutation('start',    'Sessão iniciada!')
export const usePauseSession    = lifecycleMutation('pause',    'Sessão pausada')
export const useResumeSession   = lifecycleMutation('resume',   'Sessão retomada')
export const useCompleteSession = lifecycleMutation('complete', 'Sessão concluída')

// ─── Characters ───────────────────────────────────────────────────────────────

export const useAssignCharacter = (sessionId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { participantId: string; characterId: string }) => {
      const r = await api.post(`/sessions/${sessionId}/assign-character`, data)
      return r.data.data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sessions', sessionId] }); toast.success('Personagem atribuída') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erro'),
  })
}

export const useAutoAssign = (sessionId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => { const r = await api.post(`/sessions/${sessionId}/auto-assign`); return r.data.data.session },
    onSuccess: (s) => { qc.setQueryData(['sessions', sessionId], s); toast.success('Personagens distribuídas!') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erro'),
  })
}

// ─── Stage & Evidence ─────────────────────────────────────────────────────────

export const useAdvanceStage = (sessionId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (stageId: string) => {
      const r = await api.post(`/sessions/${sessionId}/advance-stage`, { stageId })
      return r.data.data.session
    },
    onSuccess: (s) => { qc.setQueryData(['sessions', sessionId], s); toast.success('Nova stage desbloqueada!') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erro'),
  })
}

export const useSessionEvidence = (sessionId: string) =>
  useQuery({
    queryKey: ['sessions', sessionId, 'evidence'],
    queryFn: async () => { const r = await api.get(`/sessions/${sessionId}/evidence`); return r.data.data.evidence },
    enabled: !!sessionId,
  })

export const useUnlockEvidence = (sessionId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (evidenceId: string) => {
      const r = await api.post(`/sessions/${sessionId}/evidence/unlock`, { evidenceId })
      return r.data.data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sessions', sessionId, 'evidence'] }) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erro ao desbloquear'),
  })
}

export const useCaseStages = (caseId: string) =>
  useQuery({
    queryKey: ['cases', caseId, 'stages'],
    queryFn: async () => { const r = await api.get(`/cases/${caseId}/stages`); return r.data.data.stages },
    enabled: !!caseId,
  })

export const useCaseCharacters = (caseId: string) =>
  useQuery({
    queryKey: ['cases', caseId, 'characters'],
    queryFn: async () => { const r = await api.get(`/cases/${caseId}/characters`); return r.data.data.characters },
    enabled: !!caseId,
  })

// ─── Accusations ──────────────────────────────────────────────────────────────

export const useSubmitAccusation = (sessionId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const r = await api.post(`/sessions/${sessionId}/accuse`, data)
      return r.data.data.accusation
    },
    onSuccess: (a) => {
      qc.invalidateQueries({ queryKey: ['sessions', sessionId] })
      if (a.result === 'correct') toast.success('🎉 Correto! Resolveste o caso!')
      else toast.error('❌ Incorreto. Tenta novamente.')
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erro'),
  })
}

export const useSessionResults = (sessionId: string) =>
  useQuery({
    queryKey: ['sessions', sessionId, 'results'],
    queryFn: async () => { const r = await api.get(`/sessions/${sessionId}/results`); return r.data.data },
    enabled: !!sessionId,
  })
