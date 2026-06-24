'use client'

import { use, useState } from 'react'
import { ArrowLeft, CheckCircle, XCircle, MessageSquare, Rocket, EyeOff, Loader2, Users, Clock, Star } from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { useAdminSubmission, useModerateSubmission } from '@/hooks/useBuilder'
import { formatDate, difficultyMap, caseTypeMap, formatPrice } from '@/lib/shop.utils'

type ModerationAction = 'approve' | 'reject' | 'request_changes' | 'publish' | 'unpublish'

interface ActionConfig {
  label: string
  icon: React.ElementType
  className: string
  requiresComment?: boolean
  confirmMsg?: string
}

const ACTIONS: Record<ModerationAction, ActionConfig> = {
  approve:          { label: 'Aprovar',              icon: CheckCircle,  className: 'bg-green-900 text-green-300 border-green-700 hover:bg-green-800', requiresComment: false },
  reject:           { label: 'Rejeitar',             icon: XCircle,      className: 'bg-red-950 text-red-300 border-red-800 hover:bg-red-900', requiresComment: true },
  request_changes:  { label: 'Pedir Alterações',     icon: MessageSquare,className: 'bg-yellow-950 text-yellow-300 border-yellow-800 hover:bg-yellow-900', requiresComment: true },
  publish:          { label: 'Publicar Agora',       icon: Rocket,       className: 'bg-crime-red text-white border-crime-red hover:bg-red-700', confirmMsg: 'Publicar este caso na plataforma?' },
  unpublish:        { label: 'Despublicar',          icon: EyeOff,       className: 'bg-crime-muted text-crime-text-faint border-crime-border hover:border-crime-red', confirmMsg: 'Despublicar este caso?' },
}

const AVAILABLE_ACTIONS: Record<string, ModerationAction[]> = {
  draft:        [],
  submitted:    ['approve', 'reject', 'request_changes'],
  under_review: ['approve', 'reject', 'request_changes'],
  approved:     ['publish', 'reject'],
  rejected:     [],
  published:    ['unpublish'],
}

export default function ModerationDetailPage({ params }: { params: { id: string } }) {
  const { id } = params

  const { data: submission, isLoading } = useAdminSubmission(id)
  const moderate = useModerateSubmission(id)

  const [activeAction, setActiveAction] = useState<ModerationAction | null>(null)
  const [comment, setComment] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [changeRequests, setChangeRequests] = useState('')

  if (isLoading) return (
    <div className="p-8 flex justify-center py-20">
      <Loader2 size={28} className="text-crime-red animate-spin" />
    </div>
  )
  if (!submission) return (
    <div className="p-8 text-center text-crime-text-faint">Submissão não encontrada</div>
  )

  const c = submission.case
  const availableActions = AVAILABLE_ACTIONS[submission.status] ?? []

  const handleAction = async (action: ModerationAction) => {
    const cfg = ACTIONS[action]
    if (cfg.confirmMsg && !confirm(cfg.confirmMsg)) return
    await moderate.mutateAsync({
      action,
      comment: comment || undefined,
      rejectionReason: rejectionReason || undefined,
      changeRequests: changeRequests || undefined,
    })
    setActiveAction(null)
    setComment('')
    setRejectionReason('')
    setChangeRequests('')
  }

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/dashboard/admin/moderation" className="btn-ghost text-sm mb-6 inline-flex gap-2">
        <ArrowLeft size={14} /> Fila de Moderação
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — case info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header */}
          <div className="card p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-20 h-20 rounded-lg bg-crime-black border border-crime-border overflow-hidden flex items-center justify-center shrink-0">
                {c.coverImageUrl
                  ? <img src={c.coverImageUrl} className="w-full h-full object-cover" />
                  : <span className="text-3xl opacity-20">🔍</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-crime-text-primary mb-1">{c.title}</h1>
                <p className="text-xs text-crime-text-faint font-mono mb-3">{c.slug}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="badge bg-crime-muted text-crime-text-faint text-[10px]">
                    {caseTypeMap[c.type as any]?.icon} {caseTypeMap[c.type as any]?.label}
                  </span>
                  <span className={clsx('text-xs', difficultyMap[c.difficulty as any]?.color)}>
                    {'★'.repeat(difficultyMap[c.difficulty as any]?.stars ?? 3)}
                  </span>
                  <span className="text-[10px] text-crime-text-faint flex items-center gap-1">
                    <Users size={10} /> {c.minPlayers}–{c.maxPlayers}
                  </span>
                  <span className="text-[10px] text-crime-text-faint flex items-center gap-1">
                    <Clock size={10} /> {c.estimatedMinutes} min
                  </span>
                </div>
              </div>
            </div>

            {/* Prices */}
            <div className="flex gap-4 mb-4 p-3 bg-crime-black rounded border border-crime-border">
              {c.priceDigital && (
                <div><p className="text-[10px] font-mono text-crime-text-faint uppercase mb-0.5">Digital</p>
                  <p className="font-bold text-crime-red">{formatPrice(c.priceDigital)}</p></div>
              )}
              {c.pricePhysical && (
                <div><p className="text-[10px] font-mono text-crime-text-faint uppercase mb-0.5">Físico</p>
                  <p className="font-bold text-crime-text-primary">{formatPrice(c.pricePhysical)}</p></div>
              )}
            </div>

            {/* Short desc */}
            {c.shortDescription && (
              <p className="text-sm text-crime-text-muted italic mb-3">"{c.shortDescription}"</p>
            )}

            {/* Description */}
            <p className="text-sm text-crime-text-secondary leading-relaxed whitespace-pre-line line-clamp-6">{c.description}</p>

            {/* Tags */}
            {c.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {c.tags.map((t: string) => (
                  <span key={t} className="badge bg-crime-muted text-crime-text-faint text-[10px] font-mono">{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Stages */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-crime-border">
              <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint">Stages ({c.stages?.length ?? 0})</p>
            </div>
            <div className="divide-y divide-crime-border/50">
              {(c.stages ?? []).map((s: any) => (
                <div key={s.id} className="px-5 py-3 flex items-start gap-3">
                  <span className={clsx('w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0',
                    s.isLast ? 'bg-crime-red/15 text-crime-red border border-crime-red/25' : 'bg-crime-muted text-crime-text-faint')}>
                    {s.order}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-crime-text-primary">
                      {s.title} {s.isLast && <span className="text-[10px] text-crime-red font-mono ml-1">FINAL</span>}
                    </p>
                    <p className="text-xs text-crime-text-faint mt-0.5 line-clamp-2">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Characters */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-crime-border">
              <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint">Personagens ({c.characters?.length ?? 0})</p>
            </div>
            <div className="divide-y divide-crime-border/50">
              {(c.characters ?? []).map((ch: any) => (
                <div key={ch.id} className="px-5 py-3 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-crime-black border border-crime-border overflow-hidden flex items-center justify-center shrink-0">
                    {ch.avatarUrl ? <img src={ch.avatarUrl} className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-crime-text-faint">{ch.name[0]}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-crime-text-primary">{ch.name}</p>
                      {ch.isKiller    && <span className="badge bg-red-950 text-red-400 text-[9px]">💀 Culpado</span>}
                      {ch.isDetective && <span className="badge bg-blue-950 text-blue-400 text-[9px]">🔍 Detetive</span>}
                    </div>
                    <p className="text-xs text-crime-text-faint line-clamp-1 mt-0.5">{ch.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-crime-border">
              <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint">
                Evidências ({c.evidence?.length ?? 0}) — {(c.evidence ?? []).filter((e: any) => e.isRedHerring).length} red herrings
              </p>
            </div>
            <div className="divide-y divide-crime-border/50">
              {(c.evidence ?? []).map((ev: any) => (
                <div key={ev.id} className={clsx('px-5 py-3 flex items-center gap-3', ev.isRedHerring && 'opacity-50')}>
                  <span className="text-base shrink-0">
                    {{ document:'📄', photo:'🖼️', video:'🎬', audio:'🎵', object:'📦', qrcode:'⬛' }[ev.type] ?? '•'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-crime-text-primary">{ev.title}</p>
                    <p className="text-xs text-crime-text-faint line-clamp-1">{ev.description}</p>
                  </div>
                  {ev.isRedHerring && <span className="badge bg-yellow-950 text-yellow-500 text-[9px] shrink-0">Red Herring</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — moderation panel */}
        <div className="space-y-4">
          {/* Author card */}
          <div className="card p-5">
            <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint mb-3">Autor</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-crime-muted border border-crime-border overflow-hidden flex items-center justify-center shrink-0">
                {submission.author?.avatarUrl
                  ? <img src={submission.author.avatarUrl} className="w-full h-full object-cover" />
                  : <span className="font-bold text-crime-text-faint">{submission.author?.username[0].toUpperCase()}</span>
                }
              </div>
              <div>
                <p className="text-sm font-medium text-crime-text-primary">{submission.author?.displayName || submission.author?.username}</p>
                <p className="text-xs text-crime-text-faint">{submission.author?.email}</p>
              </div>
            </div>
            {submission.submittedAt && (
              <p className="text-xs text-crime-text-faint mt-3 font-mono">
                Submetido em {formatDate(submission.submittedAt)}
              </p>
            )}
          </div>

          {/* Actions */}
          {availableActions.length > 0 && (
            <div className="card p-5">
              <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint mb-4">Ações de Moderação</p>

              <div className="space-y-2">
                {availableActions.map((action) => {
                  const cfg = ACTIONS[action]
                  const Icon = cfg.icon
                  const isActive = activeAction === action
                  return (
                    <div key={action}>
                      <button
                        onClick={() => setActiveAction(isActive ? null : action)}
                        className={clsx(
                          'w-full flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-all',
                          cfg.className
                        )}
                      >
                        <Icon size={14} />
                        {cfg.label}
                      </button>

                      {/* Inline comment form */}
                      {isActive && (
                        <div className="mt-2 p-3 bg-crime-black border border-crime-border rounded-lg space-y-2">
                          {action === 'reject' && (
                            <div>
                              <label className="label">Motivo da rejeição *</label>
                              <textarea className="input resize-none text-xs" rows={2}
                                placeholder="Explica porque o caso foi rejeitado..."
                                value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} />
                            </div>
                          )}
                          {action === 'request_changes' && (
                            <div>
                              <label className="label">Alterações solicitadas *</label>
                              <textarea className="input resize-none text-xs" rows={3}
                                placeholder="Descreve o que precisa de ser alterado..."
                                value={changeRequests} onChange={e => setChangeRequests(e.target.value)} />
                            </div>
                          )}
                          <div>
                            <label className="label">Comentário (opcional)</label>
                            <textarea className="input resize-none text-xs" rows={2}
                              placeholder="Comentário interno..."
                              value={comment} onChange={e => setComment(e.target.value)} />
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button onClick={() => setActiveAction(null)} className="btn-ghost text-xs py-1.5 px-3">Cancelar</button>
                            <button
                              onClick={() => handleAction(action)}
                              disabled={moderate.isPending || (action === 'reject' && !rejectionReason) || (action === 'request_changes' && !changeRequests)}
                              className={clsx('flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 px-3 rounded border transition-all', cfg.className)}
                            >
                              {moderate.isPending ? <Loader2 size={12} className="animate-spin" /> : <Icon size={12} />}
                              Confirmar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Moderation history */}
          {submission.history && submission.history.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-crime-border">
                <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint">Histórico</p>
              </div>
              <div className="divide-y divide-crime-border/50">
                {submission.history.map((h: any) => (
                  <div key={h.id} className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-crime-text-muted capitalize">{h.action.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] text-crime-text-faint">@{h.admin?.username}</span>
                    </div>
                    {h.comment && <p className="text-xs text-crime-text-faint">{h.comment}</p>}
                    <p className="text-[10px] text-crime-text-faint font-mono mt-1">{formatDate(h.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
