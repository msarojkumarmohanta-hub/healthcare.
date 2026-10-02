import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { successResponse } from '../utils/response.js'
import { getDashboardSummary } from '../services/dashboardService.js'

const router = Router()

router.get('/health', (_req, res) => {
  res.json(successResponse({ status: 'ok', service: 'ruralcare-backend' }, 'Backend is healthy'))
})

router.get('/dashboard', requireAuth, (_req, res) => {
  res.json(successResponse(getDashboardSummary(), 'Dashboard summary'))
})

export default router
