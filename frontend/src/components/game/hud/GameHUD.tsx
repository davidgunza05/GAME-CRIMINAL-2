'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, PauseCircle, Play, Flag, Users, Clock, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { GameSession } from '@/types/game'
import { useAuthStore } from '@/store/auth.store'
import { usePauseSession, useResumeSession } from '@/hooks/useSession'

interface GameHUDProps {
  session: GameSession
  connected: boolean
  onlineCount: number
}

function useElapsedTime(startedAt?: string | null) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!startedAt) return
    const start = new Date(startedAt).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt])
  const h = Math.floor(elapsed / 3600)
  const m = Math.floor((elapsed % 3600) / 60)
  const s = elapsed % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function GameHUD({ session, connected, onlineCount }: GameHUDProps) {
  const { user } = useAuthStore()
  const router = useRouter()
  const isHost = user?.id === session.hostId
  const isPaused = session.status === 'paused'
  const isLastStage = session.currentStage?.isLast
  const elapsed = useElapsedTime(session.startedAt)

  const pause = usePauseSession()
  const resume = useResumeSession()

  return (
    <div className="hud-bar">
      {/* Left — case identity */}
      <div className="hud-left">
        <span className="hud-eyebrow">🔍</span>
        <div className="hud-case-info">
          <span className="hud-case-title">{session.case.title}</span>
          {session.currentStage && (
            <span className="hud-stage-label">
              <ChevronRight size={9} className="inline" />
              {session.currentStage.title}
              {session.currentStage.isLast && (
                <span className="hud-final-badge">FINAL</span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Centre — timer + status */}
      <div className="hud-centre">
        {isPaused ? (
          <motion.div
            className="hud-paused"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            ⏸ PAUSADA
          </motion.div>
        ) : (
          <div className="hud-timer">
            <Clock size={11} style={{ opacity: 0.4 }} />
            <span>{elapsed}</span>
          </div>
        )}
      </div>

      {/* Right — controls + presence */}
      <div className="hud-right">
        {/* Online indicator */}
        <div className="hud-presence">
          <div className={clsx('hud-dot', connected ? 'hud-dot-on' : 'hud-dot-off')} />
          <Users size={11} style={{ opacity: 0.5 }} />
          <span className="hud-online-count">{onlineCount}</span>
        </div>

        <div className="hud-divider" />

        {/* Accusation CTA — only on last stage */}
        <AnimatePresence>
          {isLastStage && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => router.push(`/dashboard/sessions/${session.id}/accusation`)}
              className="hud-accuse-btn"
            >
              <Flag size={11} />
              Acusar
            </motion.button>
          )}
        </AnimatePresence>

        {/* Host controls */}
        {isHost && (
          <button
            onClick={() => isPaused ? resume.mutate(session.id) : pause.mutate(session.id)}
            className="hud-control-btn"
            title={isPaused ? 'Retomar' : 'Pausar'}
          >
            {isPaused ? <Play size={13} /> : <PauseCircle size={13} />}
          </button>
        )}

        {/* Access code */}
        <div className="hud-code">{session.accessCode}</div>
      </div>

      <style jsx>{`
        .hud-bar {
          display: flex;
          align-items: center;
          width: 100%;
          gap: 12px;
        }
        .hud-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          flex: 1;
        }
        .hud-eyebrow {
          font-size: 16px;
          flex-shrink: 0;
        }
        .hud-case-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .hud-case-title {
          font-size: 12px;
          font-weight: 700;
          color: #E8E4DC;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          letter-spacing: 0.02em;
        }
        .hud-stage-label {
          font-size: 10px;
          color: #666;
          font-family: monospace;
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .hud-final-badge {
          margin-left: 4px;
          background: #C0392B;
          color: #fff;
          font-size: 9px;
          padding: 1px 5px;
          border-radius: 2px;
          letter-spacing: 0.1em;
        }
        .hud-centre {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .hud-timer {
          display: flex;
          align-items: center;
          gap: 5px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          font-weight: 700;
          color: #888;
          letter-spacing: 0.08em;
        }
        .hud-paused {
          font-size: 11px;
          font-family: monospace;
          color: #C0392B;
          letter-spacing: 0.15em;
          font-weight: 700;
        }
        .hud-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .hud-presence {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #555;
        }
        .hud-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .hud-dot-on  { background: #22c55e; box-shadow: 0 0 6px #22c55e; }
        .hud-dot-off { background: #555; }
        .hud-online-count {
          font-family: monospace;
          font-size: 11px;
          color: #666;
        }
        .hud-divider {
          width: 1px;
          height: 18px;
          background: rgba(255,255,255,0.07);
        }
        .hud-accuse-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          background: #C0392B;
          color: #fff;
          border: none;
          border-radius: 4px;
          padding: 5px 11px;
          font-size: 11px;
          font-family: monospace;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.15s;
        }
        .hud-accuse-btn:hover { background: #a93226; }
        .hud-control-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 4px;
          color: #777;
          cursor: pointer;
          transition: all 0.15s;
        }
        .hud-control-btn:hover { color: #E8E4DC; border-color: rgba(255,255,255,0.2); }
        .hud-code {
          font-family: 'Courier New', monospace;
          font-size: 11px;
          letter-spacing: 0.2em;
          color: #444;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 3px;
          padding: 3px 8px;
        }
      `}</style>
    </div>
  )
}
