'use client'

import { useState } from 'react'
import { Plus, Loader2, Users, Clock, ChevronRight, Play, PauseCircle, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { useMySessions } from '@/hooks/useSession'
import { GameSession, SessionStatus } from '@/types/game'
import { formatDate } from '@/lib/shop.utils'

const statusConfig: Record<SessionStatus, { color: string; label: string }> = {
  pending:   { color: 'bg-yellow-950 text-yellow-400', label: 'Aguardar' },
  active:    { color: 'bg-green-950 text-green-400',   label: 'A decorrer' },
  paused:    { color: 'bg-blue-950 text-blue-400',     label: 'Pausada' },
  completed: { color: 'bg-crime-muted text-crime-text-faint', label: 'Concluída' },
  cancelled: { color: 'bg-red-950 text-red-400',       label: 'Cancelada' },
}

export default function SessionsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useMySessions(page)
  const sessions: GameSession[] = data?.sessions ?? []

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-2">Investigações</p>
          <h1 className="text-3xl font-bold text-crime-text-primary">As Minhas Sessões</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/sessions/join" className="btn-secondary gap-2">Entrar com Código</Link>
          <Link href="/dashboard/sessions/new" className="btn-primary gap-2"><Plus size={16} /> Nova Sessão</Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="text-crime-red animate-spin" /></div>
      ) : sessions.length === 0 ? (
        <div className="card p-16 text-center">
          <span className="text-5xl mb-4 block">🎮</span>
          <h2 className="text-xl font-bold text-crime-text-primary mb-2">Sem sessões</h2>
          <p className="text-crime-text-muted text-sm mb-6">Cria uma nova sessão ou entra com um código.</p>
          <Link href="/dashboard/sessions/new" className="btn-primary inline-flex gap-2"><Plus size={16} /> Nova Sessão</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const cfg = statusConfig[s.status]
            const path = s.status === 'completed' ? `/dashboard/sessions/${s.id}/results` : `/dashboard/sessions/${s.id}/lobby`
            return (
              <Link key={s.id} href={path} className="card p-5 flex items-center gap-5 hover:border-crime-red/30 transition-all group">
                <div className="w-14 h-14 rounded-lg bg-crime-black overflow-hidden shrink-0 flex items-center justify-center border border-crime-border">
                  {s.case.coverImageUrl ? <img src={s.case.coverImageUrl} alt={s.case.title} className="w-full h-full object-cover" /> : <span className="text-2xl opacity-20">🔍</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-crime-text-primary text-sm">{s.case.title}</span>
                    <span className={clsx('badge text-[10px]', cfg.color)}>{cfg.label}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-crime-text-faint">
                    <span className="flex items-center gap-1"><Users size={10} /> {s.participants.length}/{s.case.maxPlayers}</span>
                    <span className="font-mono tracking-wider">{s.accessCode}</span>
                    <span>{formatDate(s.createdAt)}</span>
                  </div>
                  {s.currentStage && <p className="text-[11px] text-crime-text-faint mt-1">📍 {s.currentStage.title}</p>}
                </div>
                <ChevronRight size={16} className="text-crime-text-faint group-hover:text-crime-red transition-colors shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
