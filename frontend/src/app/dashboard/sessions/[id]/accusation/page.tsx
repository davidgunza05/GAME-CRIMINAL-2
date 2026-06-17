'use client'

import { use, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useSession, useSessionEvidence, useCaseCharacters, useSubmitAccusation } from '@/hooks/useSession'

const schema = z.object({
  suspectId: z.string().uuid('Seleciona um suspeito'),
  motive: z.string().min(10, 'Descreve o motivo (mínimo 10 caracteres)').max(1000),
  method: z.string().min(5, 'Descreve o método').max(500),
  evidenceCited: z.array(z.string()).min(1, 'Cita pelo menos uma evidência'),
})

type FormData = z.infer<typeof schema>

export default function AccusationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [lastResult, setLastResult] = useState<{ result: string; feedbackText: string } | null>(null)

  const { data: session } = useSession(id)
  const { data: evidence } = useSessionEvidence(id)
  const { data: characters } = useCaseCharacters(session?.caseId ?? '')
  const submitAccusation = useSubmitAccusation(id)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { evidenceCited: [] },
  })

  const selectedEvidence = watch('evidenceCited') ?? []
  const toggleEvidence = (evidenceId: string) => {
    setValue('evidenceCited',
      selectedEvidence.includes(evidenceId)
        ? selectedEvidence.filter((e) => e !== evidenceId)
        : [...selectedEvidence, evidenceId]
    )
  }

  const onSubmit = async (data: FormData) => {
    const accusation = await submitAccusation.mutateAsync(data)
    setLastResult({ result: accusation.result, feedbackText: accusation.feedbackText ?? '' })
  }

  if (!session) return (
    <div className="min-h-screen bg-crime-black flex items-center justify-center">
      <Loader2 size={32} className="text-crime-red animate-spin" />
    </div>
  )

  const isLastStage = session.currentStage?.isLast
  if (!isLastStage) return (
    <div className="min-h-screen bg-crime-black flex items-center justify-center text-center px-4">
      <div>
        <AlertCircle size={48} className="text-yellow-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-crime-text-primary mb-2">Ainda não é a hora</h1>
        <p className="text-crime-text-muted text-sm mb-6">A acusação final só está disponível na última stage.</p>
        <Link href={`/dashboard/sessions/${id}/play`} className="btn-primary">Voltar à Investigação</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-crime-black py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href={`/dashboard/sessions/${id}/play`} className="btn-ghost text-sm mb-6 inline-flex gap-2">
          <ArrowLeft size={14} /> Voltar
        </Link>

        <div className="mb-8">
          <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-2">Momento da Verdade</p>
          <h1 className="text-3xl font-bold text-crime-text-primary">Fazer Acusação</h1>
          <p className="text-crime-text-muted text-sm mt-2">
            Tens certeza? Analisa bem as evidências antes de acusar.
          </p>
        </div>

        {/* Previous result feedback */}
        {lastResult && (
          <div className={`rounded-lg px-5 py-4 mb-6 border ${
            lastResult.result === 'correct'
              ? 'bg-green-950 border-green-700 text-green-300'
              : 'bg-red-950 border-red-800 text-red-300'
          }`}>
            <p className="font-bold mb-1">
              {lastResult.result === 'correct' ? '🎉 Correto!' : '❌ Incorreto'}
            </p>
            <p className="text-sm">{lastResult.feedbackText}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Suspect */}
          <div className="card p-5">
            <p className="label mb-4">Quem é o culpado?</p>
            <div className="grid grid-cols-2 gap-3">
              {(characters ?? []).map((char: any) => (
                <label key={char.id} className="cursor-pointer">
                  <input type="radio" value={char.id} {...register('suspectId')} className="sr-only" />
                  <div className="card p-3 hover:border-crime-red/50 transition-all has-[:checked]:border-crime-red has-[:checked]:bg-crime-red/5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-crime-black border border-crime-border shrink-0 overflow-hidden flex items-center justify-center">
                      {char.avatarUrl
                        ? <img src={char.avatarUrl} className="w-full h-full object-cover" />
                        : <span className="text-sm font-bold text-crime-text-faint">{char.name[0]}</span>
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-crime-text-primary truncate">{char.name}</p>
                      <p className="text-[10px] text-crime-text-faint truncate">{char.description}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {errors.suspectId && <p className="field-error mt-2">{errors.suspectId.message}</p>}
          </div>

          {/* Motive */}
          <div className="card p-5">
            <label className="label">Motivo</label>
            <textarea className="input resize-none mt-2" rows={3}
              placeholder="Qual foi o motivo do crime?"
              {...register('motive')} />
            {errors.motive && <p className="field-error mt-1">{errors.motive.message}</p>}
          </div>

          {/* Method */}
          <div className="card p-5">
            <label className="label">Método</label>
            <textarea className="input resize-none mt-2" rows={2}
              placeholder="Como foi cometido o crime?"
              {...register('method')} />
            {errors.method && <p className="field-error mt-1">{errors.method.message}</p>}
          </div>

          {/* Evidence */}
          <div className="card p-5">
            <p className="label mb-3">Evidências que suportam a tua teoria</p>
            {(evidence ?? []).length === 0 ? (
              <p className="text-crime-text-faint text-sm">Nenhuma evidência desbloqueada.</p>
            ) : (
              <div className="space-y-2">
                {(evidence ?? []).map((eu: any) => (
                  <label key={eu.id} className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-crime-muted/20 transition-colors">
                    <input type="checkbox" checked={selectedEvidence.includes(eu.evidenceId)}
                      onChange={() => toggleEvidence(eu.evidenceId)}
                      className="w-4 h-4 rounded border-crime-border bg-crime-black accent-crime-red" />
                    <span className="text-sm text-crime-text-secondary">{eu.evidence.title}</span>
                    <span className="text-[10px] text-crime-text-faint capitalize">{eu.evidence.type}</span>
                  </label>
                ))}
              </div>
            )}
            {errors.evidenceCited && <p className="field-error mt-2">{errors.evidenceCited.message}</p>}
          </div>

          <button type="submit" disabled={submitAccusation.isPending} className="btn-primary w-full py-4 text-base">
            {submitAccusation.isPending
              ? <><Loader2 size={18} className="animate-spin" /> A submeter...</>
              : '⚖️ Submeter Acusação'}
          </button>
        </form>
      </div>
    </div>
  )
}
