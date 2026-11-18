import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../src/app'
import { resetStore } from '../src/store'

let app: FastifyInstance

beforeEach(async () => {
  resetStore()
  app = buildApp()
  await app.ready()
})

afterEach(async () => {
  await app.close()
})

describe('POST /api/v1/auth/anonymous', () => {
  it('creates an anonymous identity', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/auth/anonymous', payload: {} })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.anonId).toMatch(/^u_[0-9a-f]{6}$/)
    expect(body.nickname).toContain('匿名同学')
    expect(body.token.length).toBeGreaterThan(10)
  })

  it('accepts a custom nickname', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/anonymous',
      payload: { nickname: '树洞同学' }
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().nickname).toBe('树洞同学')
  })

  it('rejects a nickname longer than 32 chars', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/anonymous',
      payload: { nickname: 'a'.repeat(33) }
    })
    expect(res.statusCode).toBe(400)
    expect(res.json().code).toBe('INVALID_PARAM')
  })
})
