'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useCases } from '@/hooks/useShop'
import { useCreateSession } from '@/hooks/useSession'
import { FormField } from '@/components/ui/FormField'

const schema = z.object({
  caseId: z.string().uuid('Seleciona um caso'),
  mode: z.enum(['multiplayer', 'hybrid']).default('multiplayer'),
  scheduledAt: z.string().optional(),
  estimatedMinutes: z.coerce.number().int().min(15).max(600).optional(),
  meetingUrl: z.string().url().optional().or(z.literal('')),
  location: z.string().max(300).optional(),
  notes: z.string().max(1000).optional(),
})

type FormData = z.infer<typeof schema>

export default function NewSessionPage() {
  const createSession = useCreateSession()
  const { data: casesData } = useCases({ limit: 50 })
  const cases = casesData?.cases ?? []

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { mode: 'multiplayer' },
  })

  const onSubmit = (data: FormData) => {
    createSession.mutate({
      ...data,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      meetingUrl: data.meetingUrl || undefined,
    })
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/dashboard/sessions" className="btn-ghost text-sm mb-6 inline-flex gap-2">
        <ArrowLeft size={14} /> Voltar
      </Link>

      <div className="mb-8">
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-2">Organizar</p>
        <h1 className="text-3xl font-bold text-crime-text-primary">Nova Sessão</h1>
      </div>

      <div className="card p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Case selector */}
          <div>
            <label className="label">Caso Investigativo *</label>
            <select className="input" {...register('caseId')}>
              <option value="">Seleciona um caso...</option>
              {cases.map((c: any) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            {errors.caseId && <p className="field-error mt-1.5">{errors.caseId.message}</p>}
          </div>

          {/* Mode */}
          <div>
            <label className="label">Modo de Jogo</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'multiplayer', icon: '👥', label: 'Multiplayer', desc: 'Jogadores em simultâneo' },
                { value: 'hybrid',      icon: '🔀', label: 'Híbrido',     desc: 'Online + Presencial' },
              ].map((m) => (
                <label key={m.value} className="cursor-pointer">
                  <input type="radio" value={m.value} {...register('mode')} className="sr-only" />
                  <div className="card p-4 hover:border-crime-red/50 transition-all has-[:checked]:border-crime-red has-[:checked]:bg-crime-red/5">
                    <span className="text-xl block mb-2">{m.icon}</span>
                    <p className="text-sm font-medium text-crime-text-primary">{m.label}</p>
                    <p className="text-xs text-crime-text-faint">{m.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Agendamento (opcional)</label>
              <input type="datetime-local" className="input" {...register('scheduledAt')} />
            </div>
            <FormField label="Duração estimada (min)" type="number" placeholder="120"
              error={errors.estimatedMinutes?.message} {...register('estimatedMinutes')} />
          </div>

          <FormField label="Link da reunião (opcional)" placeholder="https://meet.google.com/..."
            error={errors.meetingUrl?.message} {...register('meetingUrl')} />

          <FormField label="Local (opcional)" placeholder="Sala de reuniões, morada..."
            error={errors.location?.message} {...register('location')} />

          <div>
            <label className="label">Notas (opcional)</label>
            <textarea className="input resize-none" rows={3} placeholder="Instruções para os jogadores..."
              {...register('notes')} />
          </div>

          <button type="submit" disabled={createSession.isPending} className="btn-primary w-full">
            {createSession.isPending ? <><Loader2 size={16} className="animate-spin" /> A criar...</> : 'Criar Sessão'}
          </button>
        </form>
      </div>
    </div>
  )
}
