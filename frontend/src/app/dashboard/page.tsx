'use client'

import { useQuery } from '@tanstack/react-query'
import { ShoppingBag, Gamepad2, Trophy, TrendingUp, PlayCircle, Plus, ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { useAuthStore } from '@/store/auth.store'
import api from '@/lib/api'
import { formatDate } from '@/lib/shop.utils'

function StatCard({ label, value, icon: Icon, color, isLoading }: {
  label: string; value: number | string; icon: React.ElementType; color: string; isLoading?: boolean
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono uppercase tracking-widest text-crime-text-faint">{label}</span>
        <Icon size={16} className={color} />
      </div>
      {isLoading
        ? <div className="h-9 w-16 bg-crime-muted animate-pulse rounded" />
        : <p className="text-3xl font-bold text-crime-text-primary">{value}</p>
      }
    </div>
  )
}

const SESSION_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Aguardar',   color: 'text-yellow-400 bg-yellow-950' },
  active:    { label: 'A decorrer', color: 'text-green-400 bg-green-950' },
  paused:    { label: 'Pausada',    color: 'text-blue-400 bg-blue-950' },
  completed: { label: 'Concluída',  color: 'text-crime-text-faint bg-crime-muted' },
  cancelled: { label: 'Cancelada',  color: 'text-red-400 bg-red-950' },
}

export default function DashboardPage() {
  const { user } = useAuthStore()

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['users', 'me', 'stats'],
    queryFn: async () => {
      const res = await api.get('/users/me/stats')
      return res.data.data
    },
  })

  const { data: sessionsData, isLoading: loadingSessions } = useQuery({
    queryKey: ['sessions', 'my', 'recent'],
    queryFn: async () => {
      const res = await api.get('/sessions/my?page=1&limit=4')
      return res.data.data
    },
  })

  const { data: myCases, isLoading: loadingCases } = useQuery({
    queryKey: ['cases', 'my-access'],
    queryFn: async () => {
      const res = await api.get('/cases/my-access')
      return res.data.data.cases as any[]
    },
  })

  const recentSessions: any[] = sessionsData?.sessions ?? []
  const ownedCases: any[] = myCases ?? []
  const activeSessions = recentSessions.filter((s) => ['pending', 'active', 'paused'].includes(s.status))

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-2">
          Painel do Detetive
        </p>
        <h1 className="text-3xl font-bold text-crime-text-primary">
          Bem-vindo, {user?.displayName || user?.username}
        </h1>
        <p className="text-crime-text-muted mt-1 text-sm">
          {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Casos Comprados"  value={stats?.casesBought ?? 0}      icon={ShoppingBag} color="text-purple-400" isLoading={loadingStats} />
        <StatCard label="Sessões Jogadas"  value={stats?.sessionsTotal ?? 0}     icon={Gamepad2}    color="text-blue-400"   isLoading={loadingStats} />
        <StatCard label="Casos Resolvidos" value={stats?.sessionsCompleted ?? 0} icon={Trophy}      color="text-crime-red"  isLoading={loadingStats} />
        <StatCard label="XP Total"         value={stats?.totalXp ?? 0}           icon={TrendingUp}  color="text-green-400"  isLoading={loadingStats} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Sessões recentes */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint">
              Sessões Recentes
            </p>
            <Link href="/dashboard/sessions" className="text-xs text-crime-red hover:text-red-400 transition-colors flex items-center gap-1">
              Ver todas <ArrowRight size={11} />
            </Link>
          </div>

          {loadingSessions ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-14 bg-crime-muted animate-pulse rounded-lg" />)}
            </div>
          ) : recentSessions.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl block mb-3 opacity-20">🎮</span>
              <p className="text-sm text-crime-text-muted mb-4">Ainda não participaste em nenhuma sessão.</p>
              <Link href="/dashboard/sessions/new" className="btn-primary text-sm gap-1.5 inline-flex">
                <Plus size={13} /> Criar Sessão
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((s) => {
                const st = SESSION_STATUS_LABEL[s.status] ?? SESSION_STATUS_LABEL.pending
                const isActive = ['pending', 'active', 'paused'].includes(s.status)
                return (
                  <Link
                    key={s.id}
                    href={isActive ? `/dashboard/sessions/${s.id}/lobby` : `/dashboard/sessions/${s.id}/results`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-crime-muted/30 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded bg-crime-black border border-crime-border flex items-center justify-center shrink-0 overflow-hidden">
                      {s.case?.coverImageUrl
                        ? <img src={s.case.coverImageUrl} alt="" className="w-full h-full object-cover" />
                        : <span className="text-xs opacity-30">🔍</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-crime-text-primary truncate group-hover:text-crime-red transition-colors">
                        {s.case?.title}
                      </p>
                      <p className="text-[11px] text-crime-text-faint flex items-center gap-1">
                        <Clock size={9} /> {formatDate(s.createdAt)}
                      </p>
                    </div>
                    <span className={clsx('text-[10px] px-2 py-0.5 rounded font-mono', st.color)}>
                      {st.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Os meus casos */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint">
              Os Meus Casos
            </p>
            <Link href="/dashboard/my-cases" className="text-xs text-crime-red hover:text-red-400 transition-colors flex items-center gap-1">
              Ver todos <ArrowRight size={11} />
            </Link>
          </div>

          {loadingCases ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-14 bg-crime-muted animate-pulse rounded-lg" />)}
            </div>
          ) : ownedCases.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl block mb-3 opacity-20">🔍</span>
              <p className="text-sm text-crime-text-muted mb-4">Ainda não adquiriste nenhum caso.</p>
              <Link href="/dashboard/cases" className="btn-primary text-sm gap-1.5 inline-flex">
                <ShoppingBag size={13} /> Ver Catálogo
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {ownedCases.slice(0, 4).map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-crime-muted/30 transition-colors group">
                  <div className="w-8 h-8 rounded bg-crime-black border border-crime-border flex items-center justify-center shrink-0 overflow-hidden">
                    {c.coverImageUrl
                      ? <img src={c.coverImageUrl} alt="" className="w-full h-full object-cover" />
                      : <span className="text-xs opacity-30">🔍</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-crime-text-primary truncate">{c.title}</p>
                    <p className="text-[11px] text-crime-text-faint">{c.estimatedMinutes} min · {c.type}</p>
                  </div>
                  <Link
                    href={`/dashboard/sessions/new?caseId=${c.id}`}
                    className="btn-ghost text-[11px] py-1 px-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                  >
                    <PlayCircle size={11} /> Jogar
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        {[
          { href: '/dashboard/cases',        icon: '🔍', label: 'Catálogo' },
          { href: '/dashboard/sessions/new', icon: '🎮', label: 'Nova Sessão' },
          { href: '/dashboard/leaderboard',  icon: '🏆', label: 'Leaderboard' },
          { href: '/dashboard/profile',      icon: '👤', label: 'Perfil' },
        ].map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className="card p-4 text-center hover:border-crime-red/30 hover:bg-crime-red/5 transition-all group"
          >
            <span className="text-2xl block mb-2">{icon}</span>
            <span className="text-xs text-crime-text-muted group-hover:text-crime-red transition-colors font-mono">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
