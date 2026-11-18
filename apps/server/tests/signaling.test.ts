import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { WebSocket } from 'ws'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../src/app'

class TestClient {
  readonly ws: WebSocket
  peerId = ''
  private readonly queue: Array<Record<string, unknown>> = []
  private readonly waiters: Array<{
    type: string
    resolve: (message: Record<string, unknown>) => void
    timer: ReturnType<typeof setTimeout>
  }> = []

  constructor(url: string) {
    this.ws = new WebSocket(url)
    this.ws.on('message', (raw) => {
      const message = JSON.parse(raw.toString()) as Record<string, unknown>
      const index = this.waiters.findIndex((waiter) => waiter.type === message.type)
      if (index >= 0) {
        const [waiter] = this.waiters.splice(index, 1)
        clearTimeout(waiter.timer)
        waiter.resolve(message)
      } else {
        this.queue.push(message)
      }
    })
  }

  async opened(): Promise<void> {
    if (this.ws.readyState === WebSocket.OPEN) return
    await new Promise<void>((resolve, reject) => {
      this.ws.once('open', () => resolve())
      this.ws.once('error', reject)
    })
  }

  send(message: unknown): void {
    this.ws.send(JSON.stringify(message))
  }

  waitFor(type: string, timeout = 3000): Promise<Record<string, unknown>> {
    const index = this.queue.findIndex((message) => message.type === type)
    if (index >= 0) {
      return Promise.resolve(this.queue.splice(index, 1)[0])
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const waiterIndex = this.waiters.findIndex((waiter) => waiter.timer === timer)
        if (waiterIndex >= 0) this.waiters.splice(waiterIndex, 1)
        reject(new Error(`timeout waiting for ${type}`))
      }, timeout)
      this.waiters.push({ type, resolve, timer })
    })
  }

  close(): void {
    this.ws.close()
  }
}

let app: FastifyInstance
let url = ''
const clients: TestClient[] = []

async function connect(): Promise<TestClient> {
  const client = new TestClient(url)
  clients.push(client)
  await client.opened()
  const hello = await client.waitFor('hello')
  client.peerId = String(hello.peerId)
  return client
}

beforeAll(async () => {
  app = buildApp()
  await app.listen({ port: 0, host: '127.0.0.1' })
  const address = app.server.address()
  if (!address || typeof address === 'string') throw new Error('server did not bind a port')
  url = `ws://127.0.0.1:${address.port}/ws/signal`
})

afterAll(async () => {
  for (const client of clients) client.close()
  await app.close()
})

describe('WebSocket signaling', () => {
  it('creates a room, joins, and relays an offer', async () => {
    const a = await connect()
    const b = await connect()

    a.send({ type: 'room:create' })
    const created = await a.waitFor('room:created')
    const roomId = created.roomId as string
    const passcode = created.passcode as string
    expect(roomId).toMatch(/^\d{6}$/)

    const peerJoined = a.waitFor('room:peer-joined')
    b.send({ type: 'room:join', roomId, passcode })
    const joined = await b.waitFor('room:joined')
    expect(joined.roomId).toBe(roomId)
    expect(joined.peers).toContain(a.peerId)

    const offerPromise = b.waitFor('signal:offer')
    a.send({ type: 'signal:offer', to: joined.selfId, payload: { sdp: 'fake-offer' } })
    const offer = await offerPromise
    expect(offer.payload).toEqual({ sdp: 'fake-offer' })

    const peerLeft = b.waitFor('room:peer-left')
    a.close()
    await peerLeft
    expect(await peerJoined).toBeTruthy()
  }, 10000)

  it('rejects an incorrect passcode', async () => {
    const a = await connect()
    a.send({ type: 'room:create' })
    const created = await a.waitFor('room:created')

    const intruder = await connect()
    intruder.send({ type: 'room:join', roomId: created.roomId, passcode: '0000' })
    const error = await intruder.waitFor('error')
    expect(error.code).toBe('INVALID_PASSCODE')
  }, 10000)

  it('rejects signaling before joining a room', async () => {
    const client = await connect()
    client.send({ type: 'signal:offer', to: 'someone', payload: {} })
    const error = await client.waitFor('error')
    expect(error.code).toBe('NOT_IN_ROOM')
  }, 10000)
})
