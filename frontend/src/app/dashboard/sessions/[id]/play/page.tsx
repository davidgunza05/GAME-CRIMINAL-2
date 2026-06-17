'use client'

import { use, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Lock, FileText, Image, Volume2, Video, Box, QrCode,
         ChevronRight, Send, Wifi, WifiOff, PauseCircle, Flag } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { useSession, useSessionEvidence, useUnlockEvidence,
         useAdvanceStage, usePauseSession, useCaseStages } from '@/hooks/useSession'
import { useGameSocket } from '@/hooks/useGameSocket'
import { useAuthStore } from '@/store/auth.store'
import { GameSession, EvidenceUnlock, ChatMessage, EvidenceType } from '@/types/game'

const evidenceIcons: Record<EvidenceType, React.ElementType> = {
  document: FileText, photo: Image, audio: Volume2,
  video: Video, object: Box, qrcode: QrCode,
}

export default function PlayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuthStore()

  const [session, setSession] = useState<GameSession | null>(null)
  const [unlockedEvidence, setUnlockedEvidence] = useState<EvidenceUnlock[]>([])
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceUnlock | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  const { data: initialSession, isLoading } = useSession(id)
  const { data: evidenceData } = useSessionEvidence(id)
  const { data: stages } = useCaseStages(session?.caseId ?? '')
  const unlockEvidence = useUnlockEvidence(id)
  const advanceStage = useAdvanceStage(id)
  const pauseSession = usePauseSession()

  useEffect(() => { if (initialSession) setSession(initialSession) }, [initialSession])
  useEffect(() => { if (evidenceData) setUnlockedEvidence(evidenceData) }, [evidenceData])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])

  const { connected, online, sendChat } = useGameSocket({
    sessionId: id,
    onSessionUpdate: setSession,
    onEvidenceUnlocked: (data) => {
      setUnlockedEvidence((prev) => {
        const exists = prev.find((e) => e.evidenceId === data.unlock.evidenceId)
        if (exists) return prev
        toast.success('Nova evidência desbloqueada!')
        return [...prev, data.unlock]
      })
    },
    onStageAdvanced: () => toast.success('Nova stage desbloqueada!'),
    onSessionCompleted: () => router.push(`/dashboard/sessions/${id}/results`),
  })

  if (isLoading || !session) return (
    <div className="min-h-screen bg-crime-black flex items-center justify-center">
      <Loader2 size={32} className="text-crime-red animate-spin" />
    </div>
  )

  const isHost = user?.id === session.hostId
  const myParticipant = session.participants.find((p) => p.userId === user?.id)
  const isLastStage = session.currentStage?.isLast

  const handleSendChat = () => {
    if (!chatInput.trim()) return
    sendChat(chatInput)
    setChatMessages((prev) => [...prev, { username: user?.username ?? 'Tu', message: chatInput, timestamp: new Date().toISOString() }])
    setChatInput('')
  }

  return (
    <div className="min-h-screen bg-crime-black flex flex-col">
      {/* Top bar */}
      <div className="border-b border-crime-border bg-crime-surface px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-lg">🔍</span>
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint">Investigação</p>
            <p className="font-bold text-crime-text-primary text-sm">{session.case.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {connected
            ? <span className="flex items-center gap-1 text-xs text-green-400"><Wifi size={11} /> {online.length}</span>
            : <span className="flex items-center gap-1 text-xs text-red-400"><WifiOff size={11} /></span>
          }
          {isLastStage && (
            <button onClick={() => router.push(`/dashboard/sessions/${id}/accusation`)}
              className="btn-primary text-xs py-1.5 px-3 gap-1.5 animate-pulse-red">
              <Flag size={12} /> Fazer Acusação
            </button>
          )}
          {isHost && (
            <button onClick={() => pauseSession.mutate(id)}
              className="btn-secondary text-xs py-1.5 px-3">
              <PauseCircle size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — Stage navigation */}
        <div className="w-56 border-r border-crime-border bg-crime-surface shrink-0 overflow-y-auto">
          <div className="p-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-crime-text-faint mb-2 px-1">Stages</p>
            <div className="space-y-0.5">
              {(stages ?? []).map((stage: any) => {
                const isCurrent = stage.id === session.currentStageId
                const isPast = (stages ?? []).findIndex((s: any) => s.id === session.currentStageId) > stages?.findIndex((s: any) => s.id === stage.id)

                return (
                  <div key={stage.id} className={clsx(
                    'px-3 py-2 rounded-md text-xs transition-all',
                    isCurrent ? 'bg-crime-red/15 text-crime-red border border-crime-red/20' :
                    isPast ? 'text-crime-text-faint' : 'text-crime-text-faint opacity-40'
                  )}>
                    <span className="flex items-center gap-1.5">
                      {isPast && !isCurrent ? '✓' : isCurrent ? '▶' : '○'}
                      {stage.title}
                    </span>
                    {stage.isLast && <span className="text-[9px] text-crime-red block mt-0.5 font-mono">FINAL</span>}
                  </div>
                )
              })}
            </div>

            {/* Advance stage (host) */}
            {isHost && stages && session.currentStageId && (() => {
              const idx = stages.findIndex((s: any) => s.id === session.currentStageId)
              const nextStage = stages[idx + 1]
              if (!nextStage) return null
              return (
                <button onClick={() => advanceStage.mutate(nextStage.id)}
                  disabled={advanceStage.isPending}
                  className="mt-3 w-full btn-secondary text-[10px] py-2 px-3 gap-1">
                  {advanceStage.isPending ? <Loader2 size={10} className="animate-spin" /> : <ChevronRight size={10} />}
                  {nextStage.title}
                </button>
              )
            })()}
          </div>
        </div>

        {/* Centre — Evidence board */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* My character card */}
          {myParticipant?.character && (
            <div className="card p-4 mb-6 border-crime-red/20 bg-crime-red/5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-crime-red mb-1">A tua personagem</p>
              <p className="font-bold text-crime-text-primary">{myParticipant.character.name}</p>
              <p className="text-xs text-crime-text-muted mt-1">{myParticipant.character.description}</p>
            </div>
          )}

          {/* Current stage info */}
          {session.currentStage && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono uppercase tracking-widest text-crime-text-faint">Stage atual</span>
                {session.currentStage.isLast && (
                  <span className="badge bg-crime-red text-white text-[9px]">FINAL</span>
                )}
              </div>
              <h2 className="text-xl font-bold text-crime-text-primary mb-1">{session.currentStage.title}</h2>
              <p className="text-sm text-crime-text-muted">{session.currentStage.description}</p>
            </div>
          )}

          {/* Evidence grid */}
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint mb-3">
              Evidências ({unlockedEvidence.length})
            </p>
            {unlockedEvidence.length === 0 ? (
              <div className="card p-10 text-center">
                <Lock size={24} className="text-crime-text-faint mx-auto mb-2" />
                <p className="text-crime-text-faint text-sm">Nenhuma evidência desbloqueada ainda</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {unlockedEvidence.map((eu) => {
                  const Icon = evidenceIcons[eu.evidence.type] ?? FileText
                  const isSelected = selectedEvidence?.id === eu.id
                  return (
                    <button key={eu.id} onClick={() => setSelectedEvidence(isSelected ? null : eu)}
                      className={clsx(
                        'card p-4 text-left transition-all hover:border-crime-red/40',
                        isSelected && 'border-crime-red bg-crime-red/5'
                      )}>
                      <div className="flex items-start gap-3">
                        <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                          eu.evidence.isRedHerring ? 'bg-gray-900 border border-gray-700' : 'bg-crime-red/15 border border-crime-red/20')}>
                          <Icon size={14} className={eu.evidence.isRedHerring ? 'text-gray-500' : 'text-crime-red'} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-crime-text-primary truncate">{eu.evidence.title}</p>
                          <p className="text-[10px] text-crime-text-faint capitalize mt-0.5">{eu.evidence.type}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-crime-border text-left">
                          <p className="text-xs text-crime-text-secondary leading-relaxed">{eu.evidence.description}</p>
                          {eu.evidence.contentText && (
                            <pre className="text-[11px] text-crime-text-muted mt-2 whitespace-pre-wrap font-mono bg-crime-black p-2 rounded">
                              {eu.evidence.contentText}
                            </pre>
                          )}
                          {eu.evidence.contentUrl && (
                            <a href={eu.evidence.contentUrl} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-crime-red hover:underline mt-2 block">
                              Ver ficheiro →
                            </a>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right — Chat + Participants */}
        <div className="w-60 border-l border-crime-border bg-crime-surface shrink-0 flex flex-col">
          {/* Participants */}
          <div className="p-3 border-b border-crime-border">
            <p className="text-[10px] font-mono uppercase tracking-widest text-crime-text-faint mb-2">Jogadores</p>
            <div className="space-y-1.5">
              {session.participants.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <div className={clsx('w-1.5 h-1.5 rounded-full shrink-0',
                    online.includes(p.user?.username ?? '') ? 'bg-green-400' : 'bg-crime-text-faint')}>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-crime-text-primary truncate">{p.user?.username || p.guestName}</p>
                    {p.character && <p className="text-[10px] text-crime-text-faint truncate">{p.character.name}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <p className="text-[10px] font-mono uppercase tracking-widest text-crime-text-faint p-3 pb-1">Chat</p>
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
              {chatMessages.map((msg, i) => (
                <div key={i} className="text-xs">
                  <span className="text-crime-red font-mono">{msg.username}: </span>
                  <span className="text-crime-text-secondary">{msg.message}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-2 border-t border-crime-border flex gap-1.5">
              <input type="text" className="input flex-1 text-xs py-1.5 px-2" placeholder="Mensagem..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              />
              <button onClick={handleSendChat} className="btn-primary p-1.5 shrink-0">
                <Send size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  /**
   *   
  function handleSendChat() {
    if (!chatInput.trim()) return
    sendChat(chatInput)
    setChatMessages((prev) => [...prev, { username: user?.username ?? 'Tu', message: chatInput.trim(), timestamp: new Date().toISOString() }])
    setChatInput('')
  }
   */
}
