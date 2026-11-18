import Fastify from 'fastify'
import cors from '@fastify/cors'
import { healthRoutes } from './routes/health'
import { authRoutes } from './routes/auth'

export function buildApp() {
  const app = Fastify({ logger: false })
  app.register(cors, { origin: true })
  app.register(healthRoutes, { prefix: '/api/v1' })
  app.register(authRoutes, { prefix: '/api/v1' })
  return app
}
