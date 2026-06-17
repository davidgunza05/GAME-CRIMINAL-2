'use client'

import { use } from 'react'
import { Loader2, Trophy, Star, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { useSessionResults } from '@/hooks/useSession'
import { formatDate, difficultyMap } from '@/lib/shop.utils'

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data, isLoading } = useSessionResults(id)

  if (isLoading) return (
    <div className="min-h-screen bg-crime-black flex items-center justify-center">
      <Loader2 size={32} className="text-crime-red animate-spin" />
    </div>
  )

  if (!data) return (
    <div className="min-h-screen bg-crime-black flex items-center justify-center text-center px-4">
      <div>
        <p className="text-crime-text-muted mb-4">Resultados não disponíveis</p>
        <Link href="/dashboard/sessions" className="btn-secondary">Voltar às Sessões</Link>
      </div>
    </div>
  )

  const { session, killer, stats } = data
  const winner = session.participants.find((p: any) =>
    p.accusations?.some((a: any) => a.result === 'correct')
  )

  return (
    <div className="min-h-screen bg-crime-black py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard/sessions" className="btn-ghost text-sm mb-6 inline-flex gap-2">
          <ArrowLeft size={14} /> Todas as Sessões
        </Link>

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-crime-red/10 border border-crime-red/30 flex items-center justify-center mx-auto mb-5">
            <Trophy size={36} className="text-crime-red" />
          </div>
          <p className="text-xs font-mono tracking-[0.4em] uppercase text-crime-red mb-3">Caso Encerrado</p>
          <h1 className="text-3xl font-bold text-crime-text-primary mb-2">{session.case.title}</h1>
          {session.completedAt && (
            <p className="text-crime-text-faint text-sm">{formatDate(session.completedAt)}</p>
          )}
        </div>

        {/* Killer reveal */}
        {killer && (
          <div className="card p-8 mb-6 text-center border-crime-red/30 bg-gradient-to-b from-crime-red/5 to-transparent">
            <p className="text-xs font-mono uppercase tracking-widest text-crime-red mb-4">O Culpado Era...</p>
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-crime-black border-2 border-crime-red overflow-hidden flex items-center justify-center">
                {killer.avatarUrl
                  ? <img src={killer.avatarUrl} className="w-full h-full object-cover" />
                  : <span className="text-3xl font-bold text-crime-red">{killer.name[0]}</span>
                }
              </div>
              <div>
                <h2 className="text-2xl font-bold text-crime-text-primary">{killer.name}</h2>
                <p className="text-crime-text-muted text-sm mt-1 max-w-md">{killer.backstory}</p>
              </div>
              <div className="card p-4 text-left max-w-lg w-full mt-2">
                <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint mb-2">O Segredo</p>
                <p className="text-sm text-crime-text-secondary leading-relaxed">{killer.secrets}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Jogadores', value: session.participants.length },
            { label: 'Evidências', value: `${stats.unlockedEvidence}/${stats.totalEvidence}` },
            { label: 'Stages', value: session.case.stages?.length ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} className="card p-4 text-center">
              <p className="text-2xl font-bold text-crime-text-primary">{value}</p>
              <p className="text-xs text-crime-text-faint mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Winner */}
        {winner && (
          <div className="card p-5 mb-6 border-yellow-700/40 bg-yellow-950/20">
            <div className="flex items-center gap-3">
              <Star size={20} className="text-yellow-400 shrink-0" />
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-yellow-500 mb-0.5">Primeiro a resolver</p>
                <p className="font-bold text-crime-text-primary">
                  {winner.user?.displayName || winner.user?.username || winner.guestName}
                  {winner.character && <span className="text-crime-text-faint font-normal"> · {winner.character.name}</span>}
                </p>
              </div>
              <span className="ml-auto text-xl font-bold text-yellow-400">{winner.score} pts</span>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="card overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-crime-border">
            <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint">Classificação</p>
          </div>
          <div className="divide-y divide-crime-border/50">
            {session.participants
              .sort((a: any, b: any) => b.score - a.score)
              .map((p: any, idx: number) => {
                const solved = p.accusations?.some((a: any) => a.result === 'correct')
                const attempts = p.accusations?.length ?? 0
                const medals = ['🥇', '🥈', '🥉']

                return (
                  <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                    <span className="w-8 text-center text-lg shrink-0">
                      {medals[idx] ?? <span className="text-crime-text-faint text-sm">{idx + 1}</span>}
                    </span>
                    <div className="w-9 h-9 rounded-full bg-crime-black border border-crime-border overflow-hidden flex items-center justify-center shrink-0">
                      {p.user?.avatarUrl
                        ? <img src={p.user.avatarUrl} className="w-full h-full object-cover" />
                        : <span className="text-sm font-bold text-crime-text-faint">
                            {(p.user?.displayName || p.user?.username || p.guestName || '?')[0].toUpperCase()}
                          </span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-crime-text-primary">
                        {p.user?.displayName || p.user?.username || p.guestName}
                      </p>
                      {p.character && <p className="text-xs text-crime-text-faint">{p.character.name}</p>}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {solved
                        ? <CheckCircle size={14} className="text-green-400" />
                        : <XCircle size={14} className="text-crime-text-faint" />
                      }
                      {attempts > 0 && (
                        <span className="text-xs text-crime-text-faint">{attempts} tent.</span>
                      )}
                      <span className="font-bold text-crime-text-primary w-16 text-right">{p.score} pts</span>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Accusation log */}
        {session.participants.some((p: any) => p.accusations?.length > 0) && (
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-crime-border">
              <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint">Registo de Acusações</p>
            </div>
            <div className="divide-y divide-crime-border/50">
              {session.participants.flatMap((p: any) =>
                (p.accusations ?? []).map((a: any) => ({
                  ...a,
                  playerName: p.user?.displayName || p.user?.username || p.guestName,
                  charName: p.character?.name,
                }))
              )
                .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map((a: any) => (
                  <div key={a.id} className="flex items-start gap-3 px-5 py-3">
                    {a.result === 'correct'
                      ? <CheckCircle size={14} className="text-green-400 shrink-0 mt-0.5" />
                      : <XCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-crime-text-muted">
                        <span className="text-crime-text-primary font-medium">{a.playerName}</span>
                        {' acusou '}
                        <span className="text-crime-text-primary font-medium">{a.suspect?.name ?? '?'}</span>
                        {' · tentativa '}{a.attemptNumber}
                      </p>
                      {a.feedbackText && (
                        <p className="text-[11px] text-crime-text-faint mt-0.5 italic">{a.feedbackText}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-crime-text-faint shrink-0">{formatDate(a.createdAt)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="flex justify-center gap-4 mt-8">
          <Link href="/dashboard/sessions" className="btn-secondary">Ver Sessões</Link>
          <Link href="/dashboard/cases" className="btn-primary">Próximo Caso</Link>
        </div>
      </div>
    </div>
  )
}
