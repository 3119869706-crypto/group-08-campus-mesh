import type { ChatConnection, ConnectionKind } from './chat-types'

/**
 * #11（WebRTC DataChannel）就绪前的本地模拟连接。
 * 接口与真实 WebRTC 连接保持一致：届时新增 WebRtcChatConnection 实现同一接口即可替换，
 * 真实实现的重连使用 ICE restart，连接方式由 ICE candidate pair 决定直连/中继。
 */
export class LocalChatConnection implements ChatConnection {
  kind: ConnectionKind = 'connecting'
  private incomingCb: (text: string) => void = () => {}
  private stateCb: (kind: ConnectionKind) => void = () => {}
  private reconnectTimer: number | null = null
  private replyTimer: number | null = null

  constructor() {
    window.setTimeout(() => this.setState('direct'), 800)
    window.addEventListener('offline', this.handleOffline)
    window.addEventListener('online', this.handleOnline)
  }

  private setState(kind: ConnectionKind) {
    this.kind = kind
    this.stateCb(kind)
  }

  private handleOffline = () => {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.setState('offline')
  }

  private handleOnline = () => {
    this.setState('connecting')
    // 模拟在 10 秒内自动重连成功
    this.reconnectTimer = window.setTimeout(() => {
      this.setState(navigator.onLine ? 'direct' : 'offline')
    }, 800)
  }

  onIncoming(cb: (text: string) => void) {
    this.incomingCb = cb
  }

  onStateChange(cb: (kind: ConnectionKind) => void) {
    this.stateCb = cb
  }

  async send(text: string): Promise<void> {
    if (!navigator.onLine || this.kind === 'offline') {
      throw new Error('当前离线，消息未送达')
    }
    await new Promise(r => setTimeout(r, 300))
    this.replyTimer = window.setTimeout(() => this.incomingCb(this.autoReply(text)), 1400)
  }

  private autoReply(text: string): string {
    if (text.includes('二课') || text.includes('总结')) {
      return '在的，你先把活动名称和要点发我，我帮你理思路。'
    }
    return '收到，我这边看一下，稍后回复你。'
  }

  dispose() {
    window.removeEventListener('offline', this.handleOffline)
    window.removeEventListener('online', this.handleOnline)
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    if (this.replyTimer) clearTimeout(this.replyTimer)
  }
}
