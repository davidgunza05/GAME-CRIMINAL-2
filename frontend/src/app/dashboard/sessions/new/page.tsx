'use client'

import { useForm } from 'react-hook-form'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ArrowLeft, Lock, ShoppingBag, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useCreateSession } from '@/hooks/useSession'
import { FormField } from '@/components/ui/FormField'
import { formatPrice } from '@/lib/shop.utils'
import api from '@/lib/api'
import { clsx } from 'clsx'

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

function NewSessionInner() {
  const createSession = useCreateSession()
  const searchParams = useSearchParams()
  const preselectedCaseId = searchParams.get('caseId') ?? undefined

  // Todos os casos publicados
  const { data: allCasesData, isLoading: loadingCases } = useQuery({
    queryKey: ['cases', { limit: 100 }],
    queryFn: async () => {
      const res = await api.get('/cases?limit=100')
      return res.data.data
    },
  })

  // Casos que o utilizador já comprou / tem acesso
  const { data: myAccessData } = useQuery({
    queryKey: ['cases', 'my-access'],
    queryFn: async () => {
      const res = await api.get('/cases/my-access')
      return res.data.data.cases as Array<{ id: string }>
    },
  })

  const allCases: any[] = allCasesData?.cases ?? []
  const accessSet = new Set((myAccessData ?? []).map((c: any) => c.id))

  // Separar: grátis (sempre acessíveis) | comprados | pagos sem acesso
  const casesWithAccess = allCases.map((c) => {
    const isFree = !c.priceDigital || Number(c.priceDigital) === 0
    const hasAccess = isFree || accessSet.has(c.id)
    return { ...c, isFree, hasAccess }
  })

  const availableCases  = casesWithAccess.filter((c) => c.hasAccess)
  const lockedCases     = casesWithAccess.filter((c) => !c.hasAccess)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { mode: 'multiplayer' },
  })

  // Pré-selecionar caso após dados carregarem — evita race condition
  useEffect(() => {
    if (preselectedCaseId && availableCases.some((c) => c.id === preselectedCaseId)) {
      setValue('caseId', preselectedCaseId)
    }
  }, [preselectedCaseId, availableCases, setValue])

  const selectedCaseId = watch('caseId')

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

          {/* Seletor de caso */}
          <div>
            <label className="label mb-3 block">Caso Investigativo *</label>

            {loadingCases ? (
              <div className="flex items-center gap-2 text-crime-text-faint py-4">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">A carregar casos...</span>
              </div>
            ) : (
              <div className="space-y-4">

                {/* Casos disponíveis */}
                {availableCases.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint">
                      Disponíveis ({availableCases.length})
                    </p>
                    {availableCases.map((c) => (
                      <label
                        key={c.id}
                        className={clsx(
                          'flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all',
                          selectedCaseId === c.id
                            ? 'border-crime-red bg-crime-red/5'
                            : 'border-crime-border hover:border-crime-text-faint'
                        )}
                      >
                        <input
                          type="radio"
                          value={c.id}
                          {...register('caseId')}
                          className="sr-only"
                        />
                        {/* Cover */}
                        <div className="w-12 h-12 rounded bg-crime-black border border-crime-border flex items-center justify-center shrink-0 overflow-hidden">
                          {c.coverImageUrl
                            ? <img src={c.coverImageUrl} alt={c.title} className="w-full h-full object-cover" />
                            : <span className="text-xl opacity-30">🔍</span>
                          }
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-crime-text-primary text-sm truncate">{c.title}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-crime-text-faint">
                              {c.minPlayers}–{c.maxPlayers} jogadores · {c.estimatedMinutes}min
                            </span>
                            {c.isFree ? (
                              <span className="text-[10px] bg-green-950 text-green-400 px-2 py-0.5 rounded font-mono">GRÁTIS</span>
                            ) : (
                              <span className="text-[10px] bg-crime-red/20 text-crime-red px-2 py-0.5 rounded font-mono flex items-center gap-1">
                                <CheckCircle size={9} /> COMPRADO
                              </span>
                            )}
                          </div>
                        </div>

                        {selectedCaseId === c.id && (
                          <CheckCircle size={18} className="text-crime-red shrink-0" />
                        )}
                      </label>
                    ))}
                  </div>
                )}

                {/* Casos bloqueados (pagos, sem acesso) */}
                {lockedCases.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint">
                      Requer compra ({lockedCases.length})
                    </p>
                    {lockedCases.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-4 p-4 rounded-lg border border-crime-border/40 opacity-50"
                      >
                        <div className="w-12 h-12 rounded bg-crime-black border border-crime-border flex items-center justify-center shrink-0 overflow-hidden">
                          {c.coverImageUrl
                            ? <img src={c.coverImageUrl} alt={c.title} className="w-full h-full object-cover grayscale" />
                            : <Lock size={16} className="text-crime-text-faint" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-crime-text-muted text-sm truncate">{c.title}</p>
                          <p className="text-xs text-crime-text-faint mt-0.5">
                            {c.priceDigital ? formatPrice(c.priceDigital) : ''} · Compra necessária
                          </p>
                        </div>
                        <Link
                          href={`/dashboard/cases/${c.slug}`}
                          className="btn-secondary text-xs py-1.5 px-3 shrink-0 flex items-center gap-1.5"
                        >
                          <ShoppingBag size={11} /> Comprar
                        </Link>
                      </div>
                    ))}
                  </div>
                )}

                {availableCases.length === 0 && lockedCases.length === 0 && (
                  <div className="text-center py-8 text-crime-text-faint">
                    <span className="text-3xl block mb-3 opacity-30">🔍</span>
                    <p className="text-sm">Sem casos disponíveis</p>
                  </div>
                )}
              </div>
            )}

            {errors.caseId && (
              <p className="field-error mt-2">{errors.caseId.message}</p>
            )}

            {/* Aviso quando não há casos disponíveis mas há bloqueados */}
            {availableCases.length === 0 && lockedCases.length > 0 && (
              <div className="mt-4 flex items-start gap-3 bg-crime-red/5 border border-crime-red/20 rounded-lg p-4">
                <Lock size={16} className="text-crime-red shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-crime-red">Sem casos disponíveis</p>
                  <p className="text-xs text-crime-text-muted mt-1">
                    Tens de comprar pelo menos um caso antes de criar uma sessão.
                    Os casos gratuitos, quando existirem, estão sempre disponíveis.
                  </p>
                  <Link href="/dashboard/cases" className="btn-primary text-xs mt-3 inline-flex gap-1.5">
                    <ShoppingBag size={12} /> Ver Loja de Casos
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Modo */}
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
              <input type="datetime-local" className="input w-full" {...register('scheduledAt')} />
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
            <textarea className="input resize-none w-full" rows={3} placeholder="Instruções para os jogadores..."
              {...register('notes')} />
          </div>

          <button
            type="submit"
            disabled={createSession.isPending || availableCases.length === 0}
            className="btn-primary w-full"
          >
            {createSession.isPending
              ? <><Loader2 size={16} className="animate-spin" /> A criar...</>
              : 'Criar Sessão'
            }
          </button>
        </form>
      </div>
    </div>
  )
}

export default function NewSessionPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-crime-red" />
      </div>
    }>
      <NewSessionInner />
    </Suspense>
  )
}
