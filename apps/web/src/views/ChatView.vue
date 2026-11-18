<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { ChatMessage, ConnectionKind, Conversation } from '../lib/chat-types'
import { getMessages, putMessage, putMessages } from '../lib/db'
import { LocalChatConnection } from '../lib/chat-connection'

const MAX_LEN = 2000

const conversations: Conversation[] = [
  { id: 'c1', peerName: '匿名同学#A3F', lastActive: '刚建立连接', connection: 'connecting' },
  { id: 'c2', peerName: '匿名同学#7C2', lastActive: '昨天', connection: 'direct' },
  { id: 'c3', peerName: '匿名同学#F19', lastActive: '3 天前', connection: 'direct' }
]

const activeId = ref('c1')
const messages = ref<ChatMessage[]>([])
const connKind = ref<ConnectionKind>('connecting')
const input = ref('')
const typing = ref(false)
const listEl = ref<HTMLElement | null>(null)

const persona = ref('学习助手')
const personas = ['学习助手', '树洞倾听', '文案润色']
const skills = ['翻译', '润色', '总结', '解释代码']
const aiDraft = ref('')

let connection: LocalChatConnection | null = null
let typingTimer: number | null = null

function uid() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `m_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function seedMessages(convId: string): ChatMessage[] {
  const now = Date.now()
  const raw: Array<[boolean, string, number]> = [
    [false, '在吗？想问问二课总结怎么写', 240000],
    [true, '在的，你先把活动名称和要点发我', 200000],
    [false, '好，我整理一下。AI 能帮我润色吗？', 160000],
    [true, '可以，点右下角“AI 助手”就行', 120000]
  ]
  return raw.map(([self, text, ago], i) => ({
    id: `seed_${convId}_${i}`,
    conversationId: convId,
    self,
    text,
    ts: now - ago,
    status: 'sent'
  }))
}

function setupConnection() {
  connection?.dispose()
  connection = new LocalChatConnection()
  connection.onStateChange(k => {
    connKind.value = k
  })
  connection.onIncoming(text => {
    if (typingTimer) {
      clearTimeout(typingTimer)
      typingTimer = null
    }
    typing.value = false
    const msg: ChatMessage = {
      id: uid(),
      conversationId: activeId.value,
      self: false,
      text,
      ts: Date.now(),
      status: 'sent'
    }
    messages.value.push(msg)
    putMessage(msg)
  })
}

async function loadConversation(id: string) {
  let list = await getMessages(id)
  if (list.length === 0 && id === 'c1') {
    list = seedMessages(id)
    await putMessages(list)
  }
  messages.value = list
  setupConnection()
}

function selectConversation(id: string) {
  if (id === activeId.value) return
  activeId.value = id
  input.value = ''
  aiDraft.value = ''
  typing.value = false
  loadConversation(id)
}

async function persist(msg: ChatMessage) {
  await putMessage(msg)
}

async function sendMessage(text: string) {
  const content = text.trim()
  if (!content || content.length > MAX_LEN) return

  const msg: ChatMessage = {
    id: uid(),
    conversationId: activeId.value,
    self: true,
    text: content,
    ts: Date.now(),
    status: 'sending'
  }
  messages.value.push(msg)
  input.value = ''
  await nextTick()

  try {
    await connection?.send(content)
    msg.status = 'sent'
    typing.value = true
    typingTimer = window.setTimeout(() => {
      typing.value = false
    }, 1400)
  } catch {
    msg.status = 'failed'
  }
  await persist(msg)
}

async function retry(msg: ChatMessage) {
  msg.status = 'sending'
  await persist(msg)
  try {
    await connection?.send(msg.text)
    msg.status = 'sent'
  } catch {
    msg.status = 'failed'
  }
  await persist(msg)
}

function onSend() {
  sendMessage(input.value)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    onSend()
  }
}

function runSkill(skill: string) {
  const base = input.value.trim() || '当前输入内容'
  const map: Record<string, string> = {
    翻译: `（${persona.value}·翻译）${base} → This is the simulated English translation for review.`,
    润色: `（${persona.value}·润色）${base}，表达更通顺、条理更清晰的版本已生成，供你确认。`,
    总结: `（${persona.value}·总结）概括如下：${base}。核心要点已提炼，可按需插入聊天。`,
    解释代码: `（${persona.value}·解释代码）这段代码的作用是：${base}。其执行流程与关键变量说明如下。`
  }
  aiDraft.value = map[skill]
}

function insertToChat() {
  if (!aiDraft.value) return
  input.value = aiDraft.value
  aiDraft.value = ''
}

const badgeClass = () => ({
  direct: 'badge-direct',
  relay: 'badge-relay',
  connecting: 'badge-connecting',
  offline: 'badge-offline'
}[connKind.value])

const badgeText = () =>
  ({
    direct: '直连 · 加密',
    relay: '中继 · 加密',
    connecting: '连接建立中…',
    offline: '连接中断 · 重连中…'
  })[connKind.value]

function scrollBottom() {
  nextTick(() => {
    if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight
  })
}

watch(messages, scrollBottom, { deep: true })

onMounted(() => loadConversation(activeId.value))
onUnmounted(() => {
  connection?.dispose()
  if (typingTimer) clearTimeout(typingTimer)
})
</script>

<template>
  <div class="chat-page">
    <!-- 左：会话列表 -->
    <aside class="panel conv-panel">
      <h3 class="panel-title">会话</h3>
      <ul class="conv-list">
        <li
          v-for="c in conversations"
          :key="c.id"
          class="conv-item"
          :class="{ active: c.id === activeId }"
          @click="selectConversation(c.id)"
        >
          <span class="mini-avatar">匿</span>
          <span class="conv-meta">
            <span class="conv-name">{{ c.peerName }}</span>
            <span class="conv-time">{{ c.lastActive }}</span>
          </span>
        </li>
      </ul>
    </aside>

    <!-- 中：消息区 -->
    <section class="panel msg-panel">
      <header class="msg-header">
        <h2 class="peer-name">{{ conversations.find(c => c.id === activeId)?.peerName }}</h2>
        <span class="conn-badge" :class="badgeClass()">
          <i class="dot"></i>{{ badgeText() }}
        </span>
      </header>

      <div ref="listEl" class="msg-list">
        <div
          v-for="m in messages"
          :key="m.id"
          class="bubble-row"
          :class="m.self ? 'is-self' : 'is-peer'"
        >
          <div class="bubble" :class="m.self ? 'self-bubble' : 'peer-bubble'">
            <p class="bubble-text">{{ m.text }}</p>
            <button v-if="m.status === 'failed'" class="retry-btn" @click="retry(m)">发送失败，点击重试</button>
            <span v-else-if="m.self && m.status === 'sending'" class="bubble-status">发送中…</span>
          </div>
        </div>

        <p v-if="typing" class="typing">对方正在输入…</p>
      </div>

      <div class="input-area">
        <textarea
          v-model="input"
          class="msg-input"
          :maxlength="MAX_LEN"
          rows="3"
          placeholder="输入消息…（≤2000 字）"
          @keydown="onKeydown"
        ></textarea>
        <button class="send-btn" :disabled="!input.trim()" @click="onSend">发送</button>
      </div>
      <p class="input-foot" :class="{ over: input.length >= MAX_LEN }">{{ input.length }} / {{ MAX_LEN }}　Enter 发送 · Shift+Enter 换行</p>
    </section>

    <!-- 右：AI 助手 -->
    <aside class="panel ai-panel">
      <h3 class="panel-title">AI 助手</h3>

      <p class="setting-label">人设</p>
      <select v-model="persona" class="text-input">
        <option v-for="p in personas" :key="p" :value="p">{{ p }}</option>
      </select>

      <p class="setting-label">快捷技能</p>
      <div class="skill-grid">
        <button v-for="s in skills" :key="s" class="skill-btn" @click="runSkill(s)">{{ s }}</button>
      </div>

      <div v-if="aiDraft" class="ai-draft">
        <p class="ai-draft-text">{{ aiDraft }}</p>
      </div>
      <div v-else class="ai-notice">
        AI 回复默认仅自己可见，点击“插入聊天”才会发送给对方
      </div>

      <button class="insert-btn" :disabled="!aiDraft" @click="insertToChat">插入聊天</button>
    </aside>
  </div>
</template>

<style scoped>
.chat-page {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr) 300px;
  gap: 16px;
  height: calc(100vh - 128px);
  min-height: 560px;
}

.panel {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.panel-title {
  margin: 0 0 16px;
  font-size: 16px;
  color: var(--navy);
}

/* 会话列表 */
.conv-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.conv-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid transparent;
  cursor: pointer;
}

.conv-item.active {
  background: var(--pale);
  border-color: var(--border);
}

.mini-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--pale);
  border: 1px solid var(--border);
  color: var(--navy);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.conv-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.conv-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--navy);
}

.conv-time {
  font-size: 12px;
  color: #8a94a6;
}

/* 消息区 */
.msg-panel {
  padding: 0;
}

.msg-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 22px;
  border-bottom: 1px solid var(--border);
}

.peer-name {
  margin: 0;
  font-size: 18px;
  color: var(--navy);
}

.conn-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 999px;
}

.conn-badge .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.badge-direct {
  background: #e6f4e7;
  color: #3f8f46;
}

.badge-relay {
  background: #fdf0e3;
  color: var(--orange);
}

.badge-connecting {
  background: var(--light);
  color: var(--blue);
}

.badge-offline {
  background: #fbe5e5;
  color: #c0392b;
}

.msg-list {
  flex: 1;
  overflow-y: auto;
  padding: 22px;
  background: #fbfcfe;
}

.bubble-row {
  display: flex;
  margin-bottom: 14px;
}

.bubble-row.is-peer {
  justify-content: flex-start;
}

.bubble-row.is-self {
  justify-content: flex-end;
}

.bubble {
  max-width: 72%;
  padding: 12px 16px;
  border-radius: 12px;
}

.peer-bubble {
  background: #d9e8f8;
  border-bottom-left-radius: 4px;
}

.self-bubble {
  background: #d9efd2;
  border-bottom-right-radius: 4px;
}

.bubble-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: #2d3748;
  white-space: pre-wrap;
  word-break: break-word;
}

.bubble-status {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #6b7a90;
}

.retry-btn {
  margin-top: 6px;
  border: 0;
  background: transparent;
  color: #c0392b;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
}

.typing {
  margin: 4px 0 0;
  font-size: 13px;
  color: #8a94a6;
}

/* 输入区 */
.input-area {
  display: flex;
  gap: 12px;
  padding: 16px 22px 6px;
  align-items: stretch;
}

.msg-input {
  flex: 1;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
}

.msg-input:focus {
  outline: none;
  border-color: var(--blue);
}

.send-btn {
  width: 96px;
  border: 0;
  border-radius: 10px;
  background: var(--blue);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.send-btn:hover:not(:disabled) {
  background: var(--blue-dark);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-foot {
  margin: 0;
  padding: 0 22px 16px;
  font-size: 12px;
  color: #8a94a6;
}

.input-foot.over {
  color: var(--orange);
}

/* AI 助手 */
.setting-label {
  margin: 16px 0 8px;
  font-size: 13px;
  color: #4a5568;
}

.setting-label:first-of-type {
  margin-top: 0;
}

.text-input {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 14px;
  font-family: inherit;
  background: #fff;
}

.skill-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.skill-btn {
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 8px;
  padding: 10px 0;
  font-size: 13px;
  color: var(--navy);
  cursor: pointer;
  font-family: inherit;
}

.skill-btn:hover {
  border-color: var(--blue);
  color: var(--blue);
}

.ai-notice {
  margin-top: 16px;
  background: #fdf4d8;
  border: 1px solid #f2dd9c;
  border-radius: 10px;
  padding: 14px;
  font-size: 13px;
  line-height: 1.7;
  color: #8a6d2f;
}

.ai-draft {
  margin-top: 16px;
  background: var(--pale);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
  max-height: 200px;
  overflow-y: auto;
}

.ai-draft-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: #2d3748;
}

.insert-btn {
  margin-top: auto;
  width: 100%;
  border: 0;
  border-radius: 10px;
  background: var(--blue);
  color: #fff;
  padding: 12px 0;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.insert-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 980px) {
  .chat-page {
    grid-template-columns: 1fr;
    height: auto;
  }
  .panel {
    min-height: auto;
  }
  .msg-list {
    min-height: 320px;
  }
}
</style>
