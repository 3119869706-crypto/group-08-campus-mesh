import { beforeEach, describe, expect, it } from 'vitest'
import { RoomStore } from '../src/signaling/rooms'

let now = 0
let store: RoomStore

beforeEach(() => {
  now = 1_700_000_000_000
  store = new RoomStore(() => now)
})

describe('RoomStore', () => {
  it('creates a 6-digit room with a 4-digit passcode and 24h expiry', () => {
    const room = store.create()
    expect(room.roomId).toMatch(/^\d{6}$/)
    expect(room.passcode).toMatch(/^\d{4}$/)
    expect(room.expiresAt - room.createdAt).toBe(24 * 60 * 60 * 1000)
  })

  it('allows joining with the correct passcode', () => {
    const room = store.create()
    const result = store.join(room.roomId, room.passcode)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.room.roomId).toBe(room.roomId)
  })

  it('rejects an unknown room', () => {
    const result = store.join('000000', '1234')
    expect(result).toEqual({ ok: false, code: 'ROOM_NOT_FOUND' })
  })

  it('locks after 5 wrong passcodes and unlocks after 60 seconds', () => {
    const room = store.create()
    for (let i = 0; i < 5; i += 1) {
      expect(store.join(room.roomId, '0000')).toEqual({ ok: false, code: 'INVALID_PASSCODE' })
    }
    expect(store.join(room.roomId, '0000')).toEqual({ ok: false, code: 'ROOM_LOCKED' })
    now += 60_001
    const result = store.join(room.roomId, room.passcode)
    expect(result.ok).toBe(true)
  })

  it('rejects an expired room', () => {
    const room = store.create()
    now += 24 * 60 * 60 * 1000 + 1
    expect(store.join(room.roomId, room.passcode)).toEqual({ ok: false, code: 'ROOM_EXPIRED' })
  })

  it('cleanup removes expired rooms', () => {
    store.create()
    store.create()
    expect(store.size).toBe(2)
    now += 24 * 60 * 60 * 1000 + 1
    store.cleanup()
    expect(store.size).toBe(0)
  })

  it('generates unique room ids', () => {
    const ids = new Set(Array.from({ length: 50 }, () => store.create().roomId))
    expect(ids.size).toBe(50)
  })
})
