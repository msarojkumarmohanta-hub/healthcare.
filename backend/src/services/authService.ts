import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { env } from '../config/env.js'
import type { Role } from '../types/auth.js'

export const hashPassword = async (password: string) => bcrypt.hash(password, 10)

export const comparePassword = async (password: string, hash: string) => bcrypt.compare(password, hash)

export const signAccessToken = (userId: string, email: string, role: Role) =>
  jwt.sign({ userId, email, role }, env.jwtSecret, { expiresIn: '15m' })

export const signRefreshToken = (userId: string) =>
  jwt.sign({ userId, type: 'refresh' }, env.jwtRefreshSecret, { expiresIn: '7d' })

export const generateDemoUser = () => ({
  id: randomUUID(),
  email: 'anita@ruralcare.ai',
  name: 'Anita Mishra',
  role: 'PATIENT' as Role,
})
