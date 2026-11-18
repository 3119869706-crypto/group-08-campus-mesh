import Fastify from 'fastify'
import cors from '@fastify/cors'
import websocket from '@fastify/websocket'
import { healthRoutes } from './routes/health'
import { authRoutes } from './routes/auth'
import { signalingRoutes } from './signaling/ws'

export function buildApp() {
  const app = Fastify({ logger: false })
  app.register(cors, { origin: true })
  app.register(websocket)
  app.register(healthRoutes, { prefix: '/api/v1' })
  app.register(authRoutes, { prefix: '/api/v1' })
  app.register(signalingRoutes)
  return app
}
