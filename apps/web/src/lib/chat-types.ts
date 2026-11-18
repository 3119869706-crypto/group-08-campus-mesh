export type ConnectionKind = 'connecting' | 'direct' | 'relay' | 'offline'

export type MessageStatus = 'sending' | 'sent' | 'failed'

export interface ChatMessage {
  id: string
  conversationId: string
  self: boolean
  text: string
  ts: number
  status: MessageStatus
  /** AI 生成且仅自己可见，尚未发送给对方 */
  fromAi?: boolean
}

export interface Conversation {
  id: string
  peerName: string
  lastActive: string
  connection: ConnectionKind
}

export interface ChatConnection {
  kind: ConnectionKind
  send(text: string): Promise<void>
  onIncoming(cb: (text: string) => void): void
  onStateChange(cb: (kind: ConnectionKind) => void): void
  dispose(): void
}
