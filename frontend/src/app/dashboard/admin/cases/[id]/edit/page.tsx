'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { CaseForm, CaseFormValues } from '@/components/admin/CaseForm'

export default function EditCasePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'case', id],
    queryFn: async () => {
      const res = await api.get(`/cases/admin/${id}`)
      return res.data.data.case
    },
  })

  const update = useMutation({
    mutationFn: async (formData: CaseFormValues) => {
      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        coverImageUrl: formData.coverImageUrl || undefined,
        priceDigital: formData.priceDigital ?? undefined,
        pricePhysical: formData.pricePhysical ?? undefined,
      }
      const res = await api.put(`/cases/${id}`, payload)
      return res.data.data
    },
    onSuccess: () => {
      toast.success('Caso atualizado!')
      queryClient.invalidateQueries({ queryKey: ['admin', 'case', id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'cases'] })
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Erro ao atualizar caso'
      toast.error(msg)
    },
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-crime-red" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <p className="text-crime-text-muted">Caso não encontrado.</p>
        <Link href="/dashboard/admin/cases" className="btn-secondary mt-4 inline-flex">Voltar</Link>
      </div>
    )
  }

  // Converter tags array → string para o form
  const defaultValues: Partial<CaseFormValues> = {
    ...data,
    tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
    priceDigital: data.priceDigital ? Number(data.priceDigital) : undefined,
    pricePhysical: data.pricePhysical ? Number(data.pricePhysical) : undefined,
    coverImageUrl: data.coverImageUrl ?? '',
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/dashboard/admin/cases" className="inline-flex items-center gap-2 text-sm text-crime-text-faint hover:text-crime-text-primary mb-4 transition-colors">
          <ArrowLeft size={14} /> Voltar aos Casos
        </Link>
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-2">Admin</p>
        <h1 className="text-3xl font-bold text-crime-text-primary">Editar Caso</h1>
        <p className="text-crime-text-muted text-sm mt-1 font-mono">{data.slug}</p>
      </div>

      <CaseForm
        defaultValues={defaultValues}
        onSubmit={update.mutateAsync}
        isLoading={update.isPending}
        submitLabel="Guardar Alterações"
      />
    </div>
  )
}
