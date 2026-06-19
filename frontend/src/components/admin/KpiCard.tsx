'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { clsx } from 'clsx'

interface KpiCardProps {
  label: string
  value: string | number
  sub?: string
  pctChange?: number
  icon: string
  accent?: string
  delay?: number
}

export default function KpiCard({
  label, value, sub, pctChange, icon, accent = '#C0392B', delay = 0
}: KpiCardProps) {
  const up   = pctChange !== undefined && pctChange > 0
  const down = pctChange !== undefined && pctChange < 0
  const flat = pctChange !== undefined && pctChange === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="kpi-card"
      style={{ '--accent': accent } as any}
    >
      <div className="kpi-top">
        <span className="kpi-icon">{icon}</span>
        {pctChange !== undefined && (
          <span className={clsx('kpi-badge', up && 'kpi-up', down && 'kpi-down', flat && 'kpi-flat')}>
            {up   && <TrendingUp size={10} />}
            {down && <TrendingDown size={10} />}
            {flat && <Minus size={10} />}
            {up ? '+' : ''}{pctChange}%
          </span>
        )}
      </div>
      <p className="kpi-value">{value}</p>
      <p className="kpi-label">{label}</p>
      {sub && <p className="kpi-sub">{sub}</p>}

      <style jsx>{`
        .kpi-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          padding: 20px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.15s;
        }
        .kpi-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: var(--accent);
          opacity: 0.6;
        }
        .kpi-card:hover { border-color: rgba(255,255,255,0.1); }

        .kpi-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .kpi-icon { font-size: 22px; }

        .kpi-badge {
          display: flex; align-items: center; gap: 3px;
          font-family: monospace; font-size: 10px; font-weight: 700;
          padding: 2px 7px; border-radius: 3px;
        }
        .kpi-up   { background: rgba(39,174,96,0.12);  color: #27ae60; }
        .kpi-down { background: rgba(192,57,43,0.12);  color: #C0392B; }
        .kpi-flat { background: rgba(255,255,255,0.05); color: #666; }

        .kpi-value {
          font-family: 'Courier New', monospace;
          font-size: 28px; font-weight: 700;
          color: #E8E4DC; letter-spacing: -0.02em; margin-bottom: 4px;
        }
        .kpi-label {
          font-family: monospace; font-size: 10px; letter-spacing: 0.18em;
          text-transform: uppercase; color: #555;
        }
        .kpi-sub { font-size: 11px; color: #444; margin-top: 3px; }
      `}</style>
    </motion.div>
  )
}
