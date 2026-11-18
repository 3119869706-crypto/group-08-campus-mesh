import type { AnonymousIdentity, HealthStatus } from '@campusmesh/shared'

const base = import.meta.env.VITE_API_BASE ?? '/api/v1'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init
  })
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { message?: string } | null
    throw new Error(payload?.message ?? `请求失败（${res.status}）`)
  }
  return (await res.json()) as T
}

export function getHealth(): Promise<HealthStatus> {
  return request<HealthStatus>('/health')
}

export function createIdentity(nickname?: string): Promise<AnonymousIdentity> {
  return request<AnonymousIdentity>('/auth/anonymous', {
    method: 'POST',
    body: JSON.stringify(nickname ? { nickname } : {})
  })
}
