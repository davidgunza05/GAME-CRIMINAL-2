'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, CheckCircle, XCircle, Star, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { Character, Participant, GameSession } from '@/types/game'
import { formatDate } from '@/lib/shop.utils'

interface GameResultsProps {
  session: GameSession
  killer: Character | null
  stats: { unlockedEvidence: number; totalEvidence: number }
}

export default function GameResults({ session, killer, stats }: GameResultsProps) {
  const [phase, setPhase] = useState<'suspense' | 'reveal' | 'scores'>('suspense')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 2200)
    const t2 = setTimeout(() => setPhase('scores'), 5500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const ranked = [...session.participants].sort((a: any, b: any) => b.score - a.score)
  const winner = ranked.find((p: any) => p.accusations?.some((a: any) => a.result === 'correct'))
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="gr-root">
      {/* Ambient blood-red radial */}
      <div className="gr-ambient" />

      {/* Phase: suspense */}
      <AnimatePresence>
        {phase === 'suspense' && (
          <motion.div
            key="suspense"
            className="gr-phase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.p
              className="gr-suspense-text"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            >
              A revelar o culpado...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase: killer reveal */}
      <AnimatePresence>
        {phase !== 'suspense' && killer && (
          <motion.div
            key="reveal"
            className="gr-reveal"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {/* Red flash line */}
            <motion.div
              className="gr-flash"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.4 }}
            />

            <motion.p
              className="gr-reveal-eyebrow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              O Culpado Era
            </motion.p>

            <motion.div
              className="gr-killer-avatar"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: 'spring', damping: 18 }}
            >
              {killer.avatarUrl
                ? <img src={killer.avatarUrl} alt={killer.name} />
                : <span>{killer.name[0]}</span>
              }
              <div className="gr-killer-ring" />
            </motion.div>

            <motion.h1
              className="gr-killer-name"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              {killer.name}
            </motion.h1>

            <motion.p
              className="gr-killer-desc"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              {killer.description}
            </motion.p>

            {/* Secrets reveal */}
            <motion.div
              className="gr-killer-secret"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85 }}
            >
              <p className="gr-secret-label">A Confissão</p>
              <p className="gr-secret-text">{killer.secrets}</p>
            </motion.div>

            <motion.div
              className="gr-killer-alibi"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <span className="gr-alibi-label">Álibi apresentado:</span>
              <span className="gr-alibi-text"> "{killer.alibi}"</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase: scores */}
      <AnimatePresence>
        {phase === 'scores' && (
          <motion.div
            key="scores"
            className="gr-scores"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Stats row */}
            <div className="gr-stats-row">
              {[
                { label: 'Jogadores', value: session.participants.length },
                { label: 'Evidências', value: `${stats.unlockedEvidence}/${stats.totalEvidence}` },
                { label: 'Caso', value: session.completedAt ? formatDate(session.completedAt) : '—' },
              ].map(({ label, value }, i) => (
                <motion.div
                  key={label}
                  className="gr-stat"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <span className="gr-stat-value">{value}</span>
                  <span className="gr-stat-label">{label}</span>
                </motion.div>
              ))}
            </div>

            {/* Winner callout */}
            {winner && (
              <motion.div
                className="gr-winner"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 }}
              >
                <Star size={16} color="#fbbf24" />
                <div>
                  <p className="gr-winner-label">Primeiro a resolver</p>
                  <p className="gr-winner-name">
                    {(winner as any).user?.displayName || (winner as any).user?.username || (winner as any).guestName}
                    <span className="gr-winner-pts">{winner.score} pts</span>
                  </p>
                </div>
              </motion.div>
            )}

            {/* Leaderboard */}
            <div className="gr-leaderboard">
              <p className="gr-lb-title">Classificação Final</p>
              {ranked.map((p: any, idx) => {
                const name = p.user?.displayName || p.user?.username || p.guestName || '?'
                const solved = p.accusations?.some((a: any) => a.result === 'correct')
                return (
                  <motion.div
                    key={p.id}
                    className={clsx('gr-lb-row', idx === 0 && 'gr-lb-first')}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + idx * 0.08 }}
                  >
                    <span className="gr-lb-medal">
                      {medals[idx] ?? <span className="gr-lb-pos">{idx + 1}</span>}
                    </span>

                    <div className="gr-lb-avatar">
                      {p.user?.avatarUrl
                        ? <img src={p.user.avatarUrl} alt={name} />
                        : <span>{name[0].toUpperCase()}</span>
                      }
                    </div>

                    <div className="gr-lb-info">
                      <span className="gr-lb-name">{name}</span>
                      {p.character && <span className="gr-lb-char">{p.character.name}</span>}
                    </div>

                    <div className="gr-lb-right">
                      {solved
                        ? <CheckCircle size={13} color="#4ade80" />
                        : <XCircle size={13} color="#444" />
                      }
                      {p.accusations?.length > 0 && (
                        <span className="gr-lb-attempts">{p.accusations.length}×</span>
                      )}
                      <span className="gr-lb-score">{p.score}</span>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Actions */}
            <motion.div
              className="gr-actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Link href="/dashboard/sessions" className="gr-btn-secondary">
                Ver Sessões
              </Link>
              <Link href="/dashboard/cases" className="gr-btn-primary">
                Próximo Caso <ArrowRight size={14} />
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .gr-root {
          min-height: 100vh;
          background: #050509;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 24px 16px;
        }
        .gr-ambient {
          position: fixed; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse at 50% 30%, rgba(139,0,0,0.18) 0%, transparent 65%);
        }
        .gr-phase {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .gr-suspense-text {
          font-family: 'Georgia', serif;
          font-size: 18px;
          color: #C0392B;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        /* Reveal */
        .gr-reveal {
          display: flex; flex-direction: column; align-items: center;
          text-align: center; max-width: 560px; width: 100%; position: relative; z-index: 10;
        }
        .gr-flash {
          position: absolute; top: -24px; left: 50%; transform: translateX(-50%);
          width: 120px; height: 2px; background: #C0392B;
          transform-origin: left; margin-bottom: 20px;
        }
        .gr-reveal-eyebrow {
          font-family: monospace; font-size: 11px; letter-spacing: 0.35em;
          text-transform: uppercase; color: #C0392B; margin-bottom: 20px; margin-top: 16px;
        }
        .gr-killer-avatar {
          width: 100px; height: 100px; border-radius: 50%;
          overflow: hidden; position: relative; margin-bottom: 20px;
        }
        .gr-killer-avatar img  { width: 100%; height: 100%; object-fit: cover; }
        .gr-killer-avatar span {
          font-size: 40px; font-weight: 700; color: #C0392B;
          display: flex; align-items: center; justify-content: center;
          width: 100%; height: 100%; background: rgba(192,57,43,0.1);
        }
        .gr-killer-ring {
          position: absolute; inset: -4px; border-radius: 50%;
          border: 2px solid #C0392B;
          animation: ring-pulse 2s ease-in-out infinite;
        }
        @keyframes ring-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(1.06); }
        }
        .gr-killer-name { font-size: 34px; font-weight: 700; color: #F0EDE8; letter-spacing: -0.02em; margin-bottom: 8px; }
        .gr-killer-desc { font-size: 14px; color: #777; margin-bottom: 24px; line-height: 1.6; max-width: 420px; }
        .gr-killer-secret {
          background: rgba(192,57,43,0.06); border: 1px solid rgba(192,57,43,0.2);
          border-radius: 8px; padding: 18px; text-align: left; width: 100%; margin-bottom: 16px;
        }
        .gr-secret-label { font-family: monospace; font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: #C0392B; margin-bottom: 8px; }
        .gr-secret-text { font-size: 13px; color: #AAA; line-height: 1.7; }
        .gr-killer-alibi { font-size: 12px; color: #444; font-style: italic; }
        .gr-alibi-label { color: #555; font-style: normal; font-family: monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; }
        .gr-alibi-text { color: #555; }

        /* Scores */
        .gr-scores {
          width: 100%; max-width: 560px; display: flex;
          flex-direction: column; gap: 20px; position: relative; z-index: 10;
        }
        .gr-stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .gr-stat {
          display: flex; flex-direction: column; align-items: center;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px; padding: 14px 8px;
        }
        .gr-stat-value { font-size: 20px; font-weight: 700; color: #E8E4DC; }
        .gr-stat-label { font-family: monospace; font-size: 9px; color: #555; letter-spacing: 0.12em; text-transform: uppercase; margin-top: 4px; }

        .gr-winner {
          display: flex; align-items: center; gap: 12px;
          background: rgba(251,191,36,0.06); border: 1px solid rgba(251,191,36,0.2);
          border-radius: 8px; padding: 14px 16px;
        }
        .gr-winner-label { font-family: monospace; font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; color: #a16207; margin-bottom: 3px; }
        .gr-winner-name  { font-size: 14px; font-weight: 600; color: #E8E4DC; }
        .gr-winner-pts   { margin-left: 10px; font-family: monospace; font-size: 12px; color: #fbbf24; }

        .gr-leaderboard { background: rgba(255,255,255,0.015); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; overflow: hidden; }
        .gr-lb-title {
          font-family: monospace; font-size: 9px; letter-spacing: 0.18em;
          text-transform: uppercase; color: #444;
          padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .gr-lb-row {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: background 0.15s;
        }
        .gr-lb-row:last-child { border-bottom: none; }
        .gr-lb-first { background: rgba(251,191,36,0.03); }
        .gr-lb-medal { width: 22px; text-align: center; font-size: 16px; flex-shrink: 0; }
        .gr-lb-pos   { font-family: monospace; font-size: 11px; color: #444; }
        .gr-lb-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          overflow: hidden; display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: #888; flex-shrink: 0;
        }
        .gr-lb-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .gr-lb-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .gr-lb-name { font-size: 13px; color: #CCC; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .gr-lb-char { font-size: 10px; color: #555; font-style: italic; }
        .gr-lb-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .gr-lb-attempts { font-family: monospace; font-size: 10px; color: #444; }
        .gr-lb-score    { font-family: monospace; font-size: 13px; font-weight: 700; color: #C0392B; min-width: 40px; text-align: right; }

        .gr-actions { display: flex; gap: 10px; justify-content: center; }
        .gr-btn-secondary {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 11px 22px; border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.03);
          color: #888; font-size: 13px; font-family: Georgia, serif;
          text-decoration: none; transition: all 0.15s;
        }
        .gr-btn-secondary:hover { color: #CCC; border-color: rgba(255,255,255,0.2); }
        .gr-btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 11px 22px; border-radius: 6px;
          background: linear-gradient(135deg, #8B0000, #C0392B);
          color: #fff; font-size: 13px; font-family: Georgia, serif;
          text-decoration: none; transition: opacity 0.15s;
        }
        .gr-btn-primary:hover { opacity: 0.88; }
      `}</style>
    </div>
  )
}
