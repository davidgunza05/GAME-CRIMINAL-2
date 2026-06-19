import { prisma } from '../config/prisma'
import { CommChannel, CommType, CommStatus } from '@prisma/client'
import { env } from '../config/env'
import { Resend } from 'resend'

const resend = new Resend(env.RESEND_API_KEY)

// ─── Log communication ────────────────────────────────────────────────────────

const logComm = async (data: {
  userId?: string
  sessionId?: string
  channel: CommChannel
  type: CommType
  recipient: string
  subject?: string
}) => {
  return prisma.communicationLog.create({
    data: { ...data, status: CommStatus.queued },
  })
}

const markSent = (id: string, providerId?: string) =>
  prisma.communicationLog.update({
    where: { id },
    data: { status: CommStatus.sent, sentAt: new Date(), providerId: providerId ?? null },
  })

const markFailed = (id: string, error: string) =>
  prisma.communicationLog.update({
    where: { id },
    data: { status: CommStatus.failed, errorMessage: error },
  })

// ─── Email dispatch ───────────────────────────────────────────────────────────

const sendEmail = async (to: string, subject: string, html: string): Promise<string | null> => {
  if (env.NODE_ENV === 'development' && !env.RESEND_API_KEY) {
    console.log(`\n📧 [DEV] To: ${to} | ${subject}\n`)
    return 'dev-mock-id'
  }
  try {
    const { data } = await resend.emails.send({
      from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM}>`,
      to, subject, html,
    })
    return data?.id ?? null
  } catch (err: any) {
    console.error('[Email Error]', err.message)
    throw err
  }
}

// ─── WhatsApp dispatch (Cloud API) ───────────────────────────────────────────

const sendWhatsApp = async (to: string, message: string): Promise<string | null> => {
  if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_ID) {
    console.log(`\n📱 [DEV] WhatsApp → ${to}: ${message}\n`)
    return 'dev-mock-wa-id'
  }
  const res = await fetch(
    `https://graph.facebook.com/v18.0/${env.WHATSAPP_PHONE_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to.replace(/\D/g, ''),
        type: 'text',
        text: { body: message },
      }),
    }
  )
  if (!res.ok) throw new Error(`WhatsApp error: ${res.status}`)
  const data = await res.json()
  return data.messages?.[0]?.id ?? null
}

// ─── Email Templates ──────────────────────────────────────────────────────────

const layout = (content: string) => `
<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body{font-family:Georgia,serif;background:#0A0A0F;color:#E8E8E8;margin:0;padding:0}
  .wrap{max-width:560px;margin:40px auto;background:#111116;border:1px solid #222228;border-radius:8px;overflow:hidden}
  .hdr{background:#1A0000;padding:28px 32px;border-bottom:1px solid #3A0000;text-align:center}
  .hdr h1{color:#C0392B;font-size:18px;margin:0;letter-spacing:2px;text-transform:uppercase}
  .body{padding:32px}
  .body p{color:#CCC;line-height:1.7;font-size:14px;margin:0 0 14px}
  .btn{display:block;width:fit-content;margin:24px auto;background:#C0392B;color:#fff;text-decoration:none;padding:12px 32px;border-radius:4px;font-size:13px;letter-spacing:1px;text-transform:uppercase}
  .box{background:#0A0A0F;border:1px solid #2A2A30;border-radius:4px;padding:12px 16px;font-family:monospace;font-size:13px;color:#888;margin:16px 0}
  .ftr{padding:16px 32px;border-top:1px solid #1A1A20;text-align:center}
  .ftr p{color:#555;font-size:11px;margin:0}
  strong{color:#F0F0EB}
</style></head><body>
<div class="wrap">
  <div class="hdr"><h1>🔍 Crime Game</h1></div>
  <div class="body">${content}</div>
  <div class="ftr"><p>© ${new Date().getFullYear()} Crime Game</p></div>
</div></body></html>`

// ─── Public communication functions ──────────────────────────────────────────

export const sendSessionInvite = async (opts: {
  to: string
  toName: string
  caseTitle: string
  accessCode: string
  hostName: string
  sessionId: string
  userId?: string
  scheduledAt?: Date | null
}) => {
  const log = await logComm({
    userId: opts.userId,
    sessionId: opts.sessionId,
    channel: CommChannel.email,
    type: CommType.session_invite,
    recipient: opts.to,
    subject: `Convite para investigação: ${opts.caseTitle}`,
  })

  const joinUrl = `${env.FRONTEND_URL}/dashboard/sessions/join`
  const html = layout(`
    <p>Olá, <strong>${opts.toName}</strong>!</p>
    <p><strong>${opts.hostName}</strong> convidou-te para participar na investigação <strong>"${opts.caseTitle}"</strong>.</p>
    ${opts.scheduledAt ? `<p>📅 Agendada para: <strong>${opts.scheduledAt.toLocaleString('pt-PT')}</strong></p>` : ''}
    <p>Usa o código abaixo para entrar na sessão:</p>
    <div class="box">${opts.accessCode}</div>
    <a href="${joinUrl}" class="btn">Entrar na Investigação</a>
    <p style="font-size:12px;color:#666">Este convite foi enviado por ${opts.hostName}. Se não esperavas este email, podes ignorá-lo.</p>
  `)

  try {
    const pid = await sendEmail(opts.to, `Convite: ${opts.caseTitle} — Crime Game`, html)
    await markSent(log.id, pid ?? undefined)
  } catch (err: any) {
    await markFailed(log.id, err.message)
  }
}

export const sendCharacterAssigned = async (opts: {
  to: string
  toName: string
  characterName: string
  characterDesc: string
  caseTitle: string
  sessionId: string
  userId?: string
}) => {
  const log = await logComm({
    userId: opts.userId,
    sessionId: opts.sessionId,
    channel: CommChannel.email,
    type: CommType.character_assigned,
    recipient: opts.to,
    subject: `A tua personagem: ${opts.characterName}`,
  })

  const url = `${env.FRONTEND_URL}/dashboard/sessions/${opts.sessionId}/lobby`
  const html = layout(`
    <p>Olá, <strong>${opts.toName}</strong>!</p>
    <p>A tua personagem para a investigação <strong>"${opts.caseTitle}"</strong> foi atribuída:</p>
    <div class="box"><strong>${opts.characterName}</strong><br>${opts.characterDesc}</div>
    <p>Prepara-te para o roleplay. Guarda os teus segredos e constrói o teu álibi!</p>
    <a href="${url}" class="btn">Ver Sessão</a>
  `)

  try {
    const pid = await sendEmail(opts.to, `A tua personagem: ${opts.characterName} — Crime Game`, html)
    await markSent(log.id, pid ?? undefined)
  } catch (err: any) {
    await markFailed(log.id, err.message)
  }
}

export const sendSessionStarted = async (opts: {
  to: string
  toName: string
  caseTitle: string
  sessionId: string
  userId?: string
}) => {
  const log = await logComm({
    userId: opts.userId,
    sessionId: opts.sessionId,
    channel: CommChannel.email,
    type: CommType.session_started,
    recipient: opts.to,
    subject: `A investigação começou: ${opts.caseTitle}`,
  })

  const url = `${env.FRONTEND_URL}/dashboard/sessions/${opts.sessionId}/play`
  const html = layout(`
    <p>Olá, <strong>${opts.toName}</strong>!</p>
    <p>A investigação <strong>"${opts.caseTitle}"</strong> acaba de começar.</p>
    <p>O host iniciou a sessão. Entra agora para não perderes as primeiras pistas!</p>
    <a href="${url}" class="btn">Entrar na Investigação</a>
  `)

  try {
    const pid = await sendEmail(opts.to, `Investigação iniciada: ${opts.caseTitle}`, html)
    await markSent(log.id, pid ?? undefined)
  } catch (err: any) {
    await markFailed(log.id, err.message)
  }
}

export const sendSessionCompleted = async (opts: {
  to: string
  toName: string
  caseTitle: string
  sessionId: string
  killerName: string
  userScore: number
  userId?: string
}) => {
  const log = await logComm({
    userId: opts.userId,
    sessionId: opts.sessionId,
    channel: CommChannel.email,
    type: CommType.session_completed,
    recipient: opts.to,
    subject: `Caso resolvido: ${opts.caseTitle}`,
  })

  const url = `${env.FRONTEND_URL}/dashboard/sessions/${opts.sessionId}/results`
  const html = layout(`
    <p>Olá, <strong>${opts.toName}</strong>!</p>
    <p>A investigação <strong>"${opts.caseTitle}"</strong> foi concluída.</p>
    <p>O culpado era <strong>${opts.killerName}</strong>.</p>
    <div class="box">A tua pontuação: <strong>${opts.userScore} pts</strong></div>
    <a href="${url}" class="btn">Ver Resultados Completos</a>
  `)

  try {
    const pid = await sendEmail(opts.to, `Caso encerrado: ${opts.caseTitle}`, html)
    await markSent(log.id, pid ?? undefined)
  } catch (err: any) {
    await markFailed(log.id, err.message)
  }
}

export const sendWhatsAppInvite = async (opts: {
  to: string
  toName: string
  caseTitle: string
  accessCode: string
  hostName: string
  sessionId: string
  userId?: string
}) => {
  const log = await logComm({
    userId: opts.userId,
    sessionId: opts.sessionId,
    channel: CommChannel.whatsapp,
    type: CommType.session_invite,
    recipient: opts.to,
  })

  const message = `🔍 *Crime Game*\n\nOlá ${opts.toName}! *${opts.hostName}* convidou-te para a investigação *"${opts.caseTitle}"*.\n\nCódigo de acesso: *${opts.accessCode}*\n\n${env.FRONTEND_URL}/dashboard/sessions/join`

  try {
    const pid = await sendWhatsApp(opts.to, message)
    await markSent(log.id, pid ?? undefined)
  } catch (err: any) {
    await markFailed(log.id, err.message)
  }
}

// ─── Log queries ──────────────────────────────────────────────────────────────

export const getCommLogs = async (opts: {
  page?: number
  limit?: number
  sessionId?: string
  userId?: string
  status?: string
}) => {
  const { page = 1, limit = 30, sessionId, userId, status } = opts
  const skip = (page - 1) * limit
  const where: any = {}
  if (sessionId) where.sessionId = sessionId
  if (userId) where.userId = userId
  if (status) where.status = status

  const [logs, total] = await prisma.$transaction([
    prisma.communicationLog.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { username: true, email: true } } },
    }),
    prisma.communicationLog.count({ where }),
  ])

  return { logs, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}
