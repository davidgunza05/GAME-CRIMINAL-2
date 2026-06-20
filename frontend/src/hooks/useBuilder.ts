import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import api from '@/lib/api'

// ─── My cases ────────────────────────────────────────────────────────────────

export const useMyBuilderCases = (page = 1) =>
  useQuery({
    queryKey: ['builder', 'my', page],
    queryFn: async () => {
      const r = await api.get(`/builder/my?page=${page}`)
      return r.data.data
    },
  })

export const useBuilderCase = (caseId: string) =>
  useQuery({
    queryKey: ['builder', 'case', caseId],
    queryFn: async () => {
      const r = await api.get(`/builder/${caseId}`)
      return r.data.data.submission
    },
    enabled: !!caseId,
  })

export const useValidateCase = (caseId: string, enabled = false) =>
  useQuery({
    queryKey: ['builder', 'validate', caseId],
    queryFn: async () => {
      const r = await api.get(`/builder/${caseId}/validate`)
      return r.data.data
    },
    enabled,
  })

// ─── Mutations ────────────────────────────────────────────────────────────────

export const useCreateBuilderCase = () => {
  const router = useRouter()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const r = await api.post('/builder', data)
      return r.data.data.submission
    },
    onSuccess: (sub) => {
      qc.invalidateQueries({ queryKey: ['builder', 'my'] })
      toast.success('Rascunho criado!')
      router.push(`/dashboard/builder/${sub.case.id}/edit`)
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Erro ao criar'),
  })
}

export const useUpdateBuilderCase = (caseId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const r = await api.patch(`/builder/${caseId}`, data)
      return r.data.data.submission
    },
    onSuccess: (sub) => {
      qc.setQueryData(['builder', 'case', caseId], sub)
      toast.success('Guardado')
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Erro ao guardar'),
  })
}

export const useDeleteBuilderCase = () => {
  const router = useRouter()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (caseId: string) => { await api.delete(`/builder/${caseId}`) },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['builder', 'my'] })
      toast.success('Rascunho eliminado')
      router.push('/dashboard/builder')
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Erro ao eliminar'),
  })
}

export const useSubmitForReview = (caseId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const r = await api.post(`/builder/${caseId}/submit`, {})
      return r.data.data.submission
    },
    onSuccess: (sub) => {
      qc.setQueryData(['builder', 'case', caseId], sub)
      qc.invalidateQueries({ queryKey: ['builder', 'my'] })
      toast.success('Submetido para revisão!')
    },
    onError: (e: any) => {
      const errors = e.response?.data?.errors?.completeness
      if (errors) {
        toast.error(`Caso incompleto: ${errors[0]}`)
      } else {
        toast.error(e.response?.data?.message ?? 'Erro ao submeter')
      }
    },
  })
}

// ─── Builder content CRUD ─────────────────────────────────────────────────────

const contentMutation = (method: 'post' | 'put' | 'delete', path: (id?: string) => string) =>
  (caseId: string, invalidateKey: string) => {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: async ({ id, data }: { id?: string; data?: any }) => {
        const url = `/builder/${caseId}${path(id)}`
        const r = method === 'delete' ? await api.delete(url) : await api[method](url, data)
        return r.data.data
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ['builder', 'case', caseId] }),
      onError: (e: any) => toast.error(e.response?.data?.message ?? 'Erro'),
    })
  }

export const useCreateStage    = (caseId: string) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (data: any) => { const r = await api.post(`/builder/${caseId}/stages`, data); return r.data.data.stage }, onSuccess: () => { qc.invalidateQueries({ queryKey: ['builder', 'case', caseId] }); toast.success('Stage criada') }, onError: (e: any) => toast.error(e.response?.data?.message ?? 'Erro') }) }
export const useUpdateStage    = (caseId: string) => { const qc = useQueryClient(); return useMutation({ mutationFn: async ({ id, data }: { id: string; data: any }) => { const r = await api.put(`/builder/${caseId}/stages/${id}`, data); return r.data.data.stage }, onSuccess: () => { qc.invalidateQueries({ queryKey: ['builder', 'case', caseId] }); toast.success('Stage atualizada') }, onError: (e: any) => toast.error(e.response?.data?.message ?? 'Erro') }) }
export const useDeleteStage    = (caseId: string) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (id: string) => { await api.delete(`/builder/${caseId}/stages/${id}`) }, onSuccess: () => { qc.invalidateQueries({ queryKey: ['builder', 'case', caseId] }); toast.success('Stage eliminada') }, onError: (e: any) => toast.error(e.response?.data?.message ?? 'Erro') }) }

export const useCreateCharacter = (caseId: string) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (data: any) => { const r = await api.post(`/builder/${caseId}/characters`, data); return r.data.data.character }, onSuccess: () => { qc.invalidateQueries({ queryKey: ['builder', 'case', caseId] }); toast.success('Personagem criada') }, onError: (e: any) => toast.error(e.response?.data?.message ?? 'Erro') }) }
export const useUpdateCharacter = (caseId: string) => { const qc = useQueryClient(); return useMutation({ mutationFn: async ({ id, data }: { id: string; data: any }) => { const r = await api.put(`/builder/${caseId}/characters/${id}`, data); return r.data.data.character }, onSuccess: () => { qc.invalidateQueries({ queryKey: ['builder', 'case', caseId] }); toast.success('Personagem atualizada') }, onError: (e: any) => toast.error(e.response?.data?.message ?? 'Erro') }) }
export const useDeleteCharacter = (caseId: string) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (id: string) => { await api.delete(`/builder/${caseId}/characters/${id}`) }, onSuccess: () => { qc.invalidateQueries({ queryKey: ['builder', 'case', caseId] }); toast.success('Personagem eliminada') }, onError: (e: any) => toast.error(e.response?.data?.message ?? 'Erro') }) }

export const useCreateEvidence = (caseId: string) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (data: any) => { const r = await api.post(`/builder/${caseId}/evidence`, data); return r.data.data.evidence }, onSuccess: () => { qc.invalidateQueries({ queryKey: ['builder', 'case', caseId] }); toast.success('Evidência criada') }, onError: (e: any) => toast.error(e.response?.data?.message ?? 'Erro') }) }
export const useUpdateEvidence = (caseId: string) => { const qc = useQueryClient(); return useMutation({ mutationFn: async ({ id, data }: { id: string; data: any }) => { const r = await api.put(`/builder/${caseId}/evidence/${id}`, data); return r.data.data.evidence }, onSuccess: () => { qc.invalidateQueries({ queryKey: ['builder', 'case', caseId] }); toast.success('Evidência atualizada') }, onError: (e: any) => toast.error(e.response?.data?.message ?? 'Erro') }) }
export const useDeleteEvidence = (caseId: string) => { const qc = useQueryClient(); return useMutation({ mutationFn: async (id: string) => { await api.delete(`/builder/${caseId}/evidence/${id}`) }, onSuccess: () => { qc.invalidateQueries({ queryKey: ['builder', 'case', caseId] }); toast.success('Evidência eliminada') }, onError: (e: any) => toast.error(e.response?.data?.message ?? 'Erro') }) }

// ─── Admin moderation ─────────────────────────────────────────────────────────

export const useAdminSubmissions = (page = 1, status = '') =>
  useQuery({
    queryKey: ['admin', 'submissions', page, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (status) params.set('status', status)
      const r = await api.get(`/builder/admin/submissions?${params}`)
      return r.data.data
    },
  })

export const useAdminSubmission = (id: string) =>
  useQuery({
    queryKey: ['admin', 'submission', id],
    queryFn: async () => {
      const r = await api.get(`/builder/admin/submissions/${id}`)
      return r.data.data.submission
    },
    enabled: !!id,
  })

export const useModerateSubmission = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const r = await api.post(`/builder/admin/submissions/${id}/moderate`, data)
      return r.data.data.submission
    },
    onSuccess: (sub) => {
      qc.setQueryData(['admin', 'submission', id], sub)
      qc.invalidateQueries({ queryKey: ['admin', 'submissions'] })
      toast.success('Ação aplicada com sucesso')
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Erro'),
  })
}

export const useCaseReviews = (caseId: string) =>
  useQuery({
    queryKey: ['cases', caseId, 'reviews'],
    queryFn: async () => {
      const r = await api.get(`/builder/${caseId}/reviews`)
      return r.data.data
    },
    enabled: !!caseId,
  })
