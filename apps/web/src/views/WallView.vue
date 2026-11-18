<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { AnonymousIdentity } from '@campusmesh/shared'
import { getHealth } from '../api'
import { ensureIdentity, loadIdentity, resetIdentity } from '../identity'

const health = ref<'checking' | 'ok' | 'down'>('checking')
const identity = ref<AnonymousIdentity | null>(null)
const error = ref('')
const creating = ref(false)

const posts = [
  { id: 1, tag: '树洞', title: '图书馆四楼靠窗的位置，今天又满了……', meta: '12 分钟前 · 匿名同学#A3F' },
  { id: 2, tag: '求助', title: '有没有同学选修过《软件工程与项目管理》？', meta: '38 分钟前 · 匿名同学#7C2' },
  { id: 3, tag: '闲置', title: '出一台九成新的机械键盘，青轴，可小刀', meta: '1 小时前 · 匿名同学#F19' }
]

onMounted(async () => {
  identity.value = loadIdentity()
  if (!identity.value) {
    creating.value = true
    try {
      identity.value = await ensureIdentity()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '创建匿名身份失败'
    } finally {
      creating.value = false
    }
  }

  try {
    await getHealth()
    health.value = 'ok'
  } catch {
    health.value = 'down'
  }
})

async function handleReset() {
  if (!window.confirm('重置后旧身份和本地记录将无法恢复，确定继续？')) return
  creating.value = true
  error.value = ''
  try {
    identity.value = await resetIdentity()
  } catch (e) {
    identity.value = null
    error.value = e instanceof Error ? e.message : '重置匿名身份失败'
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <section>
    <div class="card">
      <h1>校园墙</h1>
      <p class="muted">
        服务端状态：
        <span class="status" :class="{ down: health === 'down' }">
          {{ health === 'checking' ? '检查中' : health === 'ok' ? '正常' : '不可用' }}
        </span>
      </p>

      <div class="identity-box">
        <p v-if="creating && !identity" class="muted">正在创建匿名身份…</p>

        <template v-else-if="identity">
          <p class="muted">当前身份（已保存在浏览器本地）</p>
          <p><strong>{{ identity.nickname }}</strong>（{{ identity.anonId }}）</p>
          <button class="btn ghost" :disabled="creating" @click="handleReset">重置身份</button>
          <p v-if="error" class="error">{{ error }}</p>
        </template>

        <template v-else>
          <p class="muted">匿名身份创建失败，请确认服务端已启动。</p>
          <button class="btn" @click="handleReset">重试</button>
          <p v-if="error" class="error">{{ error }}</p>
        </template>
      </div>
    </div>

    <article v-for="post in posts" :key="post.id" class="post">
      <span class="tag">{{ post.tag }}</span>
      <h3>{{ post.title }}</h3>
      <p class="muted">{{ post.meta }}</p>
    </article>

    <p class="muted">列表为脚手架占位数据，发帖与评论在 Issue #7 / #8 实现。</p>
  </section>
</template>

<style scoped>
.identity-box {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--border);
}
.btn.ghost {
  margin-top: 8px;
  background: #fff;
  color: var(--blue);
  border: 1px solid var(--blue);
}
.post h3 {
  margin: 4px 0 8px;
  font-size: 16px;
}
</style>
