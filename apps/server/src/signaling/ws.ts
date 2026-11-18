import { randomUUID } from 'node:crypto'
import type { FastifyPluginAsync } from 'fastify'
import type { WebSocket } from 'ws'
import { RoomStore } from './rooms'

interface Peer {
  id: string
  socket: WebSocket
  roomId?: string
}

interface IncomingMessage {
  type?: string
  roomId?: string
  passcode?: string
  to?: string
  payload?: unknown
}

const ERROR_MESSAGES: Record<string, string> = {
  ROOM_NOT_FOUND: '房间不存在',
  INVALID_PASSCODE: '房间号或口令不正确',
  ROOM_EXPIRED: '房间已过期',
  ROOM_LOCKED: '尝试次数过多，请 1 分钟后再试',
  NOT_IN_ROOM: '请先加入房间',
  PEER_NOT_FOUND: '对方不在当前房间',
  INVALID_MESSAGE: '消息格式错误'
}

function send(socket: WebSocket, message: unknown): void {
  if (socket.readyState === 1) {
    socket.send(JSON.stringify(message))
  }
}

function sendError(socket: WebSocket, code: string): void {
  send(socket, { type: 'error', code, message: ERROR_MESSAGES[code] ?? '未知错误' })
}

export const signalingRoutes: FastifyPluginAsync = async (app) => {
  const store = new RoomStore()
  const peers = new Map<string, Peer>()
  const roomMembers = new Map<string, Set<string>>()

  function broadcast(roomId: string, message: unknown, exceptPeerId?: string): void {
    const members = roomMembers.get(roomId)
    if (!members) return
    for (const peerId of members) {
      if (peerId === exceptPeerId) continue
      const peer = peers.get(peerId)
      if (peer) send(peer.socket, message)
    }
  }

  function leaveRoom(peer: Peer, notify = true): void {
    const roomId = peer.roomId
    if (!roomId) return
    const members = roomMembers.get(roomId)
    members?.delete(peer.id)
    peer.roomId = undefined
    if (notify) {
      broadcast(roomId, { type: 'room:peer-left', peerId: peer.id })
    }
    if (!members || members.size === 0) {
      roomMembers.delete(roomId)
      store.remove(roomId)
    }
  }

  app.get('/ws/signal', { websocket: true }, (socket) => {
    const peer: Peer = { id: randomUUID(), socket }
    peers.set(peer.id, peer)
    send(socket, { type: 'hello', peerId: peer.id })

    socket.on('message', (raw) => {
      let message: IncomingMessage
      try {
        message = JSON.parse(raw.toString()) as IncomingMessage
      } catch {
        sendError(socket, 'INVALID_MESSAGE')
        return
      }

      switch (message.type) {
        case 'room:create': {
          if (peer.roomId) leaveRoom(peer)
          const room = store.create()
          peer.roomId = room.roomId
          roomMembers.set(room.roomId, new Set([peer.id]))
          send(socket, {
            type: 'room:created',
            roomId: room.roomId,
            passcode: room.passcode,
            expiresAt: new Date(room.expiresAt).toISOString()
          })
          return
        }

        case 'room:join': {
          if (!message.roomId || !message.passcode) {
            sendError(socket, 'INVALID_MESSAGE')
            return
          }
          const result = store.join(message.roomId, message.passcode)
          if (!result.ok) {
            sendError(socket, result.code)
            return
          }
          if (peer.roomId) leaveRoom(peer)

          const existing = Array.from(roomMembers.get(result.room.roomId) ?? [])
          peer.roomId = result.room.roomId
          const members = roomMembers.get(result.room.roomId) ?? new Set<string>()
          members.add(peer.id)
          roomMembers.set(result.room.roomId, members)

          send(socket, {
            type: 'room:joined',
            roomId: result.room.roomId,
            selfId: peer.id,
            peers: existing
          })
          broadcast(result.room.roomId, { type: 'room:peer-joined', peerId: peer.id }, peer.id)
          return
        }

        case 'signal:offer':
        case 'signal:answer':
        case 'signal:ice': {
          if (!peer.roomId) {
            sendError(socket, 'NOT_IN_ROOM')
            return
          }
          if (!message.to) {
            sendError(socket, 'INVALID_MESSAGE')
            return
          }
          const members = roomMembers.get(peer.roomId)
          const target = peers.get(message.to)
          if (!members?.has(message.to) || !target || target.roomId !== peer.roomId) {
            sendError(socket, 'PEER_NOT_FOUND')
            return
          }
          send(target.socket, {
            type: message.type,
            from: peer.id,
            payload: message.payload
          })
          return
        }

        case 'room:leave': {
          leaveRoom(peer)
          send(socket, { type: 'room:left' })
          return
        }

        default:
          sendError(socket, 'INVALID_MESSAGE')
      }
    })

    socket.on('close', () => {
      leaveRoom(peer)
      peers.delete(peer.id)
    })

    socket.on('error', () => {
      leaveRoom(peer)
      peers.delete(peer.id)
    })
  })
}
