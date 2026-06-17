export type SessionStatus   = 'pending' | 'active' | 'paused' | 'completed' | 'cancelled'
export type SessionMode     = 'multiplayer' | 'solo' | 'hybrid'
export type ParticipantStatus = 'invited' | 'confirmed' | 'playing' | 'left'
export type EvidenceType    = 'document' | 'photo' | 'video' | 'audio' | 'object' | 'qrcode'
export type AccusationResult = 'correct' | 'incorrect' | 'invalid'

export interface GameStage {
  id: string
  caseId: string
  order: number
  title: string
  description: string
  isLast: boolean
  evidence?: EvidenceSummary[]
}

export interface Character {
  id: string
  caseId: string
  name: string
  description: string
  backstory: string
  objectives: string
  secrets: string
  alibi: string
  isKiller: boolean
  isDetective: boolean
  avatarUrl?: string | null
}

export interface EvidenceSummary {
  id: string
  title: string
  type: EvidenceType
  isRedHerring: boolean
  sortOrder: number
}

export interface Evidence {
  id: string
  caseId: string
  stageId?: string | null
  title: string
  description: string
  type: EvidenceType
  contentUrl?: string | null
  contentText?: string | null
  isRedHerring: boolean
  qrCode?: string | null
  stage?: { id: string; title: string; order: number } | null
}

export interface EvidenceUnlock {
  id: string
  sessionId: string
  evidenceId: string
  unlockedAt: string
  evidence: Evidence
  unlockedBy?: { username: string } | null
}

export interface Participant {
  id: string
  sessionId: string
  userId?: string | null
  status: ParticipantStatus
  guestName?: string | null
  score: number
  joinedAt?: string | null
  user?: { id: string; username: string; displayName: string | null; avatarUrl: string | null } | null
  character?: {
    id: string; name: string; description: string
    avatarUrl?: string | null; isKiller: boolean; isDetective: boolean
  } | null
}

export interface Accusation {
  id: string
  sessionId: string
  participantId: string
  suspectId: string
  motive: string
  method: string
  evidenceCited: string[]
  result: AccusationResult
  feedbackText?: string | null
  attemptNumber: number
  createdAt: string
  suspect: { id: string; name: string; avatarUrl?: string | null }
  participant: {
    user?: { username: string; displayName: string | null; avatarUrl: string | null } | null
    character?: { name: string } | null
  }
}

export interface GameSession {
  id: string
  caseId: string
  hostId: string
  status: SessionStatus
  mode: SessionMode
  accessCode: string
  currentStageId?: string | null
  scheduledAt?: string | null
  startedAt?: string | null
  completedAt?: string | null
  estimatedMinutes?: number | null
  location?: string | null
  meetingUrl?: string | null
  createdAt: string
  updatedAt: string
  case: {
    id: string; title: string; slug: string
    coverImageUrl?: string | null; difficulty: string
    minPlayers: number; maxPlayers: number
  }
  host: { id: string; username: string; displayName: string | null; avatarUrl: string | null }
  currentStage?: GameStage | null
  participants: Participant[]
}

export interface ChatMessage {
  username: string
  message: string
  timestamp: string
}
