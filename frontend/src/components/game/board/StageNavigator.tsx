'use client'

import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { CheckCircle, Circle, ChevronRight, Lock } from 'lucide-react'
import { GameStage, GameSession } from '@/types/game'
import { useAuthStore } from '@/store/auth.store'
import { useAdvanceStage } from '@/hooks/useSession'

interface StageNavProps {
  stages: GameStage[]
  session: GameSession
}

export default function StageNavigator({ stages, session }: StageNavProps) {
  const { user } = useAuthStore()
  const isHost = user?.id === session.hostId
  const advanceStage = useAdvanceStage(session.id)

  const currentIdx = stages.findIndex((s) => s.id === session.currentStageId)

  return (
    <div className="stage-nav">
      <div className="stage-nav-header">
        <span className="stage-nav-eyebrow">Progresso</span>
      </div>

      <div className="stage-nav-list">
        {stages.map((stage, idx) => {
          const isPast    = idx < currentIdx
          const isCurrent = idx === currentIdx
          const isFuture  = idx > currentIdx
          const isNext    = idx === currentIdx + 1

          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.35 }}
              className={clsx('stage-item', {
                'stage-past': isPast,
                'stage-current': isCurrent,
                'stage-future': isFuture,
              })}
            >
              {/* Icon */}
              <div className="stage-icon">
                {isPast    && <CheckCircle size={13} color="#4ade80" />}
                {isCurrent && <div className="stage-active-dot" />}
                {isFuture  && <Lock size={11} color="#333" />}
              </div>

              {/* Label */}
              <div className="stage-text">
                <span className="stage-order">Stage {idx + 1}</span>
                <span className="stage-title">{stage.title}</span>
                {stage.isLast && (
                  <span className="stage-final">Final</span>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Advance button (host only) */}
      {isHost && currentIdx < stages.length - 1 && (
        <div className="stage-advance-wrap">
          <button
            onClick={() => advanceStage.mutate(stages[currentIdx + 1].id)}
            disabled={advanceStage.isPending}
            className="stage-advance-btn"
          >
            <ChevronRight size={12} />
            Avançar Stage
          </button>
        </div>
      )}

      <style jsx>{`
        .stage-nav {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 16px 0;
        }
        .stage-nav-header {
          padding: 0 16px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          margin-bottom: 8px;
        }
        .stage-nav-eyebrow {
          font-family: monospace;
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #444;
        }
        .stage-nav-list {
          flex: 1;
          padding: 4px 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .stage-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 9px 10px;
          border-radius: 6px;
          transition: background 0.15s;
          border: 1px solid transparent;
        }
        .stage-current {
          background: rgba(192, 57, 43, 0.08);
          border-color: rgba(192, 57, 43, 0.2);
        }
        .stage-past   { opacity: 0.55; }
        .stage-future { opacity: 0.25; }
        .stage-icon {
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .stage-active-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #C0392B;
          box-shadow: 0 0 8px rgba(192,57,43,0.8);
          animation: pulse-dot 1.8s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        .stage-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
          gap: 1px;
        }
        .stage-order {
          font-family: monospace;
          font-size: 9px;
          color: #444;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .stage-title {
          font-size: 12px;
          color: #CCC;
          line-height: 1.3;
        }
        .stage-current .stage-title { color: #E8E4DC; font-weight: 600; }
        .stage-final {
          font-family: monospace;
          font-size: 9px;
          color: #C0392B;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-top: 2px;
        }
        .stage-advance-wrap {
          padding: 12px 12px 4px;
          border-top: 1px solid rgba(255,255,255,0.04);
        }
        .stage-advance-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 5px;
          color: #666;
          font-family: monospace;
          font-size: 10px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .stage-advance-btn:hover:not(:disabled) {
          background: rgba(192,57,43,0.12);
          border-color: rgba(192,57,43,0.3);
          color: #C0392B;
        }
        .stage-advance-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>
    </div>
  )
}
