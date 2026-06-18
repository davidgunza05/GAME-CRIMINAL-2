'use client'

import { useState, useEffect } from 'react'
import { Users, Copy, Play, Shuffle, ArrowRight, Wifi, WifiOff, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, useStartSession, useAutoAssign, useCaseCharacters } from '@/hooks/useSession'
import { useGameSocket } from '@/hooks/useGameSocket'
import { useAuthStore } from '@/store/auth.store'
import { GameSession } from '@/types/game'
 
export default function LobbyPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const { user } = useAuthStore()
  const [session, setSession] = useState<GameSession | null>(null)

  const { data: initialSession, isLoading } = useSession(id)
  const startSession  = useStartSession()
  const autoAssign    = useAutoAssign(id)

  const { data: characters } = useCaseCharacters(session?.caseId ?? '')

  useEffect(() => { if (initialSession) setSession(initialSession) }, [initialSession])

  const { connected, online } = useGameSocket({
    sessionId: id,
    onSessionUpdate: setSession,
    onSessionStarted: () => router.push(`/dashboard/sessions/${id}/play`),
  })

  if (isLoading || !session) return (
    <div className="min-h-screen bg-crime-black flex items-center justify-center">
      <Loader2 size={32} className="text-crime-red animate-spin" />
    </div>
  )

  const isHost = user?.id === session.hostId
  const copyCode = () => { navigator.clipboard.writeText(session.accessCode); toast.success('Código copiado!') }
  const allAssigned = session.participants.every((p) => p.character)

  return (
    <div className="min-h-screen bg-crime-black">
      {/* Header */}
      <div className="border-b border-crime-border bg-crime-surface px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🔍</span>
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint">Lobby</p>
            <p className="font-bold text-crime-text-primary text-sm">{session.case.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {connected
            ? <span className="flex items-center gap-1.5 text-xs text-green-400"><Wifi size={12} /> Online</span>
            : <span className="flex items-center gap-1.5 text-xs text-red-400"><WifiOff size={12} /> Offline</span>
          }
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — Session info */}
        <div className="lg:col-span-1 space-y-4">
          {/* Access code */}
          <div className="card p-5">
            <p className="label mb-3">Código de Acesso</p>
            <div className="flex items-center justify-between bg-crime-black rounded-lg px-4 py-3 border border-crime-border">
              <span className="font-mono text-2xl font-bold tracking-[0.3em] text-crime-red">
                {session.accessCode}
              </span>
              <button onClick={copyCode} className="btn-ghost p-1.5"><Copy size={14} /></button>
            </div>
            <p className="text-[10px] text-crime-text-faint mt-2">Partilha este código com os jogadores</p>
          </div>

          {/* Session details */}
          <div className="card p-5 space-y-3 text-sm">
            <p className="label">Detalhes</p>
            <div className="flex justify-between text-crime-text-muted">
              <span>Jogadores</span>
              <span className="text-crime-text-primary">{session.participants.length}/{session.case.maxPlayers}</span>
            </div>
            <div className="flex justify-between text-crime-text-muted">
              <span>Modo</span>
              <span className="text-crime-text-primary capitalize">{session.mode}</span>
            </div>
            {session.meetingUrl && (
              <div className="pt-2 border-t border-crime-border">
                <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-crime-red hover:text-red-400 transition-colors">
                  <ArrowRight size={12} /> Abrir link da reunião
                </a>
              </div>
            )}
          </div>

          {/* Online now */}
          {online.length > 0 && (
            <div className="card p-4">
              <p className="label mb-3">Online agora ({online.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {online.map((u) => (
                  <span key={u} className="text-[10px] bg-green-950 border border-green-800 text-green-300 px-2 py-0.5 rounded font-mono">
                    {u}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — Participants */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-crime-red" />
                <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint">
                  Participantes ({session.participants.length})
                </p>
              </div>
              {isHost && (
                <button onClick={() => autoAssign.mutate()} disabled={autoAssign.isPending}
                  className="btn-secondary text-xs py-1.5 px-3 gap-1.5">
                  {autoAssign.isPending ? <Loader2 size={12} className="animate-spin" /> : <Shuffle size={12} />}
                  Distribuir auto
                </button>
              )}
            </div>

            <div className="space-y-2">
              {session.participants.map((p) => (
                <div key={p.id} className="flex items-center gap-4 p-3 rounded-lg bg-crime-black border border-crime-border/50">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-crime-muted border border-crime-border shrink-0 overflow-hidden flex items-center justify-center">
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
                      {p.userId === session.hostId && (
                        <span className="ml-2 text-[10px] bg-crime-red text-white px-1.5 py-0.5 rounded font-mono">HOST</span>
                      )}
                    </p>
                    {p.character ? (
                      <p className="text-xs text-crime-red">{p.character.name}</p>
                    ) : (
                      <p className="text-xs text-crime-text-faint italic">Sem personagem</p>
                    )}
                  </div>

                  {/* Character assign (host only) */}
                  {isHost && !p.character && characters && (
                    <select
                      className="bg-crime-surface border border-crime-border rounded text-xs px-2 py-1 text-crime-text-muted"
                      defaultValue=""
                      onChange={async (e) => {
                        if (!e.target.value) return
                        try {
                          await fetch(`/api/sessions/${id}/assign-character`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json',
                              Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
                            body: JSON.stringify({ participantId: p.id, characterId: e.target.value }),
                          })
                        } catch {}
                      }}
                    >
                      <option value="">Atribuir personagem...</option>
                      {characters.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}

              {session.participants.length === 0 && (
                <p className="text-center py-8 text-crime-text-faint text-sm">
                  Aguardando jogadores... Partilha o código!
                </p>
              )}
            </div>
          </div>

          {/* Start game */}
          {isHost && (
            <div className="card p-5">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm font-medium text-crime-text-primary mb-1">Pronto para começar?</p>
                  <p className="text-xs text-crime-text-faint">
                    {!allAssigned && 'Alguns jogadores ainda não têm personagem. '}
                    Todos os jogadores serão notificados quando a sessão iniciar.
                  </p>
                </div>
                <button
                  onClick={() => startSession.mutate(id)}
                  disabled={startSession.isPending || session.participants.length < session.case.minPlayers}
                  className="btn-primary gap-2 px-6"
                >
                  {startSession.isPending ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                  Iniciar Investigação
                </button>
              </div>
              {session.participants.length < session.case.minPlayers && (
                <p className="text-xs text-yellow-400 mt-3">
                  Mínimo {session.case.minPlayers} jogadores necessários (tens {session.participants.length})
                </p>
              )}
            </div>
          )}

          {!isHost && (
            <div className="card p-5 text-center">
              <Loader2 size={20} className="text-crime-red animate-spin mx-auto mb-2" />
              <p className="text-sm text-crime-text-muted">A aguardar que o host inicie a sessão...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
