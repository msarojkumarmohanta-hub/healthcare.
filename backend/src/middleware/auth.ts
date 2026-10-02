import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { errorResponse } from '../utils/response.js'
import type { JwtPayload, Role } from '../types/auth.js'

export type AuthenticatedRequest = Request & {
  user?: {
    userId: string
    email: string
    role: Role
  }
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json(errorResponse('UNAUTHORIZED', 'Authentication required'))
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    }
    next()
  } catch {
    return res.status(401).json(errorResponse('INVALID_TOKEN', 'Invalid or expired token'))
  }
}

export const requireRole = (...roles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json(errorResponse('UNAUTHORIZED', 'Authentication required'))
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json(errorResponse('FORBIDDEN', 'You do not have access to this resource'))
    }

    next()
  }
}
