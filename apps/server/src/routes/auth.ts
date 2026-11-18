import type { FastifyPluginAsync } from 'fastify'
import { createAnonymousIdentity } from '../store'

interface AnonymousBody {
  nickname?: string
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: AnonymousBody }>('/auth/anonymous', async (request, reply) => {
    const nickname = request.body?.nickname
    if (nickname && nickname.length > 32) {
      return reply.code(400).send({ code: 'INVALID_PARAM', message: '昵称不能超过 32 个字符' })
    }
    return createAnonymousIdentity(nickname)
  })
}
