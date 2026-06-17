'use client'

import { useState, useCallback } from 'react'
import { Search, SlidersHorizontal, X, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { useCases, useCaseTags } from '@/hooks/useShop'
import CaseCard from '@/components/cases/CaseCard'
import { CaseDifficulty, CaseType } from '@/types/shop'
import { difficultyMap, caseTypeMap } from '@/lib/shop.utils'

const DIFFICULTIES: CaseDifficulty[] = ['one', 'two', 'three', 'four', 'five']
const TYPES: CaseType[] = ['digital', 'physical', 'hybrid']
const SORT_OPTIONS = [
  { value: 'sortOrder-asc',      label: 'Em destaque' },
  { value: 'createdAt-desc',     label: 'Mais recentes' },
  { value: 'priceDigital-asc',   label: 'Preço crescente' },
  { value: 'priceDigital-desc',  label: 'Preço decrescente' },
  { value: 'difficulty-asc',     label: 'Mais fáceis' },
  { value: 'difficulty-desc',    label: 'Mais difíceis' },
]

export default function CasesPage() {
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState<CaseDifficulty | ''>('')
  const [type, setType] = useState<CaseType | ''>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sort, setSort] = useState('sortOrder-asc')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const [sortBy, sortOrder] = sort.split('-') as [string, 'asc' | 'desc']

  const params = {
    page, limit: 12,
    ...(search && { search }),
    ...(difficulty && { difficulty }),
    ...(type && { type }),
    ...(selectedTags.length && { tags: selectedTags.join(',') }),
    sortBy, sortOrder,
  }

  const { data, isLoading } = useCases(params)
  const { data: allTags } = useCaseTags()

  const resetFilters = useCallback(() => {
    setSearch(''); setDifficulty(''); setType('')
    setSelectedTags([]); setSort('sortOrder-asc'); setPage(1)
  }, [])

  const hasFilters = search || difficulty || type || selectedTags.length > 0
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
    setPage(1)
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-2">Loja</p>
        <h1 className="text-3xl font-bold text-crime-text-primary">Catálogo de Casos</h1>
        {data?.meta && (
          <p className="text-crime-text-muted text-sm mt-1">
            {data.meta.total} {data.meta.total === 1 ? 'caso disponível' : 'casos disponíveis'}
          </p>
        )}
      </div>

      {/* Search + Sort */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-crime-text-faint" />
          <input type="text" className="input pl-9" placeholder="Pesquisar casos..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="input w-52" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1) }}>
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button onClick={() => setShowFilters((f) => !f)}
          className={clsx('btn-secondary gap-2', showFilters && 'border-crime-red text-crime-red')}>
          <SlidersHorizontal size={14} /> Filtros
          {hasFilters && (
            <span className="w-4 h-4 rounded-full bg-crime-red text-white text-[9px] flex items-center justify-center font-bold">
              {[difficulty, type, ...selectedTags].filter(Boolean).length}
            </span>
          )}
        </button>
        {hasFilters && (
          <button onClick={resetFilters} className="btn-ghost gap-1 text-crime-text-faint">
            <X size={14} /> Limpar
          </button>
        )}
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="card p-5 mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="label mb-3">Dificuldade</p>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((d) => (
                <button key={d} onClick={() => { setDifficulty(difficulty === d ? '' : d); setPage(1) }}
                  className={clsx('text-xs px-3 py-1.5 rounded border transition-all',
                    difficulty === d ? 'border-crime-red bg-crime-red/10 text-crime-red'
                      : 'border-crime-border text-crime-text-faint hover:border-crime-red/50')}>
                  {difficultyMap[d].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="label mb-3">Formato</p>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button key={t} onClick={() => { setType(type === t ? '' : t); setPage(1) }}
                  className={clsx('text-xs px-3 py-1.5 rounded border transition-all',
                    type === t ? 'border-crime-red bg-crime-red/10 text-crime-red'
                      : 'border-crime-border text-crime-text-faint hover:border-crime-red/50')}>
                  {caseTypeMap[t].icon} {caseTypeMap[t].label}
                </button>
              ))}
            </div>
          </div>
          {allTags && allTags.length > 0 && (
            <div>
              <p className="label mb-3">Tags</p>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {allTags.map((tag: string) => (
                  <button key={tag} onClick={() => toggleTag(tag)}
                    className={clsx('text-[10px] px-2 py-1 rounded font-mono border transition-all',
                      selectedTags.includes(tag) ? 'border-crime-red bg-crime-red/10 text-crime-red'
                        : 'border-crime-border text-crime-text-faint hover:border-crime-red/50')}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="text-crime-red animate-spin" />
        </div>
      ) : data?.cases?.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-crime-text-primary mb-2">Nenhum caso encontrado</h2>
          <p className="text-sm text-crime-text-muted mb-6">Tenta ajustar os filtros ou a pesquisa.</p>
          <button onClick={resetFilters} className="btn-secondary mx-auto">Limpar filtros</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {data?.cases?.map((c: any) => <CaseCard key={c.id} case={c} />)}
          </div>

          {/* Pagination */}
          {data?.meta && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">← Anterior</button>
              <div className="flex gap-1">
                {Array.from({ length: data.meta.totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === data.meta.totalPages || Math.abs(p - page) <= 1)
                  .reduce((acc: (number | '...')[], p, i, arr) => {
                    if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...')
                    acc.push(p); return acc
                  }, [])
                  .map((p, i) => p === '...'
                    ? <span key={`d${i}`} className="px-2 py-2 text-crime-text-faint text-sm">…</span>
                    : <button key={p} onClick={() => setPage(p as number)}
                        className={clsx('w-9 h-9 rounded text-sm transition-all',
                          page === p ? 'bg-crime-red text-white' : 'text-crime-text-muted hover:bg-crime-muted/30')}>
                        {p}
                      </button>
                  )}
              </div>
              <button onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                disabled={page === data.meta.totalPages}
                className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">Próxima →</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
