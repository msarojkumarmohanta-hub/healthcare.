import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import router from './routes/index.js'
import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  }),
)
app.use(express.json({ limit: '2mb' }))
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
)

app.use('/api', router)
app.use(notFoundHandler)
app.use(errorHandler)

export default app
