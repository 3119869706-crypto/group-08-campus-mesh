import { randomInt } from 'node:crypto'

export interface RoomInfo {
  roomId: string
  passcode: string
  createdAt: number
  expiresAt: number
}

export type JoinFailure = 'ROOM_NOT_FOUND' | 'INVALID_PASSCODE' | 'ROOM_EXPIRED' | 'ROOM_LOCKED'

export type JoinResult = { ok: true; room: RoomInfo } | { ok: false; code: JoinFailure }

interface Attempt {
  count: number
  lockedUntil: number
}

const MAX_ATTEMPTS = 5
const LOCK_MS = 60_000
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000

export class RoomStore {
  private readonly rooms = new Map<string, RoomInfo>()
  private readonly attempts = new Map<string, Attempt>()

  constructor(
    private readonly now: () => number = () => Date.now(),
    private readonly ttlMs: number = DEFAULT_TTL_MS
  ) {}

  get size(): number {
    return this.rooms.size
  }

  create(): RoomInfo {
    let roomId = ''
    do {
      roomId = String(randomInt(100000, 1000000))
    } while (this.rooms.has(roomId))

    const passcode = String(randomInt(1000, 10000))
    const room: RoomInfo = {
      roomId,
      passcode,
      createdAt: this.now(),
      expiresAt: this.now() + this.ttlMs
    }
    this.rooms.set(roomId, room)
    return room
  }

  get(roomId: string): RoomInfo | undefined {
    const room = this.rooms.get(roomId)
    if (!room) return undefined
    if (room.expiresAt <= this.now()) {
      this.rooms.delete(roomId)
      this.attempts.delete(roomId)
      return undefined
    }
    return room
  }

  join(roomId: string, passcode: string): JoinResult {
    const now = this.now()
    let attempt = this.attempts.get(roomId)
    if (attempt && attempt.lockedUntil > now) {
      return { ok: false, code: 'ROOM_LOCKED' }
    }
    if (attempt && attempt.lockedUntil !== 0 && attempt.lockedUntil <= now) {
      this.attempts.delete(roomId)
      attempt = undefined
    }

    const room = this.rooms.get(roomId)
    if (!room) {
      return { ok: false, code: 'ROOM_NOT_FOUND' }
    }
    if (room.expiresAt <= now) {
      this.rooms.delete(roomId)
      this.attempts.delete(roomId)
      return { ok: false, code: 'ROOM_EXPIRED' }
    }

    if (room.passcode !== passcode) {
      const count = (attempt?.count ?? 0) + 1
      const lockedUntil = count >= MAX_ATTEMPTS ? now + LOCK_MS : 0
      this.attempts.set(roomId, { count, lockedUntil })
      return { ok: false, code: 'INVALID_PASSCODE' }
    }

    this.attempts.delete(roomId)
    return { ok: true, room }
  }

  remove(roomId: string): void {
    this.rooms.delete(roomId)
    this.attempts.delete(roomId)
  }

  cleanup(): void {
    const now = this.now()
    for (const [roomId, room] of this.rooms) {
      if (room.expiresAt <= now) {
        this.rooms.delete(roomId)
        this.attempts.delete(roomId)
      }
    }
  }

  reset(): void {
    this.rooms.clear()
    this.attempts.clear()
  }
}
