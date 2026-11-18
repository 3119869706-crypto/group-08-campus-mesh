export interface AnonymousIdentity {
  anonId: string
  nickname: string
  token: string
  expiresIn: number
}

export interface HealthStatus {
  status: 'ok'
  time: string
}

export interface ApiError {
  code: string
  message: string
  requestId?: string
}
