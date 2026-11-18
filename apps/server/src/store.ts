import { randomBytes } from 'node:crypto'
import type { AnonymousIdentity } from '@campusmesh/shared'

interface AnonymousUser {
  anonId: string
  nickname: string
  createdAt: string
}

const users = new Map<string, AnonymousUser>()

export function createAnonymousIdentity(nickname?: string): AnonymousIdentity {
  const anonId = `u_${randomBytes(3).toString('hex')}`
  const name = nickname?.trim() || `匿名同学#${randomBytes(2).toString('hex').toUpperCase()}`
  users.set(anonId, { anonId, nickname: name, createdAt: new Date().toISOString() })
  return {
    anonId,
    nickname: name,
    token: randomBytes(24).toString('base64url'),
    expiresIn: 86400
  }
}

export function getUser(anonId: string): AnonymousUser | undefined {
  return users.get(anonId)
}

export function resetStore(): void {
  users.clear()
}
