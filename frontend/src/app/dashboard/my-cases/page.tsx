'use client'

import { useQuery } from '@tanstack/react-query'
import { Loader2, PlayCircle, Clock, Users, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'
import { difficultyMap, formatDuration } from '@/lib/shop.utils'
import { clsx } from 'clsx'

export default function MyCasesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['cases', 'my-access'],
    queryFn: async () => {
      const res = await api.get('/cases/my-access')
      return res.data.data.cases as any[]
    },
  })

  const cases = data ?? []

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-2">Biblioteca</p>
        <h1 className="text-3xl font-bold text-crime-text-primary">Os Meus Casos</h1>
        <p className="text-crime-text-muted text-sm mt-1">
          Casos que adquiriste e podes jogar a qualquer momento.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-crime-red" />
        </div>
      ) : cases.length === 0 ? (
        <div className="card p-16 text-center">
          <span className="text-5xl block mb-5 opacity-20">🔍</span>
          <p className="text-crime-text-muted mb-1">Ainda não tens casos adquiridos.</p>
          <p className="text-crime-text-faint text-sm mb-6">
            Explora o catálogo e compra um caso para começar a investigar.
          </p>
          <Link href="/dashboard/cases" className="btn-primary gap-2 inline-flex">
            <ShoppingBag size={15} /> Ver Catálogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cases.map((c: any) => {
            const diff = difficultyMap[c.difficulty]
            return (
              <div key={c.id} className="card overflow-hidden group hover:border-crime-red/30 transition-all">
                {/* Cover */}
                <div className="aspect-[16/9] bg-crime-black flex items-center justify-center overflow-hidden">
                  {c.coverImageUrl
                    ? <img
                        src={c.coverImageUrl}
                        alt={c.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    : <span className="text-4xl opacity-15">🔍</span>
                  }
                </div>

                <div className="p-4 space-y-3">
                  <h2 className="font-semibold text-crime-text-primary text-sm leading-snug line-clamp-2">
                    {c.title}
                  </h2>

                  <div className="flex items-center gap-4 text-xs text-crime-text-faint">
                    <span className={clsx('flex items-center gap-1', diff.color)}>
                      {'★'.repeat(diff.stars)} {diff.label}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={10} /> {c.minPlayers}–{c.maxPlayers}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} /> {formatDuration(c.estimatedMinutes)}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Link
                      href={`/dashboard/sessions/new?caseId=${c.id}`}
                      className="btn-primary flex-1 text-xs py-2 gap-1.5 justify-center"
                    >
                      <PlayCircle size={13} /> Criar Sessão
                    </Link>
                    <Link
                      href={`/dashboard/cases/${c.slug}`}
                      className="btn-ghost text-xs py-2 px-3"
                    >
                      Detalhes
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
