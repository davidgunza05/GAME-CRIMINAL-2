'use client'

import { motion } from 'framer-motion'
import { clsx } from 'clsx'

type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

interface BadgeData {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  rarity: BadgeRarity
  earned: boolean
  awardedAt?: string | null
}

const RARITY_STYLES: Record<BadgeRarity, { border: string; glow: string; label: string; labelColor: string }> = {
  common:    { border: 'rgba(150,150,150,0.25)', glow: 'rgba(150,150,150,0.15)', label: 'Comum',    labelColor: '#888' },
  uncommon:  { border: 'rgba(76,175,80,0.35)',   glow: 'rgba(76,175,80,0.15)',   label: 'Incomum',  labelColor: '#4caf50' },
  rare:      { border: 'rgba(33,150,243,0.4)',    glow: 'rgba(33,150,243,0.15)', label: 'Raro',     labelColor: '#2196f3' },
  epic:      { border: 'rgba(156,39,176,0.45)',   glow: 'rgba(156,39,176,0.18)', label: 'Épico',    labelColor: '#9c27b0' },
  legendary: { border: 'rgba(255,193,7,0.5)',     glow: 'rgba(255,193,7,0.2)',   label: 'Lendário', labelColor: '#ffc107' },
}

interface BadgeGridProps {
  badges: BadgeData[]
  compact?: boolean
}

export default function BadgeGrid({ badges, compact = false }: BadgeGridProps) {
  const earned = badges.filter((b) => b.earned)
  const locked = badges.filter((b) => !b.earned)

  return (
    <div>
      {/* Earned badges */}
      {earned.length > 0 && (
        <div className="bg-earned">
          {!compact && (
            <p className="bg-section-label">Conquistadas ({earned.length})</p>
          )}
          <div className={clsx('bg-grid', compact && 'bg-grid-compact')}>
            {earned.map((badge, idx) => {
              const styles = RARITY_STYLES[badge.rarity]
              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.04 }}
                  className="bg-badge bg-badge-earned"
                  style={{
                    borderColor: styles.border,
                    boxShadow: `0 0 16px ${styles.glow}`,
                  }}
                  title={badge.description}
                >
                  <span className="bg-icon">{badge.icon}</span>
                  {!compact && (
                    <>
                      <p className="bg-name">{badge.name}</p>
                      <p className="bg-rarity" style={{ color: styles.labelColor }}>{styles.label}</p>
                      <p className="bg-desc">{badge.description}</p>
                    </>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Locked badges */}
      {locked.length > 0 && !compact && (
        <div className="bg-locked-section">
          <p className="bg-section-label">Por conquistar ({locked.length})</p>
          <div className="bg-grid bg-grid-locked">
            {locked.map((badge) => (
              <div
                key={badge.id}
                className="bg-badge bg-badge-locked"
                title={badge.description}
              >
                <span className="bg-icon bg-icon-locked">{badge.icon}</span>
                <p className="bg-name bg-name-locked">{badge.name}</p>
                <p className="bg-rarity" style={{ color: '#444' }}>{RARITY_STYLES[badge.rarity].label}</p>
                <p className="bg-desc bg-desc-locked">{badge.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {badges.length === 0 && (
        <div className="bg-empty">
          <span>🏅</span>
          <p>Nenhuma badge disponível ainda.</p>
        </div>
      )}

      <style jsx>{`
        .bg-section-label {
          font-family: monospace; font-size: 10px; letter-spacing: 0.18em;
          text-transform: uppercase; color: #555; margin-bottom: 12px;
        }
        .bg-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 10px;
          margin-bottom: 24px;
        }
        .bg-grid-compact {
          grid-template-columns: repeat(auto-fill, minmax(52px, 52px));
          gap: 6px;
        }
        .bg-grid-locked { opacity: 0.45; }

        .bg-badge {
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          padding: 16px 10px;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          text-align: center;
          transition: transform 0.15s;
        }
        .bg-grid-compact .bg-badge {
          padding: 10px 6px;
          border-radius: 6px;
        }
        .bg-badge-earned:hover { transform: translateY(-2px); }
        .bg-badge-locked { background: rgba(255,255,255,0.01); }

        .bg-icon { font-size: 28px; line-height: 1; }
        .bg-grid-compact .bg-icon { font-size: 22px; }
        .bg-icon-locked { filter: grayscale(1); opacity: 0.5; }

        .bg-name { font-size: 12px; font-weight: 600; color: #DDD; line-height: 1.3; }
        .bg-name-locked { color: #555; }

        .bg-rarity { font-family: monospace; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; }

        .bg-desc { font-size: 10px; color: #666; line-height: 1.4; }
        .bg-desc-locked { color: #444; }

        .bg-earned { margin-bottom: 8px; }
        .bg-locked-section {}

        .bg-empty {
          display: flex; flex-direction: column; align-items: center;
          padding: 32px; gap: 8px; text-align: center;
        }
        .bg-empty span { font-size: 32px; opacity: 0.3; }
        .bg-empty p { font-size: 13px; color: #444; }
      `}</style>
    </div>
  )
}
