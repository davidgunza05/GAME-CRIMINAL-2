'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Trophy, Target, Star, TrendingUp } from 'lucide-react'
import { clsx } from 'clsx'
import { useGlobalLeaderboard, useMyRank } from '@/hooks/useGamification'
import { useAuthStore } from '@/store/auth.store'

type SortKey = 'totalXp' | 'sessionsSolved' | 'correctFirst' | 'level'

const SORT_OPTIONS: { key: SortKey; label: string; icon: React.ElementType }[] = [
  { key: 'totalXp',        label: 'XP Total',           icon: TrendingUp },
  { key: 'sessionsSolved', label: 'Casos Resolvidos',   icon: Trophy },
  { key: 'correctFirst',   label: '1ª Tentativa',       icon: Target },
  { key: 'level',          label: 'Nível',               icon: Star },
]

const medals = ['🥇', '🥈', '🥉']

export default function LeaderboardPage() {
  const { user } = useAuthStore()
  const [sortBy, setSortBy] = useState<SortKey>('totalXp')
  const [page, setPage]     = useState(1)

  const { data, isLoading } = useGlobalLeaderboard(page, sortBy)
  const { data: myRank }    = useMyRank()

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-2">Rankings</p>
        <h1 className="text-3xl font-bold text-crime-text-primary">Leaderboard Global</h1>
      </div>

      {/* My rank banner */}
      {myRank && (
        <div className="card p-5 mb-6 border-crime-red/20 bg-crime-red/5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-crime-black border-2 border-crime-red/30 flex items-center justify-center shrink-0 overflow-hidden">
                {user?.avatarUrl
                  ? <img src={user.avatarUrl} className="w-full h-full object-cover" />
                  : <span className="font-bold text-crime-text-faint text-lg">
                      {(user?.displayName || user?.username || '?')[0].toUpperCase()}
                    </span>
                }
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-crime-red mb-1">A tua posição</p>
                <p className="font-bold text-crime-text-primary">#{myRank.rank} — {user?.displayName || user?.username}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-lg font-bold text-crime-red">Nível {myRank.profile.level}</p>
              <p className="font-mono text-xs text-crime-text-faint">{myRank.profile.totalXp.toLocaleString('pt-PT')} XP</p>
            </div>
          </div>
        </div>
      )}

      {/* Sort tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {SORT_OPTIONS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => { setSortBy(key); setPage(1) }}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-mono uppercase tracking-wider transition-all',
              sortBy === key
                ? 'border-crime-red bg-crime-red/10 text-crime-red'
                : 'border-crime-border text-crime-text-faint hover:border-crime-red/40'
            )}>
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="text-crime-red animate-spin" />
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-crime-border bg-crime-black/50">
                  {['#', 'Jogador', 'Nível', 'XP Total', 'Resolvidos', '1ª Tent.'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-mono uppercase tracking-widest text-crime-text-faint">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.leaderboard?.map((entry: any, idx: number) => {
                  const isMe = entry.user?.id === user?.id
                  const rank = (page - 1) * 20 + idx + 1
                  return (
                    <motion.tr key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={clsx('border-b border-crime-border/50 transition-colors',
                        isMe ? 'bg-crime-red/5' : 'hover:bg-crime-muted/10')}>
                      <td className="px-4 py-3 w-12 text-center">
                        {rank <= 3
                          ? <span className="text-lg">{medals[rank - 1]}</span>
                          : <span className="font-mono text-xs text-crime-text-faint">#{rank}</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-crime-muted border border-crime-border overflow-hidden flex items-center justify-center text-xs font-bold text-crime-text-faint shrink-0">
                            {entry.user?.avatarUrl
                              ? <img src={entry.user.avatarUrl} className="w-full h-full object-cover" />
                              : (entry.user?.displayName || entry.user?.username || '?')[0].toUpperCase()
                            }
                          </div>
                          <div>
                            <p className={clsx('font-medium text-sm', isMe ? 'text-crime-red' : 'text-crime-text-primary')}>
                              {entry.user?.displayName || entry.user?.username}
                              {isMe && <span className="ml-2 text-[9px] font-mono bg-crime-red/15 text-crime-red px-1.5 py-0.5 rounded">TU</span>}
                            </p>
                            <p className="text-[10px] text-crime-text-faint">@{entry.user?.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-crime-red/10 text-crime-red border border-crime-red/20 px-2 py-1 rounded">
                          Nível {entry.level}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-crime-text-primary">
                        {entry.totalXp.toLocaleString('pt-PT')}
                      </td>
                      <td className="px-4 py-3 font-mono text-crime-text-muted">{entry.sessionsSolved}</td>
                      <td className="px-4 py-3 font-mono text-crime-text-muted">{entry.correctFirst}</td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>

            {data?.meta && data.meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-crime-border">
                <p className="text-xs text-crime-text-faint">{data.meta.total} jogadores</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-40">← Anterior</button>
                  <button onClick={() => setPage(p => Math.min(data.meta.totalPages, p + 1))}
                    disabled={page === data.meta.totalPages}
                    className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-40">Próxima →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
