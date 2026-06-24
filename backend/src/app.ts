import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import { env } from './config/env'
import router from './routes'
import { errorHandler, notFound } from './middleware/error.middleware'

const app = express()

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet())
app.use(
  cors({
    origin: [env.CLIENT_URL, env.FRONTEND_URL],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// ─── Parsing ──────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// ─── Logging ──────────────────────────────────────────────────────────────────
if (env.NODE_ENV !== 'test') {
  // Log apenas erros (4xx/5xx) — evita spam de cada request no terminal
  app.use(morgan('combined', {
    skip: (_req, res) => res.statusCode < 400,
  }))
}

// ─── Trust proxy (for rate limiting behind Nginx/Cloudflare) ─────────────────
app.set('trust proxy', 1)

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', router)

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use(notFound)

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler)

export default app
