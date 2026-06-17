import { Resend } from 'resend'
import { env } from '../config/env'

const resend = new Resend(env.RESEND_API_KEY)

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

const sendEmail = async ({ to, subject, html }: SendEmailOptions): Promise<void> => {
  if (env.NODE_ENV === 'development' && !env.RESEND_API_KEY) {
    console.log(`\n📧 [DEV EMAIL] To: ${to}`)
    console.log(`   Subject: ${subject}`)
    console.log(`   Body preview: ${html.substring(0, 200)}...\n`)
    return
  }

  await resend.emails.send({
    from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  })
}

// ─── Templates ───────────────────────────────────────────────────────────────

export const sendVerificationEmail = async (
  to: string,
  username: string,
  token: string
): Promise<void> => {
  const verifyUrl = `${env.FRONTEND_URL}/auth/verify-email?token=${token}`

  await sendEmail({
    to,
    subject: 'Verifica o teu email — Crime Game',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Georgia, serif; background: #0A0A0F; color: #E8E8E8; margin: 0; padding: 0; }
          .container { max-width: 560px; margin: 40px auto; background: #111116; border: 1px solid #2A2A30; border-radius: 8px; overflow: hidden; }
          .header { background: #1A0000; padding: 32px; text-align: center; border-bottom: 1px solid #3A0000; }
          .header h1 { color: #C0392B; font-size: 22px; margin: 0; letter-spacing: 2px; text-transform: uppercase; }
          .body { padding: 36px 32px; }
          .body p { color: #CCC; line-height: 1.7; font-size: 15px; margin: 0 0 16px; }
          .btn { display: block; width: fit-content; margin: 28px auto; background: #C0392B; color: #fff; text-decoration: none; padding: 14px 36px; border-radius: 4px; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; }
          .footer { padding: 20px 32px; border-top: 1px solid #1A1A20; text-align: center; }
          .footer p { color: #555; font-size: 12px; margin: 0; }
          .token-box { background: #0A0A0F; border: 1px solid #2A2A30; border-radius: 4px; padding: 12px 16px; font-family: monospace; font-size: 13px; color: #888; word-break: break-all; margin: 16px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔍 Crime Game</h1>
          </div>
          <div class="body">
            <p>Olá, <strong style="color:#F0F0EB">${username}</strong>!</p>
            <p>Bem-vindo à plataforma de investigação criminal mais imersiva da web. Para ativares a tua conta, clica no botão abaixo:</p>
            <a href="${verifyUrl}" class="btn">Verificar Email</a>
            <p style="font-size:13px; color:#666;">Se o botão não funcionar, copia e cola este link no teu browser:</p>
            <div class="token-box">${verifyUrl}</div>
            <p style="font-size:13px; color:#666; margin-top: 24px;">Este link expira em <strong style="color:#C0392B">24 horas</strong>. Se não criaste esta conta, podes ignorar este email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Crime Game · Todos os direitos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}

export const sendPasswordResetEmail = async (
  to: string,
  username: string,
  token: string
): Promise<void> => {
  const resetUrl = `${env.FRONTEND_URL}/auth/reset-password?token=${token}`

  await sendEmail({
    to,
    subject: 'Redefine a tua password — Crime Game',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Georgia, serif; background: #0A0A0F; color: #E8E8E8; margin: 0; padding: 0; }
          .container { max-width: 560px; margin: 40px auto; background: #111116; border: 1px solid #2A2A30; border-radius: 8px; overflow: hidden; }
          .header { background: #1A0000; padding: 32px; text-align: center; border-bottom: 1px solid #3A0000; }
          .header h1 { color: #C0392B; font-size: 22px; margin: 0; letter-spacing: 2px; text-transform: uppercase; }
          .body { padding: 36px 32px; }
          .body p { color: #CCC; line-height: 1.7; font-size: 15px; margin: 0 0 16px; }
          .btn { display: block; width: fit-content; margin: 28px auto; background: #C0392B; color: #fff; text-decoration: none; padding: 14px 36px; border-radius: 4px; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; }
          .footer { padding: 20px 32px; border-top: 1px solid #1A1A20; text-align: center; }
          .footer p { color: #555; font-size: 12px; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔍 Crime Game</h1>
          </div>
          <div class="body">
            <p>Olá, <strong style="color:#F0F0EB">${username}</strong>!</p>
            <p>Recebemos um pedido para redefinir a password da tua conta. Clica no botão abaixo para criar uma nova password:</p>
            <a href="${resetUrl}" class="btn">Redefinir Password</a>
            <p style="font-size:13px; color:#666; margin-top: 24px;">Este link expira em <strong style="color:#C0392B">15 minutos</strong>. Se não fizeste este pedido, podes ignorar este email — a tua password não foi alterada.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Crime Game · Todos os direitos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}

export const sendWelcomeEmail = async (to: string, username: string): Promise<void> => {
  await sendEmail({
    to,
    subject: 'Bem-vindo ao Crime Game! 🔍',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Georgia, serif; background: #0A0A0F; color: #E8E8E8; margin: 0; padding: 0; }
          .container { max-width: 560px; margin: 40px auto; background: #111116; border: 1px solid #2A2A30; border-radius: 8px; overflow: hidden; }
          .header { background: #1A0000; padding: 32px; text-align: center; border-bottom: 1px solid #3A0000; }
          .header h1 { color: #C0392B; font-size: 22px; margin: 0; letter-spacing: 2px; text-transform: uppercase; }
          .body { padding: 36px 32px; }
          .body p { color: #CCC; line-height: 1.7; font-size: 15px; margin: 0 0 16px; }
          .btn { display: block; width: fit-content; margin: 28px auto; background: #C0392B; color: #fff; text-decoration: none; padding: 14px 36px; border-radius: 4px; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; }
          .footer { padding: 20px 32px; border-top: 1px solid #1A1A20; text-align: center; }
          .footer p { color: #555; font-size: 12px; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔍 Crime Game</h1>
          </div>
          <div class="body">
            <p>Bem-vindo, Detetive <strong style="color:#F0F0EB">${username}</strong>!</p>
            <p>A tua conta está verificada e pronta para a ação. Estás agora habilitado a participar em investigações criminais imersivas, resolver mistérios e escalar os leaderboards.</p>
            <a href="${env.FRONTEND_URL}/dashboard" class="btn">Iniciar Investigação</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Crime Game · Todos os direitos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}
