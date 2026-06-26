'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Eye, EyeOff, Star, StarOff, Trash2, Pencil, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import Link from 'next/link'
import api from '@/lib/api'
import { difficultyMap, caseTypeMap, formatPrice } from '@/lib/shop.utils'
import { Case } from '@/types/shop'

export default function AdminCasesPage() {
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'cases', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '15' })
      if (search) params.set('search', search)
      const res = await api.get(`/cases/admin/all?${params}`)
      return res.data.data
    },
  })

  const togglePublish = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      await api.patch(`/cases/${id}/publish`, { isPublished })
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'cases'] }); toast.success('Estado atualizado') },
    onError: () => toast.error('Erro ao atualizar'),
  })

  const toggleFeatured = useMutation({
    mutationFn: async ({ id, isFeatured }: { id: string; isFeatured: boolean }) => {
      await api.patch(`/cases/${id}/featured`, { isFeatured })
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'cases'] }); toast.success('Destaque atualizado') },
    onError: () => toast.error('Erro ao atualizar'),
  })

  const deleteCase = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/cases/${id}`) },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'cases'] }); toast.success('Caso eliminado') },
    onError: () => toast.error('Erro ao eliminar'),
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-2">Administração</p>
          <h1 className="text-3xl font-bold text-crime-text-primary">Gestão de Casos</h1>
        </div>
        <Link href="/dashboard/admin/cases/new" className="btn-primary gap-2">
          <Plus size={16} /> Novo Caso
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-6">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-crime-text-faint" />
        <input type="text" className="input pl-9" placeholder="Pesquisar casos..."
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-crime-border bg-crime-black/50">
                {['Caso', 'Tipo', 'Dificuldade', 'Preço Digital', 'Preço Físico', 'Estado', 'Ações'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-mono uppercase tracking-widest text-crime-text-faint">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <Loader2 size={24} className="animate-spin text-crime-red mx-auto" />
                </td></tr>
              ) : data?.cases?.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-crime-text-faint">Nenhum caso encontrado</td></tr>
              ) : (
                data?.cases?.map((c: Case) => (
                  <tr key={c.id} className="border-b border-crime-border/50 hover:bg-crime-muted/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-crime-black overflow-hidden flex items-center justify-center shrink-0">
                          {c.coverImageUrl
                            ? <img src={c.coverImageUrl} alt={c.title} className="w-full h-full object-cover" />
                            : <span className="text-lg opacity-20">🔍</span>
                          }
                        </div>
                        <div>
                          <p className="font-medium text-crime-text-primary">{c.title}</p>
                          <p className="text-[10px] text-crime-text-faint font-mono">{c.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-crime-text-muted text-xs">
                      {caseTypeMap[c.type].icon} {caseTypeMap[c.type].label}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className={difficultyMap[c.difficulty].color}>
                        {'★'.repeat(difficultyMap[c.difficulty].stars)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-crime-text-muted">{formatPrice(c.priceDigital)}</td>
                    <td className="px-4 py-3 text-crime-text-muted">{formatPrice(c.pricePhysical)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={clsx('badge text-[10px]',
                          c.isPublished ? 'bg-green-950 text-green-400' : 'bg-crime-muted text-crime-text-faint')}>
                          {c.isPublished ? 'Publicado' : 'Rascunho'}
                        </span>
                        {c.isFeatured && (
                          <span className="badge bg-crime-red/20 text-crime-red text-[10px]">⭐</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link href={`/dashboard/admin/cases/${c.id}/edit`}
                          className="btn-ghost p-1.5 rounded text-crime-text-faint hover:text-crime-text-primary">
                          <Pencil size={14} />
                        </Link>
                        <button
                          onClick={() => togglePublish.mutate({ id: c.id, isPublished: !c.isPublished })}
                          className="btn-ghost p-1.5 rounded text-crime-text-faint hover:text-crime-text-primary"
                          title={c.isPublished ? 'Despublicar' : 'Publicar'}
                        >
                          {c.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={() => toggleFeatured.mutate({ id: c.id, isFeatured: !c.isFeatured })}
                          className="btn-ghost p-1.5 rounded text-crime-text-faint hover:text-yellow-400"
                          title={c.isFeatured ? 'Remover destaque' : 'Destacar'}
                        >
                          {c.isFeatured ? <StarOff size={14} /> : <Star size={14} />}
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget({ id: c.id, title: c.title })
                          }}
                          className="btn-ghost p-1.5 rounded text-crime-text-faint hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data?.meta && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-crime-border">
            <p className="text-xs text-crime-text-faint">{data.meta.total} casos · página {page} de {data.meta.totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost text-xs py-1.5 px-3">← Anterior</button>
              <button onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))} disabled={page === data.meta.totalPages} className="btn-ghost text-xs py-1.5 px-3">Próxima →</button>
            </div>
          </div>
        )}
        </div>
      {/* Modal de confirmação de deleção */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="card p-6 max-w-sm w-full space-y-4">
            <h2 className="font-bold text-crime-text-primary">Eliminar Caso</h2>
            <p className="text-sm text-crime-text-muted">
              Tens a certeza que queres eliminar{' '}
              <strong className="text-crime-text-primary">"{deleteTarget.title}"</strong>?
              Esta ação é irreversível.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="btn-ghost text-sm">
                Cancelar
              </button>
              <button
                onClick={() => { deleteCase.mutate(deleteTarget.id); setDeleteTarget(null) }}
                disabled={deleteCase.isPending}
                className="btn-danger text-sm"
              >
                {deleteCase.isPending ? 'A eliminar...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}