'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Image, Volume2, Video, Box, QrCode, AlertTriangle, X, ExternalLink, Lock } from 'lucide-react'
import { clsx } from 'clsx'
import { EvidenceUnlock, EvidenceType } from '@/types/game'

const TYPE_META: Record<EvidenceType, { icon: React.ElementType; label: string; accent: string }> = {
  document: { icon: FileText, label: 'Documento',  accent: '#4a90d9' },
  photo:    { icon: Image,    label: 'Fotografia', accent: '#9b59b6' },
  audio:    { icon: Volume2,  label: 'Áudio',      accent: '#27ae60' },
  video:    { icon: Video,    label: 'Vídeo',      accent: '#e67e22' },
  object:   { icon: Box,      label: 'Objeto',     accent: '#c0392b' },
  qrcode:   { icon: QrCode,   label: 'QR Code',    accent: '#16a085' },
}

interface EvidenceBoardProps {
  unlocked: EvidenceUnlock[]
  stageTitle?: string
  stageDescription?: string
  isLastStage?: boolean
}

export default function EvidenceBoard({ unlocked, stageTitle, stageDescription, isLastStage }: EvidenceBoardProps) {
  const [selected, setSelected] = useState<EvidenceUnlock | null>(null)
  const [filter, setFilter] = useState<EvidenceType | 'all'>('all')

  const types = [...new Set(unlocked.map((u) => u.evidence.type))] as EvidenceType[]
  const filtered = filter === 'all' ? unlocked : unlocked.filter((u) => u.evidence.type === filter)
  const real = filtered.filter((u) => !u.evidence.isRedHerring)
  const red  = filtered.filter((u) =>  u.evidence.isRedHerring)

  return (
    <div className="eb-root">
      {/* Stage header */}
      {stageTitle && (
        <div className="eb-stage-header">
          <div className="eb-stage-kicker">
            {isLastStage && <span className="eb-stage-final-pill">⚖ Stage Final</span>}
            <span className="eb-stage-eyebrow">Investigação em curso</span>
          </div>
          <h2 className="eb-stage-title">{stageTitle}</h2>
          {stageDescription && <p className="eb-stage-desc">{stageDescription}</p>}
        </div>
      )}

      {/* Empty state */}
      {unlocked.length === 0 && (
        <div className="eb-empty">
          <Lock size={28} style={{ color: '#333', marginBottom: 12 }} />
          <p className="eb-empty-title">Nenhuma evidência disponível</p>
          <p className="eb-empty-sub">As evidências serão desbloqueadas à medida que o caso avança.</p>
        </div>
      )}

      {unlocked.length > 0 && (
        <>
          {/* Filter bar */}
          <div className="eb-filters">
            <button
              onClick={() => setFilter('all')}
              className={clsx('eb-filter-btn', filter === 'all' && 'eb-filter-active')}
            >
              Todas ({unlocked.length})
            </button>
            {types.map((t) => {
              const meta = TYPE_META[t]
              const Icon = meta.icon
              const count = unlocked.filter((u) => u.evidence.type === t).length
              return (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={clsx('eb-filter-btn', filter === t && 'eb-filter-active')}
                  style={filter === t ? { borderColor: meta.accent, color: meta.accent } : {}}
                >
                  <Icon size={10} />
                  {meta.label} ({count})
                </button>
              )
            })}
          </div>

          {/* Evidence grid */}
          <div className="eb-grid">
            {filtered.map((eu, idx) => {
              const meta = TYPE_META[eu.evidence.type]
              const Icon = meta.icon
              const isRed = eu.evidence.isRedHerring

              return (
                <motion.button
                  key={eu.id}
                  initial={{ opacity: 0, y: 16, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: idx * 0.04, duration: 0.3 }}
                  onClick={() => setSelected(selected?.id === eu.id ? null : eu)}
                  className={clsx('eb-card', isRed && 'eb-card-red', selected?.id === eu.id && 'eb-card-selected')}
                  style={{ '--accent': isRed ? '#555' : meta.accent } as any}
                >
                  {/* Type pill */}
                  <div className="eb-card-type">
                    <Icon size={10} />
                    <span>{meta.label}</span>
                    {isRed && <AlertTriangle size={9} style={{ color: '#888' }} />}
                  </div>

                  {/* Preview image */}
                  {eu.evidence.contentUrl && eu.evidence.type === 'photo' && (
                    <div className="eb-card-thumb">
                      <img src={eu.evidence.contentUrl} alt={eu.evidence.title} />
                    </div>
                  )}

                  {/* Title */}
                  <p className="eb-card-title">{eu.evidence.title}</p>

                  {/* Short desc */}
                  <p className="eb-card-desc">{eu.evidence.description}</p>

                  {/* Unlocked by */}
                  {eu.unlockedBy && (
                    <p className="eb-card-by">↑ {eu.unlockedBy.username}</p>
                  )}
                </motion.button>
              )
            })}
          </div>
        </>
      )}

      {/* Evidence detail modal */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              className="eb-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
            />
            <motion.div
              className="eb-detail"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            >
              {/* Detail header */}
              <div className="eb-detail-header">
                <div className="eb-detail-meta">
                  {(() => {
                    const Icon = TYPE_META[selected.evidence.type].icon
                    return <Icon size={14} style={{ color: TYPE_META[selected.evidence.type].accent }} />
                  })()}
                  <span className="eb-detail-type">{TYPE_META[selected.evidence.type].label}</span>
                  {selected.evidence.isRedHerring && (
                    <span className="eb-detail-red-badge">Pista Falsa</span>
                  )}
                </div>
                <button className="eb-detail-close" onClick={() => setSelected(null)}>
                  <X size={14} />
                </button>
              </div>

              <h3 className="eb-detail-title">{selected.evidence.title}</h3>
              <p className="eb-detail-desc">{selected.evidence.description}</p>

              {/* Content */}
              {selected.evidence.contentText && (
                <div className="eb-detail-content">
                  <pre className="eb-detail-pre">{selected.evidence.contentText}</pre>
                </div>
              )}

              {selected.evidence.contentUrl && selected.evidence.type === 'photo' && (
                <div className="eb-detail-image">
                  <img src={selected.evidence.contentUrl} alt={selected.evidence.title} />
                </div>
              )}

              {selected.evidence.contentUrl && selected.evidence.type !== 'photo' && (
                <a href={selected.evidence.contentUrl} target="_blank" rel="noopener noreferrer"
                  className="eb-detail-link">
                  <ExternalLink size={12} /> Abrir ficheiro
                </a>
              )}

              {selected.evidence.qrCode && (
                <div className="eb-detail-qr">
                  <p className="eb-detail-qr-label">QR Code</p>
                  <code className="eb-detail-qr-val">{selected.evidence.qrCode}</code>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx>{`
        .eb-root { position: relative; }

        /* Stage header */
        .eb-stage-header { margin-bottom: 28px; }
        .eb-stage-kicker { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .eb-stage-eyebrow { font-family: monospace; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #555; }
        .eb-stage-final-pill { background: rgba(192,57,43,0.15); border: 1px solid rgba(192,57,43,0.3); color: #C0392B; font-family: monospace; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; padding: 2px 8px; border-radius: 3px; }
        .eb-stage-title { font-size: 24px; font-weight: 700; color: #E8E4DC; letter-spacing: -0.02em; margin-bottom: 8px; line-height: 1.2; }
        .eb-stage-desc { font-size: 13px; color: #777; line-height: 1.6; max-width: 600px; }

        /* Empty */
        .eb-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 240px; text-align: center; }
        .eb-empty-title { font-size: 15px; color: #555; font-weight: 600; margin-bottom: 6px; }
        .eb-empty-sub   { font-size: 12px; color: #333; }

        /* Filters */
        .eb-filters { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 20px; }
        .eb-filter-btn {
          display: flex; align-items: center; gap: 4px;
          font-family: monospace; font-size: 10px; letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 4px 10px; border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.07);
          background: transparent; color: #555; cursor: pointer;
          transition: all 0.15s;
        }
        .eb-filter-btn:hover { color: #999; border-color: rgba(255,255,255,0.15); }
        .eb-filter-active { border-color: rgba(192,57,43,0.5) !important; color: #C0392B !important; background: rgba(192,57,43,0.06) !important; }

        /* Grid */
        .eb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }

        /* Cards */
        .eb-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          padding: 14px;
          text-align: left;
          cursor: pointer;
          transition: all 0.18s;
          position: relative;
          overflow: hidden;
        }
        .eb-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: var(--accent);
          opacity: 0;
          transition: opacity 0.18s;
        }
        .eb-card:hover { border-color: rgba(255,255,255,0.14); background: rgba(255,255,255,0.04); transform: translateY(-1px); }
        .eb-card:hover::before { opacity: 1; }
        .eb-card-selected { border-color: rgba(255,255,255,0.2) !important; background: rgba(255,255,255,0.05) !important; }
        .eb-card-selected::before { opacity: 1 !important; }
        .eb-card-red { opacity: 0.5; }
        .eb-card-red:hover { opacity: 0.7; }

        .eb-card-type { display: flex; align-items: center; gap: 5px; font-family: monospace; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); margin-bottom: 10px; }
        .eb-card-thumb { width: 100%; height: 80px; border-radius: 4px; overflow: hidden; margin-bottom: 10px; }
        .eb-card-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .eb-card-title { font-size: 13px; font-weight: 600; color: #DDD; margin-bottom: 5px; line-height: 1.3; }
        .eb-card-desc  { font-size: 11px; color: #666; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .eb-card-by    { font-family: monospace; font-size: 9px; color: #444; margin-top: 8px; }

        /* Modal */
        .eb-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 80; backdrop-filter: blur(3px); }
        .eb-detail {
          position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
          z-index: 90; width: min(560px, calc(100vw - 32px));
          background: #0e0e18;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 24px;
          max-height: 80vh; overflow-y: auto;
        }
        .eb-detail-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .eb-detail-meta { display: flex; align-items: center; gap: 8px; }
        .eb-detail-type { font-family: monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #666; }
        .eb-detail-red-badge { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #888; font-family: monospace; font-size: 9px; padding: 1px 7px; border-radius: 3px; letter-spacing: 0.1em; text-transform: uppercase; }
        .eb-detail-close { width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 4px; color: #666; cursor: pointer; transition: all 0.15s; }
        .eb-detail-close:hover { color: #CCC; }
        .eb-detail-title { font-size: 20px; font-weight: 700; color: #E8E4DC; margin-bottom: 10px; letter-spacing: -0.01em; }
        .eb-detail-desc  { font-size: 13px; color: #888; line-height: 1.65; margin-bottom: 16px; }
        .eb-detail-content { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; padding: 14px; margin-bottom: 16px; }
        .eb-detail-pre { font-family: 'Courier New', monospace; font-size: 12px; color: #AAA; white-space: pre-wrap; line-height: 1.7; margin: 0; }
        .eb-detail-image { width: 100%; border-radius: 6px; overflow: hidden; margin-bottom: 16px; }
        .eb-detail-image img { width: 100%; height: auto; display: block; }
        .eb-detail-link { display: inline-flex; align-items: center; gap: 6px; font-family: monospace; font-size: 11px; color: #C0392B; text-decoration: none; border: 1px solid rgba(192,57,43,0.3); padding: 6px 12px; border-radius: 4px; transition: all 0.15s; }
        .eb-detail-link:hover { background: rgba(192,57,43,0.1); }
        .eb-detail-qr { margin-top: 16px; }
        .eb-detail-qr-label { font-family: monospace; font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; color: #555; margin-bottom: 6px; }
        .eb-detail-qr-val { font-family: monospace; font-size: 13px; color: #16a085; background: rgba(22,160,133,0.06); padding: 8px 12px; border-radius: 4px; border: 1px solid rgba(22,160,133,0.2); display: block; }
      `}</style>
    </div>
  )
}
