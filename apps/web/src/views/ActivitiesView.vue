<script setup lang="ts">
import { computed, ref } from 'vue'

interface Activity {
  id: string
  name: string
  date: string
  subtitle: string
  title: string
  meta: string
  points: string[]
  summary: string
  generated: boolean
}

const activities = ref<Activity[]>([
  {
    id: 'volunteer',
    name: '志愿服务',
    date: '10-18',
    subtitle: '社区服务',
    title: '社区志愿服务 · 活动总结',
    meta: '10 月 18 日 · 2 学时 · 主办：青年志愿者协会',
    points: ['负责入口签到与物资发放', '服务 3 小时，累计引导 120 人次', '体会到组织与沟通的重要性'],
    summary:
      '10 月 18 日，我参加了社区志愿服务活动。\n\n活动开始前，我们完成了场地布置与物资清点。在三个小时的服务中，我负责入口签到与物资发放，累计引导 120 人次。\n\n这次活动让我认识到，志愿服务不仅是付出，更是一份责任与成长。',
    generated: true
  },
  {
    id: 'lecture',
    name: '学术讲座',
    date: '10-20',
    subtitle: '人工智能前沿',
    title: '人工智能前沿讲座 · 活动总结',
    meta: '10 月 20 日 · 1 学时 · 主办：计算机信息工程学院',
    points: ['了解大模型的基本原理与发展脉络', '记录了 AI 在教育领域的应用案例', '现场向主讲嘉宾提出了一个问题'],
    summary: '',
    generated: false
  },
  {
    id: 'sports',
    name: '文体活动',
    date: '10-22',
    subtitle: '校园定向越野',
    title: '校园定向越野 · 活动总结',
    meta: '10 月 22 日 · 2 学时 · 主办：校学生会',
    points: ['与三名队友组队完成全部打卡点', '负责读图规划路线与分工', '在团队协作中提升了决策效率'],
    summary: '',
    generated: false
  },
  {
    id: 'practice',
    name: '社会实践',
    date: '10-25',
    subtitle: '暑期成果分享',
    title: '暑期社会实践成果分享 · 活动总结',
    meta: '10 月 25 日 · 2 学时 · 主办：团委实践部',
    points: ['整理暑期调研数据并制作汇报材料', '代表小组上台分享实践成果', '复盘了调研过程中的不足与改进方向'],
    summary: '',
    generated: false
  }
])

const activeId = ref('volunteer')
const persona = ref('学习助手')
const style = ref<'正式' | '朴实' | '生动'>('正式')
const target = ref<number>(800)
const generating = ref(false)

const styleOptions = ['正式', '朴实', '生动'] as const
const targetOptions = [500, 800, 1200] as const

const current = computed(() => activities.value.find(a => a.id === activeId.value)!)
const draft = computed({
  get: () => current.value.summary,
  set: v => {
    current.value.summary = v
  }
})

const count = computed(() => draft.value.replace(/\s/g, '').length)
const overLimit = computed(() => count.value > target.value)
const statusText = computed(() => (generating.value ? '生成中' : current.value.generated ? '已生成' : '未生成'))

function select(id: string) {
  if (generating.value) return
  activeId.value = id
}

const styleEnding: Record<string, string> = {
  正式: '本次活动组织有序、流程规范，使我在实践能力与责任意识方面均得到切实提升，达到了预期的育人目标。',
  朴实: '这次活动虽然有点累，但我学到了很多，也认识了不少新朋友，感觉很值得。',
  生动: '回想起活动当天的一幕幕，忙碌而温暖，这份经历会成为我大学生活里闪闪发光的记忆。'
}

function buildSummary(a: Activity): string {
  const intro = `${a.meta}，我参加了「${a.name}」活动。`
  const body = a.points.map(p => `在活动过程中，我${p}。`)
  const parts = [intro, ...body, styleEnding[style.value]]
  let text = parts.join('\n\n')
  const filler = '通过亲身参与，我对活动的意义有了更真切的体会，也更加明白理论与实践相结合的重要性。'
  while (text.replace(/\s/g, '').length < target.value * 0.95) {
    text += filler
  }
  return text
}

function generate() {
  if (generating.value) return
  generating.value = true
  window.setTimeout(() => {
    draft.value = buildSummary(current.value)
    current.value.generated = true
    generating.value = false
  }, 1200)
}

function exportMarkdown() {
  const blob = new Blob([draft.value], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${current.value.title}.md`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="page">
    <!-- 左侧：活动分类 -->
    <aside class="panel side">
      <h3 class="panel-title">二课活动</h3>
      <ul class="cat-list">
        <li
          v-for="a in activities"
          :key="a.id"
          class="cat-item"
          :class="{ active: a.id === activeId }"
          @click="select(a.id)"
        >
          <span class="cat-name">{{ a.name }}</span>
          <span class="cat-sub">{{ a.date }} · {{ a.subtitle }}</span>
        </li>
      </ul>
    </aside>

    <!-- 中间：活动详情与总结编辑 -->
    <section class="panel content">
      <h2 class="content-title">{{ current.title }}</h2>
      <p class="content-meta">{{ current.meta }}</p>

      <h4 class="section-label">个人要点</h4>
      <ul class="points">
        <li v-for="(p, i) in current.points" :key="i">{{ p }}</li>
      </ul>

      <h4 class="section-label link">AI 生成总结（可编辑）</h4>
      <textarea v-model="draft" class="summary-box" :disabled="generating" placeholder="点击右侧“生成总结”后，这里会出现可编辑的总结内容。"></textarea>
      <p class="content-foot" :class="{ over: overLimit }">
        字数：{{ count }} / {{ target }}　状态：{{ statusText }}
        <span v-if="overLimit" class="warn">已超过目标字数</span>
      </p>
    </section>

    <!-- 右侧：生成设置 -->
    <aside class="panel settings">
      <h3 class="panel-title">生成设置</h3>

      <p class="setting-label">AI 人设</p>
      <input v-model="persona" class="text-input" type="text" />

      <p class="setting-label">写作风格</p>
      <div class="options">
        <button
          v-for="s in styleOptions"
          :key="s"
          class="option"
          :class="{ on: style === s }"
          @click="style = s"
        >
          {{ s }}
        </button>
      </div>

      <p class="setting-label">目标字数</p>
      <div class="options">
        <button
          v-for="t in targetOptions"
          :key="t"
          class="option"
          :class="{ on: target === t }"
          @click="target = t"
        >
          {{ t }}
        </button>
      </div>

      <button class="primary-btn" :disabled="generating" @click="generate">
        {{ generating ? '生成中…' : '生成总结' }}
      </button>
      <button class="ghost-btn" :disabled="!current.generated" @click="exportMarkdown">导出 Markdown</button>

      <p class="tip">导出前请确认内容真实</p>
    </aside>
  </div>
</template>

<style scoped>
.page {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr) 300px;
  gap: 20px;
  align-items: start;
}

.panel {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 22px;
}

.panel-title {
  margin: 0 0 16px;
  font-size: 16px;
  color: var(--navy);
}

/* 左侧分类 */
.cat-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cat-item {
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cat-item.active {
  background: #eef4ff;
  border-color: #c7dbfc;
}

.cat-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--navy);
}

.cat-item.active .cat-name {
  color: var(--blue);
}

.cat-sub {
  font-size: 12px;
  color: #8a94a6;
}

/* 中间内容 */
.content-title {
  margin: 0 0 10px;
  font-size: 19px;
  color: var(--navy);
}

.content-meta {
  margin: 0 0 18px;
  font-size: 13px;
  color: #8a94a6;
}

.section-label {
  margin: 0 0 10px;
  font-size: 14px;
  color: var(--navy);
}

.section-label.link {
  margin-top: 20px;
  color: var(--blue);
}

.points {
  margin: 0;
  padding-left: 18px;
  color: #4a5568;
  font-size: 14px;
  line-height: 2;
}

.summary-box {
  width: 100%;
  min-height: 280px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #fafbfc;
  padding: 16px;
  font-size: 14px;
  line-height: 1.9;
  color: #2d3748;
  resize: vertical;
  font-family: inherit;
}

.summary-box:focus {
  outline: none;
  border-color: var(--blue);
  background: #fff;
}

.content-foot {
  margin: 12px 0 0;
  font-size: 13px;
  color: #8a94a6;
}

.content-foot.over {
  color: var(--orange);
}

.warn {
  margin-left: 8px;
}

/* 右侧设置 */
.setting-label {
  margin: 18px 0 8px;
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
}

.text-input:focus {
  outline: none;
  border-color: var(--blue);
}

.options {
  display: flex;
  gap: 8px;
}

.option {
  flex: 1;
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 8px;
  padding: 8px 0;
  font-size: 13px;
  color: #4a5568;
  cursor: pointer;
  font-family: inherit;
}

.option.on {
  background: var(--light);
  border-color: var(--blue);
  color: var(--blue);
  font-weight: 600;
}

.primary-btn {
  width: 100%;
  margin-top: 22px;
  border: 0;
  border-radius: 8px;
  background: var(--blue);
  color: #fff;
  padding: 12px 0;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.primary-btn:hover:not(:disabled) {
  background: var(--blue-dark);
}

.primary-btn:disabled,
.ghost-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ghost-btn {
  width: 100%;
  margin-top: 12px;
  border: 1px solid var(--blue);
  border-radius: 8px;
  background: #fff;
  color: var(--blue);
  padding: 11px 0;
  font-size: 15px;
  cursor: pointer;
  font-family: inherit;
}

.tip {
  margin: 18px 0 0;
  font-size: 12px;
  color: var(--orange);
}

@media (max-width: 980px) {
  .page {
    grid-template-columns: 1fr;
  }
}
</style>
