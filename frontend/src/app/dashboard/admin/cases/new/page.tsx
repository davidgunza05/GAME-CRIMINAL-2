'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { CaseForm, CaseFormValues } from '@/components/admin/CaseForm'

export default function NewCasePage() {
  const router = useRouter()

  const create = useMutation({
    mutationFn: async (data: CaseFormValues) => {
      const payload = {
        ...data,
        tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        coverImageUrl: data.coverImageUrl || undefined,
        priceDigital: data.priceDigital ?? undefined,
        pricePhysical: data.pricePhysical ?? undefined,
      }
      const res = await api.post('/cases', payload)
      return res.data.data
    },
    onSuccess: ({ case: c }) => {
      toast.success('Caso criado com sucesso!')
      router.push(`/dashboard/admin/cases/${c.id}/edit`)
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Erro ao criar caso'
      toast.error(msg)
    },
  })

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/dashboard/admin/cases" className="inline-flex items-center gap-2 text-sm text-crime-text-faint hover:text-crime-text-primary mb-4 transition-colors">
          <ArrowLeft size={14} /> Voltar aos Casos
        </Link>
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-2">Admin</p>
        <h1 className="text-3xl font-bold text-crime-text-primary">Novo Caso</h1>
        <p className="text-crime-text-muted text-sm mt-1">Cria um novo caso investigativo para a plataforma.</p>
      </div>

      <CaseForm
        onSubmit={create.mutateAsync}
        isLoading={create.isPending}
        submitLabel="Criar Caso"
      />
    </div>
  )
}
