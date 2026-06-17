import { Response } from 'express'
import { ApiResponse } from '../types'

export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    ...(message && { message }),
    ...(data !== undefined && { data }),
  }
  return res.status(statusCode).json(response)
}

export const sendCreated = <T>(res: Response, data?: T, message?: string): Response => {
  return sendSuccess(res, data, message, 201)
}

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  errors?: Record<string, string[]>
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    ...(errors && { errors }),
  }
  return res.status(statusCode).json(response)
}

export const sendUnauthorized = (res: Response, message = 'Não autorizado'): Response => {
  return sendError(res, message, 401)
}

export const sendForbidden = (res: Response, message = 'Acesso negado'): Response => {
  return sendError(res, message, 403)
}

export const sendNotFound = (res: Response, message = 'Recurso não encontrado'): Response => {
  return sendError(res, message, 404)
}

export const sendConflict = (res: Response, message: string): Response => {
  return sendError(res, message, 409)
}

export const sendServerError = (res: Response, message = 'Erro interno do servidor'): Response => {
  return sendError(res, message, 500)
}
