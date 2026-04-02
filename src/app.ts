import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import path from 'path'
import { config } from './config'
import routes from './routes'
import { errorHandler } from './middleware/errorHandler'

const app = express()

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy:     false,
  })
)

app.use(
  cors({
    origin:      config.clientOrigin,
    credentials: true,
    methods:     ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

app.use(morgan(config.isDev ? 'dev' : 'combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())
app.get("/health", (req, res) => {
  res.json({ success: true, message: 'Healthy' })
})

// Serve uploaded files
app.use(
  '/uploads',
  express.static(path.join(process.cwd(), config.uploadDir), {
    maxAge: '7d',
  })
)

app.use('/api', routes)

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

// Global error handler
app.use(errorHandler)

export default app