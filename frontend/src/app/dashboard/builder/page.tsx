'use client'

import { useState } from 'react'
import { Plus, Loader2, ChevronRight, FileEdit, Send, CheckCircle, XCircle, Clock, Eye } from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { useMyBuilderCases, useDeleteBuilderCase } from '@/hooks/useBuilder'
import { formatDate } from '@/lib/shop.utils'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft:         { label: 'Rascunho',      color: 'bg-crime-muted text-crime-text-faint', icon: FileEdit },
  submitted:     { label: 'Submetido',     color: 'bg-blue-950 text-blue-400',            icon: Send },
  under_review:  { label: 'Em revisão',    color: 'bg-yellow-950 text-yellow-400',        icon: Clock },
  approved:      { label: 'Aprovado',      color: 'bg-green-950 text-green-400',          icon: CheckCircle },
  rejected:      { label: 'Rejeitado',     color: 'bg-red-950 text-red-400',              icon: XCircle },
  published:     { label: 'Publicado',     color: 'bg-crime-red/15 text-crime-red',       icon: Eye },
}

export default function BuilderPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useMyBuilderCases(page)
  const deleteCase = useDeleteBuilderCase()
  const submissions = data?.submissions ?? []

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-2">Case Builder</p>
          <h1 className="text-3xl font-bold text-crime-text-primary">Os Meus Casos</h1>
          <p className="text-crime-text-muted text-sm mt-1">Cria e gere os teus casos investigativos</p>
        </div>
        <Link href="/dashboard/builder/new" className="btn-primary gap-2">
          <Plus size={16} /> Novo Caso
        </Link>
      </div>

      {/* Info banner */}
      <div className="card p-4 mb-6 border-blue-800/30 bg-blue-950/20">
        <p className="text-sm text-blue-300 leading-relaxed">
          <span className="font-bold">Como funciona:</span> Cria o teu caso (informações, stages, personagens, evidências) → Submete para revisão → O admin aprova → O caso é publicado na plataforma.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="text-crime-red animate-spin" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="card p-16 text-center">
          <span className="text-5xl mb-4 block">✏️</span>
          <h2 className="text-xl font-bold text-crime-text-primary mb-2">Nenhum caso criado</h2>
          <p className="text-crime-text-muted text-sm mb-6">Começa a construir o teu primeiro caso investigativo.</p>
          <Link href="/dashboard/builder/new" className="btn-primary inline-flex gap-2">
            <Plus size={16} /> Criar Primeiro Caso
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub: any) => {
            const cfg = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG.draft
            const StatusIcon = cfg.icon
            const isEditable = ['draft', 'rejected'].includes(sub.status)

            return (
              <div key={sub.id} className="card p-5 flex items-center gap-5 hover:border-crime-red/20 transition-all">
                {/* Cover */}
                <div className="w-14 h-14 rounded-lg bg-crime-black overflow-hidden shrink-0 flex items-center justify-center border border-crime-border">
                  {sub.case.coverImageUrl
                    ? <img src={sub.case.coverImageUrl} alt={sub.case.title} className="w-full h-full object-cover" />
                    : <span className="text-2xl opacity-20">🔍</span>
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-crime-text-primary text-sm">{sub.case.title}</span>
                    <span className={clsx('badge text-[10px]', cfg.color)}>
                      <StatusIcon size={10} className="mr-1" />
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-crime-text-faint font-mono">{sub.case.slug}</p>
                  {/* Rejection reason */}
                  {sub.status === 'rejected' && sub.rejectionReason && (
                    <p className="text-xs text-red-400 mt-1">
                      ⚠ {sub.rejectionReason}
                    </p>
                  )}
                  {/* Change requests */}
                  {sub.changeRequests && (
                    <p className="text-xs text-yellow-400 mt-1">
                      📝 {sub.changeRequests}
                    </p>
                  )}
                  <p className="text-[10px] text-crime-text-faint mt-1">{formatDate(sub.updatedAt)}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {isEditable && (
                    <Link href={`/dashboard/builder/${sub.case.id}/edit`} className="btn-secondary text-xs py-1.5 px-3 gap-1.5">
                      <FileEdit size={11} /> Editar
                    </Link>
                  )}
                  {sub.status === 'approved' && (
                    <Link href={`/dashboard/builder/${sub.case.id}/edit`} className="btn-primary text-xs py-1.5 px-3 gap-1.5">
                      <Eye size={11} /> Ver
                    </Link>
                  )}
                  {['draft', 'rejected'].includes(sub.status) && (
                    <button
                      onClick={() => { if (confirm(`Eliminar "${sub.case.title}"?`)) deleteCase.mutate(sub.case.id) }}
                      className="btn-ghost text-xs py-1.5 px-3 text-red-400 hover:text-red-300"
                    >
                      Eliminar
                    </button>
                  )}
                  <ChevronRight size={14} className="text-crime-text-faint" />
                </div>
              </div>
            )
          })}

          {data?.meta && data.meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">← Anterior</button>
              <button onClick={() => setPage(p => Math.min(data.meta.totalPages, p + 1))}
                disabled={page === data.meta.totalPages}
                className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">Próxima →</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
