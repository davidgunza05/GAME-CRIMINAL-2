'use client'

import { motion } from 'framer-motion'
import { formatDate } from '@/lib/shop.utils'

interface FeedEvent {
  type: string
  label: string
  sub: string
  time: string | Date
  color: string
}

interface ActivityFeedProps {
  events: FeedEvent[]
}

const TYPE_ICONS: Record<string, string> = {
  user:       '👤',
  order:      '🛒',
  session:    '🎮',
  accusation: '⚖️',
}

export default function ActivityFeed({ events }: ActivityFeedProps) {
  if (!events || events.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: '#444', fontSize: 13, fontStyle: 'italic' }}>Sem actividade recente</p>
      </div>
    )
  }

  return (
    <div className="af-root">
      {events.map((event, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
          className="af-row"
        >
          <div className="af-dot" style={{ background: event.color }} />
          <div className="af-icon">{TYPE_ICONS[event.type] ?? '•'}</div>
          <div className="af-text">
            <span className="af-label">{event.label}</span>
            <span className="af-sub">{event.sub}</span>
          </div>
          <span className="af-time">{formatDate(typeof event.time === 'string' ? event.time : event.time.toISOString())}</span>
        </motion.div>
      ))}

      <style jsx>{`
        .af-root { display: flex; flex-direction: column; }
        .af-row {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .af-row:last-child { border-bottom: none; }
        .af-dot {
          width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
        }
        .af-icon { font-size: 14px; width: 22px; text-align: center; flex-shrink: 0; }
        .af-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
        .af-label {
          font-size: 12px; color: #CCC;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .af-sub {
          font-size: 10px; color: #555;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .af-time {
          font-family: monospace; font-size: 10px; color: #444;
          flex-shrink: 0; white-space: nowrap;
        }
      `}</style>
    </div>
  )
}
