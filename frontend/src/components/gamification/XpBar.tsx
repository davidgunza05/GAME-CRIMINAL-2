'use client'

import { motion } from 'framer-motion'
import { clsx } from 'clsx'

interface XpBarProps {
  level: number
  totalXp: number
  xpProgress: { current: number; needed: number; progress: number }
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export default function XpBar({ level, totalXp, xpProgress, size = 'md', showLabel = true }: XpBarProps) {
  const isMaxLevel = level >= 20

  return (
    <div className={clsx('xpbar-root', `xpbar-${size}`)}>
      {showLabel && (
        <div className="xpbar-header">
          <div className="xpbar-level-badge">
            <span className="xpbar-level-label">Nível</span>
            <span className="xpbar-level-num">{level}</span>
          </div>
          <div className="xpbar-xp-info">
            <span className="xpbar-total">{totalXp.toLocaleString('pt-PT')} XP</span>
            {!isMaxLevel && (
              <span className="xpbar-next">
                +{(xpProgress.needed - xpProgress.current).toLocaleString('pt-PT')} para nível {level + 1}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="xpbar-track">
        <motion.div
          className="xpbar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${isMaxLevel ? 100 : xpProgress.progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
        />
        {!isMaxLevel && (
          <span className="xpbar-pct">{xpProgress.progress}%</span>
        )}
      </div>

      <style jsx>{`
        .xpbar-root { display: flex; flex-direction: column; gap: 8px; }
        .xpbar-header { display: flex; align-items: center; justify-content: space-between; }
        .xpbar-level-badge {
          display: flex; align-items: center; gap: 5px;
          background: rgba(192,57,43,0.12); border: 1px solid rgba(192,57,43,0.25);
          border-radius: 5px; padding: 4px 10px;
        }
        .xpbar-level-label {
          font-family: monospace; font-size: 9px; letter-spacing: 0.12em;
          text-transform: uppercase; color: #C0392B;
        }
        .xpbar-level-num { font-family: monospace; font-size: 16px; font-weight: 700; color: #C0392B; }
        .xpbar-xp-info { display: flex; flex-direction: column; align-items: flex-end; }
        .xpbar-total { font-family: monospace; font-size: 13px; font-weight: 700; color: #E8E4DC; }
        .xpbar-next  { font-family: monospace; font-size: 10px; color: #555; }

        .xpbar-track {
          position: relative;
          height: 6px; border-radius: 3px;
          background: rgba(255,255,255,0.06);
          overflow: visible;
        }
        .xpbar-sm .xpbar-track { height: 4px; }
        .xpbar-lg .xpbar-track { height: 8px; }

        .xpbar-fill {
          height: 100%; border-radius: 3px;
          background: linear-gradient(90deg, #8B0000, #C0392B);
          box-shadow: 0 0 10px rgba(192,57,43,0.4);
          position: relative;
        }
        .xpbar-pct {
          position: absolute; right: 0; top: -18px;
          font-family: monospace; font-size: 9px; color: #C0392B; letter-spacing: 0.06em;
        }
      `}</style>
    </div>
  )
}
