import { Request, Response, NextFunction } from 'express'
import { env } from '../config/env'
import { sendServerError } from '../utils/response'

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Em produção só logar erros reais (não 4xx nem operacionais)
  const isOperational = (err as any).isOperational
  if (!isOperational) {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message)
  }

  const message =
    env.NODE_ENV === 'development'
      ? err.message
      : 'Erro interno do servidor'

  sendServerError(res, message)
}

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Rota não encontrada: ${req.method} ${req.path}`,
  })
}
