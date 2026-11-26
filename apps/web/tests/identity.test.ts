import { describe, expect, it } from 'vitest'
import type { AnonymousIdentity } from '@campusmesh/shared'
import {
  clearIdentity,
  ensureIdentity,
  loadIdentity,
  resetIdentity,
  saveIdentity
} from '../src/identity'

function memoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (key: string) => data.get(key) ?? null,
    key: (index: number) => Array.from(data.keys())[index] ?? null,
    removeItem: (key: string) => {
      data.delete(key)
    },
    setItem: (key: string, value: string) => {
      data.set(key, value)
    }
  } as Storage
}

const first: AnonymousIdentity = {
  anonId: 'u_aaaaaa',
  nickname: '匿名同学#AAAA',
  token: 'token-a',
  expiresIn: 86400
}

describe('anonymous identity storage', () => {
  it('returns null when nothing is stored', () => {
    expect(loadIdentity(memoryStorage())).toBeNull()
  })

  it('saves and loads an identity', () => {
    const store = memoryStorage()
    saveIdentity(first, store)
    expect(loadIdentity(store)).toEqual(first)
  })

  it('ignores malformed or incomplete data', () => {
    const store = memoryStorage()
    store.setItem('campusmesh.identity.v1', '{bad json')
    expect(loadIdentity(store)).toBeNull()
    store.setItem('campusmesh.identity.v1', JSON.stringify({ anonId: 'u_x' }))
    expect(loadIdentity(store)).toBeNull()
  })

  it('reuses the stored identity instead of creating a new one', async () => {
    const store = memoryStorage()
    saveIdentity(first, store)
    let calls = 0
    const created = await ensureIdentity(async () => {
      calls += 1
      return { ...first, anonId: 'u_bbbbbb' }
    }, store)
    expect(calls).toBe(0)
    expect(created.anonId).toBe('u_aaaaaa')
  })

  it('creates and persists when empty', async () => {
    const store = memoryStorage()
    const created = await ensureIdentity(async () => ({ ...first, anonId: 'u_cccccc' }), store)
    expect(created.anonId).toBe('u_cccccc')
    expect(loadIdentity(store)?.anonId).toBe('u_cccccc')
  })

  it('clears the old identity before resetting', async () => {
    const store = memoryStorage()
    saveIdentity(first, store)
    const created = await resetIdentity(async () => ({ ...first, anonId: 'u_dddddd' }), store)
    expect(created.anonId).toBe('u_dddddd')
    expect(loadIdentity(store)?.anonId).toBe('u_dddddd')
  })

  it('clearIdentity removes the stored value', () => {
    const store = memoryStorage()
    saveIdentity(first, store)
    clearIdentity(store)
    expect(loadIdentity(store)).toBeNull()
  })
})
