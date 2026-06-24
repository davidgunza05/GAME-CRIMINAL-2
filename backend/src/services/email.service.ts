import nodemailer from 'nodemailer'
import { env } from '../config/env'

// ─── Transporter singleton ────────────────────────────────────────────────────

let _transporter: nodemailer.Transporter | null = null

const getTransporter = (): nodemailer.Transporter => {
  if (_transporter) return _transporter

  // Dev sem credenciais → Ethereal (catch-all fake SMTP, mostra link no terminal)
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
    _transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: 'ethereal_user', pass: 'ethereal_pass' },
    })
    return _transporter
  }

  // Gmail SMTP com App Password (2FA obrigatório na conta Google)
  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: env.GMAIL_USER,
      pass: env.GMAIL_APP_PASSWORD, // App Password de 16 chars (não a senha da conta)
    },
  })

  return _transporter
}

// ─── Send helper ──────────────────────────────────────────────────────────────

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

const sendEmail = async ({ to, subject, html }: SendEmailOptions): Promise<void> => {
  // Dev sem credenciais → log no terminal com preview
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
    if (env.NODE_ENV === 'development') {
      console.log(`\n📧 [DEV EMAIL] To: ${to} | Subject: ${subject}`)
      // Criar conta Ethereal temporária e mostrar preview URL
      try {
        const testAccount = await nodemailer.createTestAccount()
        const devTransport = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          auth: { user: testAccount.user, pass: testAccount.pass },
        })
        const info = await devTransport.sendMail({
          from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
          to, subject, html,
        })
        console.log(`   Preview URL: ${nodemailer.getTestMessageUrl(info)}\n`)
      } catch {
        // Ethereal falhou — só logar subject
        console.log(`   (Ethereal indisponível — email não enviado)\n`)
      }
    }
    return
  }

  await getTransporter().sendMail({
    from: `"${env.EMAIL_FROM_NAME}" <${env.GMAIL_USER}>`,
    to,
    subject,
    html,
  })
}

// ─── Templates ────────────────────────────────────────────────────────────────

const baseStyle = `
  body { font-family: Georgia, serif; background: #0A0A0F; color: #E8E8E8; margin: 0; padding: 0; }
  .container { max-width: 560px; margin: 40px auto; background: #111116; border: 1px solid #2A2A30; border-radius: 8px; overflow: hidden; }
  .header { background: #1A0000; padding: 32px; text-align: center; border-bottom: 1px solid #3A0000; }
  .header h1 { color: #C0392B; font-size: 22px; margin: 0; letter-spacing: 2px; text-transform: uppercase; }
  .body { padding: 36px 32px; }
  .body p { color: #CCC; line-height: 1.7; font-size: 15px; margin: 0 0 16px; }
  .btn { display: block; width: fit-content; margin: 28px auto; background: #C0392B; color: #fff !important; text-decoration: none; padding: 14px 36px; border-radius: 4px; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; }
  .footer { padding: 20px 32px; border-top: 1px solid #1A1A20; text-align: center; }
  .footer p { color: #555; font-size: 12px; margin: 0; }
  .token-box { background: #0A0A0F; border: 1px solid #2A2A30; border-radius: 4px; padding: 12px 16px; font-family: monospace; font-size: 12px; color: #888; word-break: break-all; margin: 16px 0; }
  .note { font-size: 13px; color: #666; margin-top: 24px; }
`

const wrap = (body: string) => `
<!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseStyle}</style></head>
<body><div class="container">
  <div class="header"><h1>🔍 Crime Game</h1></div>
  <div class="body">${body}</div>
  <div class="footer"><p>© ${new Date().getFullYear()} Crime Game · Todos os direitos reservados</p></div>
</div></body></html>`

// ─── Email types ──────────────────────────────────────────────────────────────

export const sendVerificationEmail = async (
  to: string, username: string, token: string
): Promise<void> => {
  const base = env.FRONTEND_URL?.replace(/\/$/, '') || 'http://localhost:3000'
  const url = `${base}/auth/verify-email?token=${token}`
  await sendEmail({
    to,
    subject: 'Ativa a tua conta — Crime Game',
    html: wrap(`
      <p>Olá, <strong style="color:#F0F0EB">${username}</strong>!</p>
      <p>Bem-vindo à plataforma de investigação criminal. Clica no botão abaixo para ativar a tua conta:</p>
      <a href="${url}" class="btn">Ativar Conta</a>
      <p class="note">Se o botão não funcionar, copia este link:</p>
      <div class="token-box">${url}</div>
      <p class="note">Este link expira em <strong style="color:#C0392B">24 horas</strong>.<br>
      Se não criaste esta conta, ignora este email.</p>
    `),
  })
}

export const sendPasswordResetEmail = async (
  to: string, username: string, token: string
): Promise<void> => {
  const base = env.FRONTEND_URL?.replace(/\/$/, '') || 'http://localhost:3000'
  const url = `${base}/auth/reset-password?token=${token}`
  await sendEmail({
    to,
    subject: 'Recupera a tua password — Crime Game',
    html: wrap(`
      <p>Olá, <strong style="color:#F0F0EB">${username}</strong>!</p>
      <p>Recebemos um pedido para recuperar a password da tua conta. Clica no botão abaixo:</p>
      <a href="${url}" class="btn">Redefinir Password</a>
      <p class="note">Este link expira em <strong style="color:#C0392B">15 minutos</strong>.<br>
      Se não fizeste este pedido, ignora este email — a tua password não foi alterada.</p>
    `),
  })
}

export const sendWelcomeEmail = async (to: string, username: string): Promise<void> => {
  const dashBase = env.FRONTEND_URL?.replace(/\/$/, '') || 'http://localhost:3000'
  await sendEmail({
    to,
    subject: 'Bem-vindo ao Crime Game! 🔍',
    html: wrap(`
      <p>Bem-vindo, Detetive <strong style="color:#F0F0EB">${username}</strong>!</p>
      <p>A tua conta está ativa e pronta para a ação. Podes agora participar em investigações criminais imersivas, resolver mistérios e escalar os leaderboards.</p>
      <a href="${dashBase}/dashboard" class="btn">Iniciar Investigação</a>
    `),
  })
}

export const sendEmailChangeVerification = async (
  to: string, username: string, token: string
): Promise<void> => {
  const base = env.FRONTEND_URL?.replace(/\/$/, '') || 'http://localhost:3000'
  const url = `${base}/auth/verify-email?token=${token}`
  await sendEmail({
    to,
    subject: 'Confirma o teu novo email — Crime Game',
    html: wrap(`
      <p>Olá, <strong style="color:#F0F0EB">${username}</strong>!</p>
      <p>Recebemos um pedido para alterar o email da tua conta. Clica no botão para confirmar:</p>
      <a href="${url}" class="btn">Confirmar Novo Email</a>
      <p class="note">Este link expira em <strong style="color:#C0392B">24 horas</strong>.<br>
      Se não fizeste este pedido, ignora este email.</p>
    `),
  })
}
