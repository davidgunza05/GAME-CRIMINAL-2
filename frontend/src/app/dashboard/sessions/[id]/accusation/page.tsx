'use client'

import { use } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useSession, useSessionEvidence, useCaseCharacters, useSubmitAccusation } from '@/hooks/useSession'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import AccusationForm from '@/components/game/accusation/AccusationForm'

export default function AccusationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session, isLoading } = useSession(id)
  const { data: evidence } = useSessionEvidence(id)
  const { data: characters } = useCaseCharacters(session?.caseId ?? '')
  const submitAccusation = useSubmitAccusation(id)

  const { data: accusations } = useQuery({
    queryKey: ['sessions', id, 'accusations'],
    queryFn: async () => {
      const r = await api.get(`/sessions/${id}/accusations`)
      return r.data.data.accusations
    },
    enabled: !!id,
  })

  if (isLoading || !session) return (
    <div className="min-h-screen bg-[#050509] flex items-center justify-center">
      <Loader2 size={28} className="text-red-800 animate-spin" />
    </div>
  )

  const isLastStage = session.currentStage?.isLast
  const attemptNumber = (accusations?.length ?? 0) + 1

  if (!isLastStage) return (
    <div className="min-h-screen bg-[#050509] flex items-center justify-center text-center px-4">
      <div>
        <AlertCircle size={48} style={{ color: '#fbbf24', margin: '0 auto 16px' }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#E8E4DC', marginBottom: 8, fontFamily: 'Georgia, serif' }}>
          Ainda não é a hora
        </h1>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 24 }}>
          A acusação final só está disponível na última stage.
        </p>
        <Link href={`/dashboard/sessions/${id}/play`}
          style={{ background: '#C0392B', color: '#fff', padding: '10px 22px', borderRadius: 6, textDecoration: 'none', fontSize: 13 }}>
          Voltar à Investigação
        </Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#050509', padding: '40px 16px' }}>
      {/* Nav back */}
      <div style={{ maxWidth: 720, margin: '0 auto 24px' }}>
        <Link href={`/dashboard/sessions/${id}/play`}
          style={{ fontFamily: 'monospace', fontSize: 11, color: '#555', textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          ← Voltar ao Jogo
        </Link>
      </div>

      <AccusationForm
        characters={characters ?? []}
        evidence={evidence ?? []}
        attemptNumber={attemptNumber}
        onSubmit={async (data) => {
          const accusation = await submitAccusation.mutateAsync(data)
          return { result: accusation.result, feedbackText: accusation.feedbackText ?? '' }
        }}
      />
    </div>
  )
}
