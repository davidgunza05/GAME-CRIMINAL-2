'use client'

import { use } from 'react'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useSessionResults } from '@/hooks/useSession'
import GameResults from '@/components/game/results/GameResults'

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data, isLoading } = useSessionResults(id)

  if (isLoading) return (
    <div className="min-h-screen bg-[#050509] flex items-center justify-center">
      <Loader2 size={28} className="text-red-800 animate-spin" />
    </div>
  )

  if (!data) return (
    <div className="min-h-screen bg-[#050509] flex items-center justify-center text-center px-4">
      <div>
        <p style={{ color: '#555', marginBottom: 16, fontFamily: 'Georgia, serif' }}>Resultados não disponíveis</p>
        <Link href="/dashboard/sessions"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#888', padding: '10px 20px', borderRadius: 6, textDecoration: 'none', fontSize: 13 }}>
          Voltar
        </Link>
      </div>
    </div>
  )

  return (
    <GameResults
      session={data.session}
      killer={data.killer ?? null}
      stats={data.stats}
    />
  )
}
