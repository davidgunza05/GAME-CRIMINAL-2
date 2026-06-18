'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Eye, EyeOff } from 'lucide-react'
import { Character } from '@/types/game'

interface MyCharacterCardProps {
  character: Character
  isKillerRevealed?: boolean
}

export default function MyCharacterCard({ character, isKillerRevealed }: MyCharacterCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [secretsVisible, setSecretsVisible] = useState(false)

  return (
    <div className="char-card">
      {/* Header */}
      <button className="char-header" onClick={() => setExpanded((e) => !e)}>
        <div className="char-avatar">
          {character.avatarUrl
            ? <img src={character.avatarUrl} alt={character.name} className="char-avatar-img" />
            : <span className="char-avatar-initial">{character.name[0]}</span>
          }
          {character.isDetective && <span className="char-badge char-badge-det">🔍</span>}
        </div>
        <div className="char-meta">
          <span className="char-role-label">A tua personagem</span>
          <span className="char-name">{character.name}</span>
          <span className="char-desc">{character.description}</span>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} color="#555" />
        </motion.div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="char-detail"
          >
            <div className="char-section">
              <span className="char-section-label">Alibi</span>
              <p className="char-section-text">{character.alibi}</p>
            </div>

            <div className="char-section">
              <span className="char-section-label">Objetivos</span>
              <p className="char-section-text">{character.objectives}</p>
            </div>

            {/* Secrets — toggle visibility */}
            <div className="char-section">
              <div className="char-secrets-header">
                <span className="char-section-label">Os teus segredos</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setSecretsVisible((v) => !v) }}
                  className="char-secret-toggle"
                >
                  {secretsVisible ? <EyeOff size={11} /> : <Eye size={11} />}
                  {secretsVisible ? 'Esconder' : 'Revelar'}
                </button>
              </div>
              <AnimatePresence>
                {secretsVisible ? (
                  <motion.p
                    initial={{ opacity: 0, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, filter: 'blur(4px)' }}
                    className="char-section-text char-secret-text"
                  >
                    {character.secrets}
                  </motion.p>
                ) : (
                  <p className="char-section-text char-secret-blur">
                    {character.secrets}
                  </p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .char-card {
          border: 1px solid rgba(192,57,43,0.2);
          border-radius: 8px;
          overflow: hidden;
          background: rgba(192,57,43,0.04);
        }
        .char-header {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 14px;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s;
        }
        .char-header:hover { background: rgba(255,255,255,0.02); }
        .char-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 1.5px solid rgba(192,57,43,0.4);
          overflow: hidden;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(192,57,43,0.1);
          position: relative;
        }
        .char-avatar-img  { width: 100%; height: 100%; object-fit: cover; }
        .char-avatar-initial { font-size: 17px; font-weight: 700; color: #C0392B; }
        .char-badge {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #0e0e18;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          border: 1px solid rgba(192,57,43,0.4);
        }
        .char-meta { flex: 1; min-width: 0; }
        .char-role-label { font-family: monospace; font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; color: #C0392B; display: block; margin-bottom: 1px; }
        .char-name { font-size: 13px; font-weight: 600; color: #E8E4DC; display: block; }
        .char-desc { font-size: 11px; color: #777; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }

        .char-detail { overflow: hidden; }
        .char-section { padding: 10px 14px; border-top: 1px solid rgba(255,255,255,0.04); }
        .char-section-label { font-family: monospace; font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; color: #555; display: block; margin-bottom: 5px; }
        .char-section-text { font-size: 12px; color: #999; line-height: 1.6; margin: 0; }
        .char-secret-text  { color: #CCC; }
        .char-secret-blur  { filter: blur(4px); user-select: none; color: #888; }
        .char-secrets-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; }
        .char-secret-toggle { display: flex; align-items: center; gap: 4px; font-family: monospace; font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; color: #C0392B; background: none; border: none; cursor: pointer; padding: 0; transition: opacity 0.15s; }
        .char-secret-toggle:hover { opacity: 0.7; }
      `}</style>
    </div>
  )
}
