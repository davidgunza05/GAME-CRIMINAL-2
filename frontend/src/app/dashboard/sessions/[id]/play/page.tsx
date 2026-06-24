'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useSession, useSessionEvidence, useCaseStages } from '@/hooks/useSession'
import { useGameSocket } from '@/hooks/useGameSocket'
import { useAuthStore } from '@/store/auth.store'
import { GameSession, EvidenceUnlock, ChatMessage } from '@/types/game'
import GameLayout from '@/components/game/GameLayout'
import GameHUD from '@/components/game/hud/GameHUD'
import StageNavigator from '@/components/game/board/StageNavigator'
import EvidenceBoard from '@/components/game/board/EvidenceBoard'
import MyCharacterCard from '@/components/game/character/MyCharacterCard'
import GameChat from '@/components/game/GameChat'

export default function PlayPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const { user } = useAuthStore()

  const [session, setSession] = useState<GameSession | null>(null)
  const [unlockedEvidence, setUnlockedEvidence] = useState<EvidenceUnlock[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

  const { data: initialSession, isLoading } = useSession(id)
  const { data: evidenceData } = useSessionEvidence(id)
  const { data: stages } = useCaseStages(session?.caseId ?? '')

  useEffect(() => { if (initialSession) setSession(initialSession) }, [initialSession])
  useEffect(() => { if (evidenceData) setUnlockedEvidence(evidenceData) }, [evidenceData])

  const { connected, online, sendChat } = useGameSocket({
    sessionId: id,
    onSessionUpdate: setSession,
    onEvidenceUnlocked: (data) => {
      setUnlockedEvidence((prev) => {
        if (prev.find((e) => e.evidenceId === data.unlock.evidenceId)) return prev
        return [...prev, data.unlock]
      })
    },
    onSessionCompleted: () => router.push(`/dashboard/sessions/${id}/results`),
  })

  const handleSendChat = (msg: string) => {
    sendChat(msg)
    setChatMessages((prev) => [...prev, {
      username: user?.username ?? 'Tu',
      message: msg,
      timestamp: new Date().toISOString(),
    }])
  }

  if (isLoading || !session) return (
    <div className="min-h-screen bg-[#050509] flex items-center justify-center">
      <Loader2 size={28} className="text-red-800 animate-spin" />
    </div>
  )

  const myParticipant = session.participants.find((p) => p.userId === user?.id)

  return (
    <GameLayout
      topBar={
        <GameHUD
          session={session}
          connected={connected}
          onlineCount={online.length}
        />
      }
      sideLeft={
        <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
          {/* My character */}
          {myParticipant?.character && (
            <div style={{ padding: '0 12px' }}>
              <MyCharacterCard character={myParticipant.character as any} />
            </div>
          )}

          {/* Stage nav */}
          {stages && stages.length > 0 && (
            <div style={{ flex: 1 }}>
              <StageNavigator stages={stages} session={session} />
            </div>
          )}
        </div>
      }
      sideRight={
        <GameChat
          messages={chatMessages}
          participants={session.participants}
          onlineUsers={online}
          onSend={handleSendChat}
          currentUsername={user?.username}
        />
      }
    >
      <EvidenceBoard
        unlocked={unlockedEvidence}
        stageTitle={session.currentStage?.title}
        stageDescription={session.currentStage?.description}
        isLastStage={session.currentStage?.isLast}
      />
    </GameLayout>
  )
}
