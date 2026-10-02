export type Role = 'PATIENT' | 'DOCTOR' | 'HEALTH_WORKER' | 'ADMIN'

export type JwtPayload = {
  userId: string
  email: string
  role: Role
  iat?: number
  exp?: number
}

export type AuthUser = {
  id: string
  email: string
  role: Role
  name: string
}
