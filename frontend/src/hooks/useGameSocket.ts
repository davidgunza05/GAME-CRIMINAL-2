'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/store/auth.store'
import { GameSession, ChatMessage } from '@/types/game'

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:4000'

export const EVENTS = {
  JOIN_SESSION:        'session:join',
  LEAVE_SESSION:       'session:leave',
  SESSION_UPDATED:     'session:updated',
  PRESENCE_UPDATED:    'session:presence',
  SESSION_STARTED:     'game:started',
  SESSION_PAUSED:      'game:paused',
  SESSION_RESUMED:     'game:resumed',
  SESSION_COMPLETED:   'game:completed',
  STAGE_ADVANCED:      'game:stage_advanced',
  EVIDENCE_UNLOCKED:   'evidence:unlocked',
  ACCUSATION_RESULT:   'accusation:result',
  CHAT_MESSAGE:        'chat:message',
} as const

interface UseGameSocketOptions {
  sessionId: string
  onSessionUpdate?: (session: GameSession) => void
  onStageAdvanced?: (data: any) => void
  onEvidenceUnlocked?: (data: any) => void
  onAccusationResult?: (data: any) => void
  onChatMessage?: (msg: ChatMessage) => void
  onSessionStarted?: () => void
  onSessionCompleted?: () => void
}

export const useGameSocket = (opts: UseGameSocketOptions) => {
  const { sessionId, onSessionUpdate, onStageAdvanced, onEvidenceUnlocked,
    onAccusationResult, onChatMessage, onSessionStarted, onSessionCompleted } = opts

  const { accessToken } = useAuthStore()
  const socketRef = useRef<Socket | null>(null)
  const [online, setOnline] = useState<string[]>([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      auth: { token: accessToken ?? '' },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      socket.emit(EVENTS.JOIN_SESSION, { sessionId })
    })

    socket.on('disconnect', () => setConnected(false))

    socket.on(EVENTS.PRESENCE_UPDATED, ({ online }: { online: string[] }) => {
      setOnline(online)
    })

    socket.on(EVENTS.SESSION_UPDATED, ({ session }: { session: GameSession }) => {
      onSessionUpdate?.(session)
    })

    socket.on(EVENTS.SESSION_STARTED, ({ session }: { session: GameSession }) => {
      onSessionUpdate?.(session)
      onSessionStarted?.()
    })

    socket.on(EVENTS.SESSION_PAUSED, ({ session }: { session: GameSession }) => {
      onSessionUpdate?.(session)
    })

    socket.on(EVENTS.SESSION_RESUMED, ({ session }: { session: GameSession }) => {
      onSessionUpdate?.(session)
    })

    socket.on(EVENTS.SESSION_COMPLETED, ({ session }: { session: GameSession }) => {
      onSessionUpdate?.(session)
      onSessionCompleted?.()
    })

    socket.on(EVENTS.STAGE_ADVANCED, (data: any) => {
      onSessionUpdate?.(data.session)
      onStageAdvanced?.(data)
    })

    socket.on(EVENTS.EVIDENCE_UNLOCKED, (data: any) => {
      onEvidenceUnlocked?.(data)
    })

    socket.on(EVENTS.ACCUSATION_RESULT, (data: any) => {
      onAccusationResult?.(data)
    })

    socket.on(EVENTS.CHAT_MESSAGE, (msg: ChatMessage) => {
      onChatMessage?.(msg)
    })

    return () => {
      socket.emit(EVENTS.LEAVE_SESSION, { sessionId })
      socket.disconnect()
    }
  }, [sessionId, accessToken])

  const sendChat = useCallback((message: string) => {
    socketRef.current?.emit(EVENTS.CHAT_MESSAGE, { sessionId, message })
  }, [sessionId])

  return { connected, online, sendChat, socket: socketRef.current }
}
