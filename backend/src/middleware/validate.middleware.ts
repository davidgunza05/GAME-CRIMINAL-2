import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'
import { sendError } from '../utils/response'

export const validate =
  (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      const errors = formatZodErrors(result.error)
      sendError(res, 'Dados inválidos', 422, errors)
      return
    }
    req[source] = result.data
    next()
  }

const formatZodErrors = (error: ZodError): Record<string, string[]> => {
  const errors: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'root'
    if (!errors[key]) errors[key] = []
    errors[key].push(issue.message)
  }
  return errors
}
