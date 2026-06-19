'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Mail, MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react'
import { clsx } from 'clsx'
import api from '@/lib/api'
import { formatDate } from '@/lib/shop.utils'

const STATUS_STYLES: Record<string, string> = {
  queued:    'bg-yellow-950 text-yellow-400',
  sent:      'bg-green-950 text-green-400',
  failed:    'bg-red-950 text-red-400',
  cancelled: 'bg-crime-muted text-crime-text-faint',
}

const TYPE_LABELS: Record<string, string> = {
  session_invite:    'Convite',
  character_assigned:'Personagem',
  clue_unlocked:     'Pista',
  session_started:   'Início Sessão',
  session_completed: 'Fim Sessão',
  accusation_result: 'Acusação',
  welcome:           'Boas-vindas',
  password_reset:    'Reset Password',
}

export default function AdminCommsPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'comms', page, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '30' })
      if (status) params.set('status', status)
      const r = await api.get(`/game/admin/comms?${params}`)
      return r.data.data
    },
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-2">Administração</p>
        <h1 className="text-3xl font-bold text-crime-text-primary">Comunicações</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select className="input w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">Todos os estados</option>
          <option value="queued">Queued</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Stats cards */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total',     value: data.meta?.total ?? 0,                                    icon: Mail },
            { label: 'Enviadas',  value: (data.logs ?? []).filter((l: any) => l.status === 'sent').length,    icon: CheckCircle },
            { label: 'Falhou',    value: (data.logs ?? []).filter((l: any) => l.status === 'failed').length,  icon: XCircle },
            { label: 'Pendentes', value: (data.logs ?? []).filter((l: any) => l.status === 'queued').length,  icon: Clock },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="card p-4 flex items-center gap-3">
              <Icon size={18} className="text-crime-text-faint shrink-0" />
              <div>
                <p className="text-xl font-bold font-mono text-crime-text-primary">{value}</p>
                <p className="text-[10px] font-mono uppercase tracking-widest text-crime-text-faint">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-crime-border bg-crime-black/50">
                {['Canal', 'Tipo', 'Destinatário', 'Utilizador', 'Estado', 'Data', 'Erro'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-mono uppercase tracking-widest text-crime-text-faint">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <Loader2 size={24} className="animate-spin text-crime-red mx-auto" />
                </td></tr>
              ) : (data?.logs ?? []).length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-crime-text-faint text-sm">Sem comunicações registadas</td></tr>
              ) : (
                (data?.logs ?? []).map((log: any) => (
                  <tr key={log.id} className="border-b border-crime-border/50 hover:bg-crime-muted/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {log.channel === 'email'
                          ? <Mail size={13} className="text-blue-400" />
                          : <MessageSquare size={13} className="text-green-400" />
                        }
                        <span className="text-xs font-mono text-crime-text-muted capitalize">{log.channel}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-crime-text-muted">
                        {TYPE_LABELS[log.type] ?? log.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-crime-text-muted">{log.recipient}</td>
                    <td className="px-4 py-3 text-xs text-crime-text-faint">
                      {log.user ? `@${log.user.username}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('badge text-[10px]', STATUS_STYLES[log.status] ?? 'bg-crime-muted text-crime-text-faint')}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-crime-text-faint">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-3 text-xs text-red-400 max-w-[160px] truncate">
                      {log.errorMessage ?? '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data?.meta && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-crime-border">
            <p className="text-xs text-crime-text-faint">{data.meta.total} registos</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-40">← Anterior</button>
              <button onClick={() => setPage(p => Math.min(data.meta.totalPages, p + 1))}
                disabled={page === data.meta.totalPages}
                className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-40">Próxima →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
