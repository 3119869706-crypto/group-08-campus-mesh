import type { AnonymousIdentity } from '@campusmesh/shared'
import { createIdentity } from './api'

const STORAGE_KEY = 'campusmesh.identity.v1'

function defaultStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function loadIdentity(store: Storage | null = defaultStorage()): AnonymousIdentity | null {
  if (!store) return null
  try {
    const raw = store.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Partial<AnonymousIdentity>
    if (
      typeof data.anonId !== 'string' ||
      typeof data.nickname !== 'string' ||
      typeof data.token !== 'string'
    ) {
      return null
    }
    return {
      anonId: data.anonId,
      nickname: data.nickname,
      token: data.token,
      expiresIn: typeof data.expiresIn === 'number' ? data.expiresIn : 86400
    }
  } catch {
    return null
  }
}

export function saveIdentity(
  identity: AnonymousIdentity,
  store: Storage | null = defaultStorage()
): void {
  if (!store) return
  store.setItem(STORAGE_KEY, JSON.stringify(identity))
}

export function clearIdentity(store: Storage | null = defaultStorage()): void {
  if (!store) return
  store.removeItem(STORAGE_KEY)
}

export async function ensureIdentity(
  create: () => Promise<AnonymousIdentity> = createIdentity,
  store: Storage | null = defaultStorage()
): Promise<AnonymousIdentity> {
  const existing = loadIdentity(store)
  if (existing) return existing
  const identity = await create()
  saveIdentity(identity, store)
  return identity
}

export async function resetIdentity(
  create: () => Promise<AnonymousIdentity> = createIdentity,
  store: Storage | null = defaultStorage()
): Promise<AnonymousIdentity> {
  clearIdentity(store)
  return ensureIdentity(create, store)
}
