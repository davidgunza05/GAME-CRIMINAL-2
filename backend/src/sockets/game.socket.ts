import { Server as HttpServer } from 'http'
import { Server, Socket } from 'socket.io'
import { env } from '../config/env'
import { verifyAccessToken } from '../utils/jwt'
import * as sessionService from '../services/session.service'

// ─── Event types ──────────────────────────────────────────────────────────────

export const EVENTS = {
  // Connection
  JOIN_SESSION:        'session:join',
  LEAVE_SESSION:       'session:leave',
  SESSION_UPDATED:     'session:updated',
  PRESENCE_UPDATED:    'session:presence',

  // Game flow
  SESSION_STARTED:     'game:started',
  SESSION_PAUSED:      'game:paused',
  SESSION_RESUMED:     'game:resumed',
  SESSION_COMPLETED:   'game:completed',
  STAGE_ADVANCED:      'game:stage_advanced',

  // Evidence
  EVIDENCE_UNLOCKED:   'evidence:unlocked',

  // Accusation
  ACCUSATION_SUBMITTED: 'accusation:submitted',
  ACCUSATION_RESULT:    'accusation:result',

  // Chat
  CHAT_MESSAGE:        'chat:message',

  // Errors
  ERROR:               'error',
} as const

// ─── In-memory presence ───────────────────────────────────────────────────────

const sessionPresence = new Map<string, Set<string>>() // sessionId → Set<username>

// ─── Setup Socket.io ──────────────────────────────────────────────────────────

export const setupSocketIO = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: [env.CLIENT_URL, env.FRONTEND_URL],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  // ── Auth middleware ──────────────────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1]
    if (!token) {
      // Allow guest connections with name
      socket.data.user = null
      return next()
    }
    try {
      const payload = verifyAccessToken(token)
      socket.data.user = payload
      next()
    } catch {
      next(new Error('Unauthorized'))
    }
  })

  io.on('connection', (socket: Socket) => {
    const username = socket.data.user?.username ?? `Guest_${socket.id.slice(0, 5)}`
    console.log(`🔌 Socket connected: ${username}`)

    // ── Join session room ────────────────────────────────────────────────────
    socket.on(EVENTS.JOIN_SESSION, async ({ sessionId }: { sessionId: string }) => {
      socket.join(sessionId)
      socket.data.sessionId = sessionId

      if (!sessionPresence.has(sessionId)) sessionPresence.set(sessionId, new Set())
      sessionPresence.get(sessionId)!.add(username)

      io.to(sessionId).emit(EVENTS.PRESENCE_UPDATED, {
        online: Array.from(sessionPresence.get(sessionId) ?? []),
      })

      console.log(`👤 ${username} joined room ${sessionId}`)
    })

    // ── Leave session room ───────────────────────────────────────────────────
    socket.on(EVENTS.LEAVE_SESSION, ({ sessionId }: { sessionId: string }) => {
      socket.leave(sessionId)
      sessionPresence.get(sessionId)?.delete(username)
      io.to(sessionId).emit(EVENTS.PRESENCE_UPDATED, {
        online: Array.from(sessionPresence.get(sessionId) ?? []),
      })
    })

    // ── Chat message ─────────────────────────────────────────────────────────
    socket.on(EVENTS.CHAT_MESSAGE, ({ sessionId, message }: { sessionId: string; message: string }) => {
      if (!message?.trim() || message.length > 500) return
      io.to(sessionId).emit(EVENTS.CHAT_MESSAGE, {
        username,
        message: message.trim(),
        timestamp: new Date().toISOString(),
      })
    })

    // ── Disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const sid = socket.data.sessionId
      if (sid) {
        sessionPresence.get(sid)?.delete(username)
        io.to(sid).emit(EVENTS.PRESENCE_UPDATED, {
          online: Array.from(sessionPresence.get(sid) ?? []),
        })
      }
      console.log(`🔌 Socket disconnected: ${username}`)
    })
  })

  return io
}

// ─── Emit helpers (called from controllers) ───────────────────────────────────

let _io: Server | null = null
export const setIO = (io: Server) => { _io = io }
export const getIO = (): Server | null => _io

export const emitToSession = (sessionId: string, event: string, data: any) => {
  _io?.to(sessionId).emit(event, data)
}
