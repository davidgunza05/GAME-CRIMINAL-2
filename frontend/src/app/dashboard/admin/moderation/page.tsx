'use client'

import { useState } from 'react'
import { Loader2, ChevronRight, Clock, CheckCircle, XCircle, Eye, Send, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { useAdminSubmissions } from '@/hooks/useBuilder'
import { formatDate } from '@/lib/shop.utils'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft:        { label: 'Rascunho',    color: 'bg-crime-muted text-crime-text-faint', icon: BookOpen },
  submitted:    { label: 'Submetido',   color: 'bg-blue-950 text-blue-400',            icon: Send },
  under_review: { label: 'Em Revisão',  color: 'bg-yellow-950 text-yellow-400',        icon: Clock },
  approved:     { label: 'Aprovado',    color: 'bg-green-950 text-green-400',          icon: CheckCircle },
  rejected:     { label: 'Rejeitado',   color: 'bg-red-950 text-red-400',             icon: XCircle },
  published:    { label: 'Publicado',   color: 'bg-crime-red/15 text-crime-red',       icon: Eye },
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'submitted', label: 'A rever (submetidos)' },
  { value: 'under_review', label: 'Em revisão' },
  { value: 'approved', label: 'Aprovados' },
  { value: 'rejected', label: 'Rejeitados' },
  { value: 'published', label: 'Publicados' },
  { value: 'draft', label: 'Rascunhos' },
]

export default function AdminModerationPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('submitted')
  const { data, isLoading } = useAdminSubmissions(page, status)

  const pending = data?.submissions?.filter((s: any) =>
    ['submitted', 'under_review'].includes(s.status)
  ).length ?? 0

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-2">Administração</p>
        <h1 className="text-3xl font-bold text-crime-text-primary">Fila de Moderação</h1>
        {pending > 0 && (
          <p className="text-yellow-400 text-sm mt-1 font-mono">
            ⚠ {pending} caso(s) aguardam revisão
          </p>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap mb-6">
        {STATUS_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => { setStatus(value); setPage(1) }}
            className={clsx(
              'px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all border',
              status === value
                ? 'border-crime-red bg-crime-red/10 text-crime-red'
                : 'border-crime-border text-crime-text-faint hover:border-crime-red/30'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="text-crime-red animate-spin" />
        </div>
      ) : data?.submissions?.length === 0 ? (
        <div className="card p-16 text-center">
          <span className="text-5xl mb-4 block">📋</span>
          <p className="text-crime-text-muted text-sm">Nenhuma submissão neste estado</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-crime-border bg-crime-black/50">
                {['Caso', 'Autor', 'Conteúdo', 'Estado', 'Submetido', 'Ações'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-mono uppercase tracking-widest text-crime-text-faint">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.submissions.map((sub: any) => {
                const cfg = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG.draft
                const StatusIcon = cfg.icon
                const isUrgent = sub.status === 'submitted'

                return (
                  <tr key={sub.id}
                    className={clsx('border-b border-crime-border/50 hover:bg-crime-muted/10 transition-colors', isUrgent && 'bg-blue-950/10')}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-crime-black border border-crime-border overflow-hidden flex items-center justify-center shrink-0">
                          {sub.case?.coverImageUrl
                            ? <img src={sub.case.coverImageUrl} className="w-full h-full object-cover" />
                            : <span className="text-base opacity-20">🔍</span>
                          }
                        </div>
                        <div>
                          <p className="font-medium text-crime-text-primary">{sub.case?.title}</p>
                          <p className="text-[10px] text-crime-text-faint font-mono">{sub.case?.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-crime-text-secondary text-xs">{sub.author?.displayName || sub.author?.username}</p>
                      <p className="text-[10px] text-crime-text-faint">@{sub.author?.username}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3 font-mono text-xs text-crime-text-faint">
                        <span>{sub.case?._count?.stages ?? 0} stages</span>
                        <span>{sub.case?._count?.characters ?? 0} chars</span>
                        <span>{sub.case?._count?.evidence ?? 0} ev.</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('badge text-[10px]', cfg.color)}>
                        <StatusIcon size={10} className="mr-1 inline" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-crime-text-faint font-mono">
                      {sub.submittedAt ? formatDate(sub.submittedAt) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/admin/moderation/${sub.id}`}
                        className={clsx(
                          'inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border transition-all',
                          isUrgent
                            ? 'bg-blue-950 border-blue-700 text-blue-300 hover:bg-blue-900'
                            : 'border-crime-border text-crime-text-faint hover:border-crime-red/40 hover:text-crime-text-primary'
                        )}
                      >
                        <Eye size={11} />
                        {isUrgent ? 'Rever' : 'Ver'}
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {data?.meta && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-crime-border">
              <p className="text-xs text-crime-text-faint">{data.meta.total} submissões</p>
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
      )}
    </div>
  )
}
