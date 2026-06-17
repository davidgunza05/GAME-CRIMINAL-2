import crypto from 'crypto'
import bcrypt from 'bcryptjs'

export const generateSecureToken = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12)
}

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}

export const generateEmailVerificationToken = (): { token: string; tokenHash: string } => {
  const token = generateSecureToken()
  const tokenHash = hashToken(token)
  return { token, tokenHash }
}

export const getEmailTokenExpiry = (): Date => {
  const date = new Date()
  date.setHours(date.getHours() + 24) // 24 horas
  return date
}

export const getPasswordResetExpiry = (): Date => {
  const date = new Date()
  date.setMinutes(date.getMinutes() + 15) // 15 minutos
  return date
}
