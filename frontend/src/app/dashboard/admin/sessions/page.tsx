'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'
import api from '@/lib/api'
import { formatDate } from '@/lib/shop.utils'
import { SessionStatus } from '@/types/game'

const statusColors: Record<SessionStatus, string> = {
  pending:   'bg-yellow-950 text-yellow-400',
  active:    'bg-green-950 text-green-400',
  paused:    'bg-blue-950 text-blue-400',
  completed: 'bg-crime-muted text-crime-text-faint',
  cancelled: 'bg-red-950 text-red-400',
}
const statusLabels: Record<SessionStatus, string> = {
  pending: 'Aguardar', active: 'A decorrer', paused: 'Pausada', completed: 'Concluída', cancelled: 'Cancelada',
}

export default function AdminSessionsPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'sessions', page, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (status) params.set('status', status)
      const r = await api.get(`/sessions/admin/all?${params}`)
      return r.data.data
    },
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-2">Administração</p>
        <h1 className="text-3xl font-bold text-crime-text-primary">Gestão de Sessões</h1>
      </div>

      <div className="flex gap-3 mb-6">
        <select className="input w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">Todos os estados</option>
          {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-crime-border bg-crime-black/50">
                {['Caso', 'Host', 'Jogadores', 'Estado', 'Stage Atual', 'Criada em', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-mono uppercase tracking-widest text-crime-text-faint">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <Loader2 size={24} className="animate-spin text-crime-red mx-auto" />
                </td></tr>
              ) : data?.sessions?.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-crime-text-faint">Nenhuma sessão encontrada</td></tr>
              ) : (
                data?.sessions?.map((s: any) => (
                  <tr key={s.id} className="border-b border-crime-border/50 hover:bg-crime-muted/10 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-crime-text-primary font-medium">{s.case?.title}</p>
                    </td>
                    <td className="px-4 py-3 text-crime-text-muted text-xs">@{s.host?.username}</td>
                    <td className="px-4 py-3 text-crime-text-muted">{s.participants?.length}</td>
                    <td className="px-4 py-3">
                      <span className={clsx('badge text-[10px]', statusColors[s.status as SessionStatus])}>
                        {statusLabels[s.status as SessionStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-crime-text-faint text-xs">
                      {s.currentStage?.title ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-crime-text-faint text-xs">{formatDate(s.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/sessions/${s.id}/lobby`}
                        className="btn-ghost p-1.5 rounded text-crime-text-faint hover:text-crime-text-primary">
                        <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data?.meta && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-crime-border">
            <p className="text-xs text-crime-text-faint">{data.meta.total} sessões · página {page}/{data.meta.totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost text-xs py-1.5 px-3">← Anterior</button>
              <button onClick={() => setPage(p => Math.min(data.meta.totalPages, p + 1))} disabled={page === data.meta.totalPages} className="btn-ghost text-xs py-1.5 px-3">Próxima →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
