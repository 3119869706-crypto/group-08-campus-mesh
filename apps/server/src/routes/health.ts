import type { FastifyPluginAsync } from 'fastify'
import type { HealthStatus } from '@campusmesh/shared'

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async (): Promise<HealthStatus> => {
    return { status: 'ok', time: new Date().toISOString() }
  })
}
