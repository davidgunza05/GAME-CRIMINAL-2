'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send } from 'lucide-react'
import { ChatMessage, Participant } from '@/types/game'
import { clsx } from 'clsx'

interface GameChatProps {
  messages: ChatMessage[]
  participants: Participant[]
  onlineUsers: string[]
  onSend: (msg: string) => void
  currentUsername?: string
}

export default function GameChat({ messages, participants, onlineUsers, onSend, currentUsername }: GameChatProps) {
  const [input, setInput] = useState('')
  const [tab, setTab] = useState<'chat' | 'players'>('chat')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    onSend(trimmed)
    setInput('')
  }

  return (
    <div className="gc-root">
      {/* Tab switcher */}
      <div className="gc-tabs">
        <button
          onClick={() => setTab('chat')}
          className={clsx('gc-tab', tab === 'chat' && 'gc-tab-active')}
        >
          Chat
        </button>
        <button
          onClick={() => setTab('players')}
          className={clsx('gc-tab', tab === 'players' && 'gc-tab-active')}
        >
          Jogadores ({participants.length})
        </button>
      </div>

      {/* Chat tab */}
      {tab === 'chat' && (
        <>
          <div className="gc-messages">
            {messages.length === 0 && (
              <p className="gc-empty">Sem mensagens. Começa a investigar!</p>
            )}
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => {
                const isMe = msg.username === currentUsername
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={clsx('gc-msg', isMe && 'gc-msg-me')}
                  >
                    <span className={clsx('gc-msg-name', isMe && 'gc-msg-name-me')}>
                      {msg.username}
                    </span>
                    <span className="gc-msg-text">{msg.message}</span>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          <div className="gc-input-row">
            <input
              className="gc-input"
              placeholder="Mensagem..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              maxLength={300}
            />
            <button onClick={handleSend} className="gc-send-btn" disabled={!input.trim()}>
              <Send size={12} />
            </button>
          </div>
        </>
      )}

      {/* Players tab */}
      {tab === 'players' && (
        <div className="gc-players">
          {participants.map((p) => {
            const name = p.user?.username || p.guestName || '?'
            const isOnline = onlineUsers.includes(name)
            return (
              <div key={p.id} className="gc-player">
                <div className={clsx('gc-player-dot', isOnline ? 'gc-dot-on' : 'gc-dot-off')} />
                <div className="gc-player-info">
                  <span className="gc-player-name">{p.user?.displayName || name}</span>
                  {p.character && (
                    <span className="gc-player-char">{p.character.name}</span>
                  )}
                </div>
                {p.score > 0 && (
                  <span className="gc-player-score">{p.score}</span>
                )}
              </div>
            )
          })}
        </div>
      )}

      <style jsx>{`
        .gc-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }
        .gc-tabs {
          display: flex;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          flex-shrink: 0;
        }
        .gc-tab {
          flex: 1;
          padding: 10px 6px;
          font-family: monospace;
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #444;
          background: none;
          border: none;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.15s;
        }
        .gc-tab:hover { color: #888; }
        .gc-tab-active { color: #C0392B !important; border-bottom-color: #C0392B; }

        /* Chat */
        .gc-messages {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          scrollbar-width: none;
        }
        .gc-empty { font-size: 11px; color: #333; text-align: center; padding: 20px 0; font-style: italic; }

        .gc-msg { display: flex; flex-direction: column; gap: 2px; }
        .gc-msg-name { font-family: monospace; font-size: 9px; color: #555; letter-spacing: 0.06em; }
        .gc-msg-name-me { color: #C0392B; }
        .gc-msg-text { font-size: 12px; color: #AAA; line-height: 1.5; word-break: break-word; }

        .gc-input-row {
          display: flex;
          gap: 6px;
          padding: 8px;
          border-top: 1px solid rgba(255,255,255,0.05);
          flex-shrink: 0;
        }
        .gc-input {
          flex: 1;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 5px;
          padding: 7px 10px;
          font-size: 12px;
          color: #CCC;
          font-family: Georgia, serif;
          outline: none;
          transition: border-color 0.15s;
        }
        .gc-input::placeholder { color: #333; }
        .gc-input:focus { border-color: rgba(192,57,43,0.35); }
        .gc-send-btn {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(192,57,43,0.15);
          border: 1px solid rgba(192,57,43,0.3);
          border-radius: 5px;
          color: #C0392B;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.15s;
        }
        .gc-send-btn:hover:not(:disabled) { background: rgba(192,57,43,0.25); }
        .gc-send-btn:disabled { opacity: 0.3; cursor: default; }

        /* Players */
        .gc-players {
          flex: 1;
          overflow-y: auto;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .gc-player {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 0;
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }
        .gc-player-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .gc-dot-on  { background: #22c55e; box-shadow: 0 0 5px #22c55e; }
        .gc-dot-off { background: #333; }
        .gc-player-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .gc-player-name { font-size: 12px; color: #CCC; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .gc-player-char { font-size: 10px; color: #555; font-style: italic; }
        .gc-player-score { font-family: monospace; font-size: 11px; color: #C0392B; flex-shrink: 0; }
      `}</style>
    </div>
  )
}
