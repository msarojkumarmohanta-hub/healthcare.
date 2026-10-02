import type { NextFunction, Request, Response } from 'express'
import { errorResponse } from '../utils/response.js'

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json(errorResponse('NOT_FOUND', `Route ${req.originalUrl} not found`))
}

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)

  if (typeof err === 'object' && err !== null && 'status' in err) {
    const status = Number((err as { status?: number }).status ?? 500)
    const message = (err as { message?: string }).message ?? 'Something went wrong'
    return res.status(status).json(errorResponse('APP_ERROR', message))
  }

  return res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR', 'Internal server error'))
}
