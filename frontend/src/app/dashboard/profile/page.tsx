'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, TrendingUp, Trophy, Target, Eye } from 'lucide-react'
import { clsx } from 'clsx'
import { useMyGamificationProfile, useMyXpHistory, useMyBadges } from '@/hooks/useGamification'
import { useAuthStore } from '@/store/auth.store'
import XpBar from '@/components/gamification/XpBar'
import BadgeGrid from '@/components/gamification/BadgeGrid'
import { formatDate } from '@/lib/shop.utils'

type Tab = 'overview' | 'badges' | 'history'

export default function PlayerProfilePage() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState<Tab>('overview')
  const [xpPage, setXpPage] = useState(1)

  const { data: profileData, isLoading } = useMyGamificationProfile()
  const { data: badgesData, isLoading: loadingBadges } = useMyBadges()
  const { data: xpHistory } = useMyXpHistory(xpPage)

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Visão Geral', icon: TrendingUp },
    { key: 'badges',   label: 'Conquistas',  icon: Trophy },
    { key: 'history',  label: 'Histórico XP', icon: Eye },
  ]

  if (isLoading) return (
    <div className="p-8 flex justify-center py-20">
      <Loader2 size={28} className="text-crime-red animate-spin" />
    </div>
  )

  const { profile, xpProgress, recentXp } = profileData ?? {}
  const earnedCount = (badgesData ?? []).filter((b: any) => b.earned).length

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-2">Detetive</p>
        <h1 className="text-3xl font-bold text-crime-text-primary">O Meu Perfil</h1>
      </div>

      {/* Profile hero */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-full bg-crime-black border-2 border-crime-red/30 flex items-center justify-center shrink-0 overflow-hidden">
            {user?.avatarUrl
              ? <img src={user.avatarUrl} className="w-full h-full object-cover" />
              : <span className="text-2xl font-bold text-crime-red">
                  {(user?.displayName || user?.username || '?')[0].toUpperCase()}
                </span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold text-crime-text-primary">{user?.displayName || user?.username}</p>
            <p className="text-sm text-crime-text-faint">@{user?.username}</p>
            {user?.bio && <p className="text-xs text-crime-text-muted mt-1 italic">{user.bio}</p>}
          </div>
          <div className="text-right">
            <span className="badge badge-player font-mono text-xs px-3 py-1.5">{user?.role}</span>
          </div>
        </div>

        {/* XP Bar */}
        {profile && xpProgress && (
          <XpBar
            level={profile.level}
            totalXp={profile.totalXp}
            xpProgress={xpProgress}
            size="lg"
          />
        )}
      </div>

      {/* Stats row */}
      {profile && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Sessões',    value: profile.sessionsPlayed,   icon: '🎮' },
            { label: 'Resolvidos', value: profile.sessionsSolved,   icon: '✅' },
            { label: '1ª Tent.',   value: profile.correctFirst,     icon: '⚡' },
            { label: 'Conquistas', value: earnedCount,               icon: '🏅' },
          ].map(({ label, value, icon }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="card p-4 text-center"
            >
              <span className="text-2xl block mb-1">{icon}</span>
              <p className="text-2xl font-bold font-mono text-crime-text-primary">{value}</p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-crime-text-faint mt-0.5">{label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-crime-border">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={clsx(
              'flex items-center gap-2 px-4 py-3 text-xs font-mono uppercase tracking-wider transition-all border-b-2 -mb-px',
              tab === key
                ? 'border-crime-red text-crime-red'
                : 'border-transparent text-crime-text-faint hover:text-crime-text-muted'
            )}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Recent XP */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-crime-border">
              <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint">Últimas Actividades de XP</p>
            </div>
            <div className="divide-y divide-crime-border/50">
              {(recentXp ?? []).length === 0 ? (
                <p className="text-center py-8 text-crime-text-faint text-sm">Nenhuma actividade ainda</p>
              ) : (
                (recentXp ?? []).map((event: any) => (
                  <div key={event.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm text-crime-text-secondary">{event.reason}</p>
                      <p className="text-[10px] text-crime-text-faint font-mono mt-0.5">{formatDate(event.createdAt)}</p>
                    </div>
                    <span className="font-mono font-bold text-crime-red shrink-0">+{event.amount} XP</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Earned badges preview */}
          {(badgesData ?? []).filter((b: any) => b.earned).length > 0 && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint">Conquistas Recentes</p>
                <button onClick={() => setTab('badges')} className="text-xs text-crime-red hover:opacity-70 transition-opacity">
                  Ver todas →
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {(badgesData ?? [])
                  .filter((b: any) => b.earned)
                  .slice(0, 6)
                  .map((badge: any) => (
                    <div key={badge.id} title={`${badge.name}: ${badge.description}`}
                      className="flex flex-col items-center gap-1 p-3 rounded-lg border border-crime-border bg-crime-black text-center w-16">
                      <span className="text-2xl">{badge.icon}</span>
                      <p className="text-[9px] text-crime-text-faint font-mono leading-tight line-clamp-2">{badge.name}</p>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'badges' && (
        <div>
          {loadingBadges ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="text-crime-red animate-spin" />
            </div>
          ) : (
            <BadgeGrid badges={badgesData ?? []} />
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="card overflow-hidden">
          <div className="divide-y divide-crime-border/50">
            {(xpHistory?.events ?? []).length === 0 ? (
              <p className="text-center py-12 text-crime-text-faint text-sm">Nenhum histórico de XP</p>
            ) : (
              (xpHistory?.events ?? []).map((event: any, i: number) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between px-5 py-3 hover:bg-crime-muted/10 transition-colors"
                >
                  <div>
                    <p className="text-sm text-crime-text-secondary">{event.reason}</p>
                    <p className="text-[10px] text-crime-text-faint font-mono mt-0.5">{formatDate(event.createdAt)}</p>
                  </div>
                  <span className="font-mono font-bold text-crime-red shrink-0 ml-4">+{event.amount}</span>
                </motion.div>
              ))
            )}
          </div>
          {xpHistory?.meta && xpHistory.meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-crime-border">
              <p className="text-xs text-crime-text-faint">{xpHistory.meta.total} eventos</p>
              <div className="flex gap-2">
                <button onClick={() => setXpPage(p => Math.max(1, p - 1))} disabled={xpPage === 1}
                  className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-40">← Anterior</button>
                <button onClick={() => setXpPage(p => Math.min(xpHistory.meta.totalPages, p + 1))}
                  disabled={xpPage === xpHistory.meta.totalPages}
                  className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-40">Próxima →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
