'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Users, Play, Shuffle, Wifi, WifiOff, Loader2, Clock, MapPin, Link as LinkIcon } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { useSession, useStartSession, useAutoAssign, useCaseCharacters, useAssignCharacter } from '@/hooks/useSession'
import { useGameSocket } from '@/hooks/useGameSocket'
import { useAuthStore } from '@/store/auth.store'
import { GameSession } from '@/types/game'
import { formatDate } from '@/lib/shop.utils'

export default function LobbyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuthStore()
  const [session, setSession] = useState<GameSession | null>(null)

  const { data: initialSession, isLoading } = useSession(id)
  const { data: characters } = useCaseCharacters(session?.caseId ?? '')
  const startSession = useStartSession()
  const autoAssign   = useAutoAssign(id)
  const assignChar   = useAssignCharacter(id)

  useEffect(() => { if (initialSession) setSession(initialSession) }, [initialSession])

  const { connected, online } = useGameSocket({
    sessionId: id,
    onSessionUpdate: setSession,
    onSessionStarted: () => router.push(`/dashboard/sessions/${id}/play`),
  })

  if (isLoading || !session) return (
    <div style={{ minHeight: '100vh', background: '#050509', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={28} style={{ color: '#8B0000', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  const isHost = user?.id === session.hostId
  const allAssigned = session.participants.every((p) => p.character)
  const copyCode = () => { navigator.clipboard.writeText(session.accessCode); toast.success('Código copiado!') }

  return (
    <div className="lobby-root">
      {/* Ambient */}
      <div className="lobby-ambient" />

      {/* Header */}
      <motion.header
        className="lobby-header"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="lobby-header-inner">
          <div className="lobby-logo">
            <span>🔍</span>
            <div>
              <p className="lobby-logo-sub">Sala de Espera</p>
              <p className="lobby-logo-title">{session.case.title}</p>
            </div>
          </div>
          <div className={clsx('lobby-conn', connected ? 'lobby-conn-on' : 'lobby-conn-off')}>
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            <span>{connected ? `${online.length} online` : 'Offline'}</span>
          </div>
        </div>
      </motion.header>

      <div className="lobby-body">
        {/* Left panel */}
        <motion.aside
          className="lobby-left"
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          {/* Access code */}
          <div className="lobby-card">
            <p className="lobby-card-label">Código de Acesso</p>
            <div className="lobby-code-row">
              <span className="lobby-code">{session.accessCode}</span>
              <button onClick={copyCode} className="lobby-copy-btn"><Copy size={13} /></button>
            </div>
            <p className="lobby-code-hint">Partilha com os jogadores</p>
          </div>

          {/* Case cover */}
          <div className="lobby-cover-card">
            <div className="lobby-cover-img">
              {session.case.coverImageUrl
                ? <img src={session.case.coverImageUrl} alt={session.case.title} />
                : <span className="lobby-cover-placeholder">🔍</span>
              }
              <div className="lobby-cover-overlay" />
            </div>
            <div className="lobby-cover-meta">
              <span className="lobby-cover-diff">★★★</span>
              <span className="lobby-cover-players">
                <Users size={10} /> {session.case.minPlayers}–{session.case.maxPlayers}
              </span>
            </div>
          </div>

          {/* Session details */}
          <div className="lobby-card">
            <p className="lobby-card-label">Detalhes</p>
            <div className="lobby-detail-list">
              {session.scheduledAt && (
                <div className="lobby-detail-row">
                  <Clock size={11} style={{ color: '#555' }} />
                  <span>{formatDate(session.scheduledAt)}</span>
                </div>
              )}
              {session.meetingUrl && (
                <div className="lobby-detail-row">
                  <LinkIcon size={11} style={{ color: '#555' }} />
                  <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer" className="lobby-detail-link">
                    Link da reunião →
                  </a>
                </div>
              )}
              {session.location && (
                <div className="lobby-detail-row">
                  <MapPin size={11} style={{ color: '#555' }} />
                  <span>{session.location}</span>
                </div>
              )}
              <div className="lobby-detail-row">
                <span style={{ color: '#555', fontFamily: 'monospace', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Modo</span>
                <span style={{ textTransform: 'capitalize' }}>{session.mode}</span>
              </div>
            </div>
          </div>
        </motion.aside>

        {/* Main — participants */}
        <motion.main
          className="lobby-main"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          {/* Participants header */}
          <div className="lobby-section-header">
            <div className="lobby-section-title-row">
              <Users size={14} style={{ color: '#C0392B' }} />
              <p className="lobby-section-title">Participantes ({session.participants.length}/{session.case.maxPlayers})</p>
            </div>
            {isHost && (
              <button onClick={() => autoAssign.mutate()} disabled={autoAssign.isPending} className="lobby-auto-btn">
                {autoAssign.isPending ? <Loader2 size={11} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Shuffle size={11} />}
                Distribuir Personagens
              </button>
            )}
          </div>

          {/* Participant list */}
          <div className="lobby-participants">
            <AnimatePresence>
              {session.participants.map((p, idx) => {
                const name = p.user?.displayName || p.user?.username || p.guestName || '?'
                const isMe = p.userId === user?.id
                const isOnline = online.includes(p.user?.username ?? '')

                return (
                  <motion.div
                    key={p.id}
                    className={clsx('lobby-participant', isMe && 'lobby-participant-me')}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.06 }}
                  >
                    {/* Avatar */}
                    <div className="lobby-p-avatar">
                      {p.user?.avatarUrl
                        ? <img src={p.user.avatarUrl} alt={name} />
                        : <span>{name[0].toUpperCase()}</span>
                      }
                      <div className={clsx('lobby-p-dot', isOnline ? 'lobby-dot-on' : 'lobby-dot-off')} />
                    </div>

                    {/* Info */}
                    <div className="lobby-p-info">
                      <div className="lobby-p-name-row">
                        <span className="lobby-p-name">{name}</span>
                        {isMe && <span className="lobby-p-you">Tu</span>}
                        {p.userId === session.hostId && <span className="lobby-p-host">Host</span>}
                      </div>
                      {p.character
                        ? <span className="lobby-p-char">↳ {p.character.name}</span>
                        : <span className="lobby-p-no-char">Sem personagem</span>
                      }
                    </div>

                    {/* Host: assign char */}
                    {isHost && !p.character && characters && (
                      <select
                        className="lobby-char-select"
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) assignChar.mutate({ participantId: p.id, characterId: e.target.value })
                        }}
                      >
                        <option value="">Atribuir...</option>
                        {characters.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {session.participants.length === 0 && (
              <div className="lobby-empty">
                <p>Aguardando jogadores...</p>
                <p className="lobby-empty-sub">Partilha o código <strong>{session.accessCode}</strong></p>
              </div>
            )}
          </div>

          {/* Start / Waiting */}
          {isHost ? (
            <div className="lobby-start-box">
              <div className="lobby-start-info">
                <p className="lobby-start-title">Pronto para começar?</p>
                <p className="lobby-start-desc">
                  {!allAssigned && 'Alguns jogadores ainda sem personagem. '}
                  Todos serão notificados quando iniciar.
                </p>
                {session.participants.length < session.case.minPlayers && (
                  <p className="lobby-min-warn">
                    Mínimo {session.case.minPlayers} jogadores (tens {session.participants.length})
                  </p>
                )}
              </div>
              <motion.button
                onClick={() => startSession.mutate(id)}
                disabled={startSession.isPending || session.participants.length < session.case.minPlayers}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="lobby-start-btn"
              >
                {startSession.isPending
                  ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
                  : <Play size={16} />
                }
                Iniciar Investigação
              </motion.button>
            </div>
          ) : (
            <div className="lobby-waiting">
              <motion.div
                className="lobby-waiting-dot"
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
              <p>A aguardar que o host inicie...</p>
            </div>
          )}
        </motion.main>
      </div>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        .lobby-root {
          min-height: 100vh;
          background: #050509;
          color: #CCC;
          font-family: Georgia, 'Times New Roman', serif;
          position: relative;
          overflow: hidden;
        }
        .lobby-ambient {
          position: fixed; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse at 50% -10%, rgba(139,0,0,0.12) 0%, transparent 60%);
        }

        /* Header */
        .lobby-header {
          position: relative; z-index: 20;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(5,5,9,0.9);
          backdrop-filter: blur(8px);
        }
        .lobby-header-inner {
          max-width: 1100px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 24px;
        }
        .lobby-logo { display: flex; align-items: center; gap: 12px; }
        .lobby-logo span { font-size: 20px; }
        .lobby-logo-sub   { font-family: monospace; font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: #555; margin-bottom: 2px; }
        .lobby-logo-title { font-size: 15px; font-weight: 700; color: #E8E4DC; }
        .lobby-conn { display: flex; align-items: center; gap: 6px; font-family: monospace; font-size: 10px; letter-spacing: 0.08em; }
        .lobby-conn-on  { color: #4ade80; }
        .lobby-conn-off { color: #555; }

        /* Body */
        .lobby-body {
          max-width: 1100px; margin: 0 auto;
          display: grid; grid-template-columns: 280px 1fr;
          gap: 24px; padding: 28px 24px;
          position: relative; z-index: 10;
        }
        @media (max-width: 768px) {
          .lobby-body { grid-template-columns: 1fr; }
        }

        /* Cards */
        .lobby-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px; padding: 16px;
          margin-bottom: 14px;
        }
        .lobby-card-label {
          font-family: monospace; font-size: 9px; letter-spacing: 0.18em;
          text-transform: uppercase; color: #555; margin-bottom: 10px;
        }
        .lobby-code-row { display: flex; align-items: center; justify-content: space-between; }
        .lobby-code {
          font-family: 'Courier New', monospace; font-size: 22px; font-weight: 700;
          letter-spacing: 0.25em; color: #C0392B;
        }
        .lobby-copy-btn {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 4px; padding: 6px; color: #666; cursor: pointer; transition: all 0.15s;
        }
        .lobby-copy-btn:hover { color: #CCC; border-color: rgba(255,255,255,0.2); }
        .lobby-code-hint { font-size: 11px; color: #444; margin-top: 6px; font-style: italic; }

        /* Cover */
        .lobby-cover-card { position: relative; border-radius: 8px; overflow: hidden; aspect-ratio: 16/9; margin-bottom: 14px; }
        .lobby-cover-img { width: 100%; height: 100%; }
        .lobby-cover-img img { width: 100%; height: 100%; object-fit: cover; }
        .lobby-cover-placeholder { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: rgba(255,255,255,0.02); font-size: 36px; opacity: 0.2; }
        .lobby-cover-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(5,5,9,0.7) 0%, transparent 50%); }
        .lobby-cover-meta { position: absolute; bottom: 10px; left: 12px; right: 12px; display: flex; justify-content: space-between; }
        .lobby-cover-diff  { font-family: monospace; font-size: 11px; color: #C0392B; letter-spacing: 0.1em; }
        .lobby-cover-players { display: flex; align-items: center; gap: 4px; font-family: monospace; font-size: 10px; color: #888; }

        /* Details */
        .lobby-detail-list { display: flex; flex-direction: column; gap: 8px; }
        .lobby-detail-row  { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #777; }
        .lobby-detail-link { color: #C0392B; text-decoration: none; font-size: 12px; transition: opacity 0.15s; }
        .lobby-detail-link:hover { opacity: 0.75; }

        /* Section header */
        .lobby-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
        .lobby-section-title-row { display: flex; align-items: center; gap: 8px; }
        .lobby-section-title { font-family: monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #666; }
        .lobby-auto-btn {
          display: flex; align-items: center; gap: 5px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 5px; padding: 6px 12px;
          font-family: monospace; font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase;
          color: #666; cursor: pointer; transition: all 0.15s;
        }
        .lobby-auto-btn:hover:not(:disabled) { color: #CCC; border-color: rgba(255,255,255,0.18); }
        .lobby-auto-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Participants */
        .lobby-participants { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
        .lobby-participant {
          display: flex; align-items: center; gap: 12px;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px; padding: 12px 14px; transition: border-color 0.15s;
        }
        .lobby-participant:hover { border-color: rgba(255,255,255,0.1); }
        .lobby-participant-me { border-color: rgba(192,57,43,0.2) !important; background: rgba(192,57,43,0.04) !important; }

        .lobby-p-avatar {
          width: 38px; height: 38px; border-radius: 50%;
          background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.08);
          overflow: hidden; position: relative; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; font-weight: 700; color: #777;
        }
        .lobby-p-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .lobby-p-dot { position: absolute; bottom: 0; right: 0; width: 9px; height: 9px; border-radius: 50%; border: 1.5px solid #050509; }
        .lobby-dot-on  { background: #4ade80; }
        .lobby-dot-off { background: #333; }

        .lobby-p-info { flex: 1; min-width: 0; }
        .lobby-p-name-row { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; flex-wrap: wrap; }
        .lobby-p-name { font-size: 13px; color: #DDD; font-weight: 500; }
        .lobby-p-you  { font-family: monospace; font-size: 9px; background: rgba(192,57,43,0.15); color: #C0392B; padding: 1px 6px; border-radius: 3px; letter-spacing: 0.08em; text-transform: uppercase; }
        .lobby-p-host { font-family: monospace; font-size: 9px; background: rgba(255,255,255,0.05); color: #888; padding: 1px 6px; border-radius: 3px; letter-spacing: 0.08em; text-transform: uppercase; }
        .lobby-p-char    { font-size: 11px; color: #C0392B; font-style: italic; }
        .lobby-p-no-char { font-size: 11px; color: #444; font-style: italic; }

        .lobby-char-select {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 4px; padding: 4px 8px; font-size: 11px; color: #888;
          cursor: pointer; outline: none; flex-shrink: 0;
        }

        .lobby-empty { text-align: center; padding: 32px; color: #444; font-size: 13px; }
        .lobby-empty-sub { font-size: 12px; color: #333; margin-top: 6px; }
        .lobby-empty strong { color: #C0392B; font-family: monospace; letter-spacing: 0.15em; }

        /* Start box */
        .lobby-start-box {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;
          gap: 16px;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px; padding: 18px 20px;
        }
        .lobby-start-title { font-size: 14px; font-weight: 600; color: #E8E4DC; margin-bottom: 4px; }
        .lobby-start-desc  { font-size: 12px; color: #666; max-width: 360px; }
        .lobby-min-warn    { font-size: 11px; color: #fbbf24; margin-top: 6px; }
        .lobby-start-btn {
          display: flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, #8B0000, #C0392B);
          color: #fff; border: none; border-radius: 6px;
          padding: 12px 22px; font-size: 13px; font-family: Georgia, serif; font-weight: 600;
          cursor: pointer; white-space: nowrap; transition: opacity 0.15s;
        }
        .lobby-start-btn:hover:not(:disabled) { opacity: 0.88; }
        .lobby-start-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Waiting */
        .lobby-waiting {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          padding: 18px; text-align: center; font-size: 13px; color: #555;
        }
        .lobby-waiting-dot { width: 8px; height: 8px; border-radius: 50%; background: #C0392B; }
      `}</style>
    </div>
  )
}
