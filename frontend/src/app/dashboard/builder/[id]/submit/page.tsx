'use client'

import { use, useState } from 'react'
import { Loader2, CheckCircle, XCircle, Send, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'
import { useBuilderCase, useSubmitForReview } from '@/hooks/useBuilder'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export default function BuilderSubmitPage({ params }: { params: { id: string } }) {
  const { id } = params
  const { data: submission } = useBuilderCase(id)
  const submit = useSubmitForReview(id)

  const { data: validation, isLoading: validating, refetch: revalidate } = useQuery({
    queryKey: ['builder', 'validate', id],
    queryFn: async () => {
      const r = await api.get(`/builder/${id}/validate`)
      return r.data.data
    },
    enabled: !!id,
  })

  const c = submission?.case
  const isEditable = !submission || ['draft', 'rejected'].includes(submission?.status ?? '')
  const alreadySubmitted = ['submitted', 'under_review', 'approved', 'published'].includes(submission?.status ?? '')

  const STATUS_INFO: Record<string, { label: string; desc: string; color: string }> = {
    draft:        { label: 'Rascunho',       desc: 'O caso ainda não foi submetido.',                  color: 'text-crime-text-faint' },
    submitted:    { label: 'Submetido',      desc: 'A aguardar revisão pelo admin.',                   color: 'text-blue-400' },
    under_review: { label: 'Em Revisão',     desc: 'O admin está a rever o teu caso.',                 color: 'text-yellow-400' },
    approved:     { label: 'Aprovado',       desc: 'O caso foi aprovado e está pronto a publicar.',    color: 'text-green-400' },
    rejected:     { label: 'Rejeitado',      desc: 'O caso foi rejeitado. Consulta o feedback abaixo.', color: 'text-red-400' },
    published:    { label: 'Publicado',      desc: 'O caso está publicado na plataforma!',             color: 'text-crime-red' },
  }

  const statusInfo = STATUS_INFO[submission?.status ?? 'draft']

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-1">Passo 5</p>
        <h2 className="text-2xl font-bold text-crime-text-primary">Submeter para Revisão</h2>
        <p className="text-crime-text-muted text-sm mt-1">Valida e submete o teu caso para moderação</p>
      </div>

      {/* Case summary */}
      {c && (
        <div className="card p-5 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-crime-black border border-crime-border overflow-hidden flex items-center justify-center shrink-0">
              {c.coverImageUrl
                ? <img src={c.coverImageUrl} alt={c.title} className="w-full h-full object-cover" />
                : <span className="text-2xl opacity-20">🔍</span>
              }
            </div>
            <div>
              <p className="font-bold text-crime-text-primary">{c.title}</p>
              <p className="text-xs text-crime-text-faint font-mono">{c.slug}</p>
              <div className="flex gap-3 mt-2 text-[10px] text-crime-text-faint font-mono">
                <span>{c.stages?.length ?? 0} stages</span>
                <span>{c.characters?.length ?? 0} personagens</span>
                <span>{c.evidence?.length ?? 0} evidências</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current status */}
      {submission && (
        <div className={clsx('card p-5 mb-6', {
          'border-blue-800/30 bg-blue-950/20':   ['submitted','under_review'].includes(submission.status),
          'border-green-800/30 bg-green-950/20': submission.status === 'approved',
          'border-red-800/30 bg-red-950/20':     submission.status === 'rejected',
          'border-crime-red/30 bg-crime-red/5':  submission.status === 'published',
        })}>
          <div className="flex items-start gap-3">
            {submission.status === 'approved' || submission.status === 'published'
              ? <CheckCircle size={18} className="text-green-400 shrink-0 mt-0.5" />
              : submission.status === 'rejected'
                ? <XCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                : <AlertTriangle size={18} className="text-yellow-400 shrink-0 mt-0.5" />
            }
            <div>
              <p className={clsx('font-bold text-sm mb-1', statusInfo.color)}>{statusInfo.label}</p>
              <p className="text-xs text-crime-text-muted">{statusInfo.desc}</p>

              {/* Rejection reason */}
              {submission.rejectionReason && (
                <div className="mt-3 p-3 bg-red-950/30 border border-red-800/30 rounded">
                  <p className="text-xs font-mono uppercase tracking-widest text-red-500 mb-1">Motivo da Rejeição</p>
                  <p className="text-xs text-red-300">{submission.rejectionReason}</p>
                </div>
              )}

              {/* Change requests */}
              {submission.changeRequests && (
                <div className="mt-3 p-3 bg-yellow-950/30 border border-yellow-800/30 rounded">
                  <p className="text-xs font-mono uppercase tracking-widest text-yellow-500 mb-1">Alterações Solicitadas</p>
                  <p className="text-xs text-yellow-300">{submission.changeRequests}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Validation checklist */}
      {isEditable && (
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint">Validação</p>
            <button onClick={() => revalidate()} className="text-xs text-crime-red hover:opacity-70 transition-opacity">
              Verificar novamente
            </button>
          </div>

          {validating ? (
            <div className="flex items-center gap-2 text-crime-text-faint">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-sm">A validar...</span>
            </div>
          ) : validation ? (
            <div className="space-y-2">
              {validation.valid ? (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle size={16} />
                  <span className="text-sm font-medium">Tudo em ordem! O caso está pronto para submissão.</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-red-400 mb-3">
                    <XCircle size={16} />
                    <span className="text-sm font-medium">O caso tem {validation.errors.length} problema(s) a corrigir:</span>
                  </div>
                  {validation.errors.map((err: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-red-300">
                      <span className="text-red-500 mt-0.5 shrink-0">•</span>
                      {err}
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Moderation history */}
      {submission?.history && submission.history.length > 0 && (
        <div className="card overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-crime-border">
            <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint">Histórico de Moderação</p>
          </div>
          <div className="divide-y divide-crime-border/50">
            {submission.history.map((h: any) => (
              <div key={h.id} className="px-5 py-3 flex items-start gap-3">
                <span className="text-lg shrink-0">
                  {{ approved: '✅', rejected: '❌', requested_changes: '📝', published: '🚀', unpublished: '📦', submitted: '📤' }[h.action] ?? '•'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-crime-text-muted capitalize">{h.action.replace('_', ' ')}</span>
                    <span className="text-[10px] text-crime-text-faint">por @{h.admin?.username}</span>
                  </div>
                  {h.comment && <p className="text-xs text-crime-text-secondary">{h.comment}</p>}
                </div>
                <span className="text-[10px] text-crime-text-faint shrink-0 font-mono">
                  {new Date(h.createdAt).toLocaleDateString('pt-PT')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit button */}
      {isEditable && (
        <div className="space-y-3">
          <p className="text-xs text-crime-text-faint leading-relaxed">
            Ao submeter, o caso será enviado para revisão manual pelo admin. Receberás feedback em breve.
            Não poderás editar o caso enquanto estiver em revisão.
          </p>
          <button
            onClick={() => submit.mutate()}
            disabled={submit.isPending || !validation?.valid}
            className="btn-primary w-full py-3 gap-2"
          >
            {submit.isPending
              ? <><Loader2 size={16} className="animate-spin" /> A submeter...</>
              : <><Send size={16} /> Submeter para Revisão</>
            }
          </button>
        </div>
      )}

      {alreadySubmitted && (
        <div className="text-center">
          <p className="text-crime-text-faint text-sm">
            O teu caso foi submetido. Aguarda feedback do admin.
          </p>
        </div>
      )}
    </div>
  )
}
