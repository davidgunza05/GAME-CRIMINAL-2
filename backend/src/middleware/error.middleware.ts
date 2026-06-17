import { Request, Response, NextFunction } from 'express'
import { env } from '../config/env'
import { sendServerError } from '../utils/response'

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err)

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
