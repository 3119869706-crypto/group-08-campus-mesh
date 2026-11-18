import { PrismaClient } from '@prisma/client'
import { pathToFileURL } from 'node:url'

/**
 * 开发种子数据：3 个匿名用户、5 篇帖子、10 条活动。
 *
 * 约定：
 * - 全部使用 upsert，可重复执行（CI 与本地都可以反复跑）。
 * - 活动来源统一用 example.edu 示例地址，不复制真实通知正文（合规）。
 */

const USERS = [
  { anonId: 'u_seed01', nickname: '匿名同学#A01', avatarSeed: 'seed-a01' },
  { anonId: 'u_seed02', nickname: '匿名同学#B02', avatarSeed: 'seed-b02' },
  { anonId: 'u_seed03', nickname: '匿名同学#C03', avatarSeed: 'seed-c03' }
]

const POSTS = [
  {
    authorId: 'u_seed01',
    category: '树洞',
    content: '期末周图书馆座位太难抢了，有没有人一起早上七点去占座？',
    likeCount: 6,
    commentCount: 2,
    hotScore: 10
  },
  {
    authorId: 'u_seed02',
    category: '求助',
    content: '求问数据结构实验报告用什么格式交？老师只说“按规范”。',
    likeCount: 3,
    commentCount: 1,
    hotScore: 5
  },
  {
    authorId: 'u_seed03',
    category: '闲置',
    content: '出一辆二手公路车，骑了半年，九成新，价格可小刀，同城自提。',
    likeCount: 8,
    commentCount: 0,
    hotScore: 8
  },
  {
    authorId: 'u_seed01',
    category: '活动',
    content: '本周三晚有程序设计竞赛经验分享，地点在惟义楼，欢迎来听。',
    likeCount: 2,
    commentCount: 0,
    hotScore: 2
  },
  {
    authorId: 'u_seed02',
    category: '感想',
    content: '第一次用二课总结工具写活动心得，比我以前憋一晚上快多了。',
    likeCount: 4,
    commentCount: 1,
    hotScore: 6
  }
]

const ACTIVITIES = Array.from({ length: 10 }, (_, index) => {
  const day = index + 1
  const start = new Date(Date.UTC(2026, 10, day, 6, 30)) // 2026-11-01 起，UTC 06:30 = 北京 14:30
  return {
    title: `示例活动 ${String(day).padStart(2, '0')}：校园讲座与实践活动`,
    organizer: index % 2 === 0 ? '人工智能学院' : '校团委',
    startTime: start,
    endTime: new Date(start.getTime() + 90 * 60 * 1000),
    location: index % 3 === 0 ? '惟义楼 W7203' : '瑶湖校区大学生活动中心',
    credits: (index % 3) + 1,
    category: index % 2 === 0 ? '技能特长' : '志愿服务',
    description: '用于本地开发与联调的示例活动，非真实通知内容。',
    sourceUrl: `https://example.edu/activities/2026-a${String(day).padStart(2, '0')}`,
    contentHash: `seed-hash-${String(day).padStart(2, '0')}`
  }
})

export async function seedDatabase(client: PrismaClient): Promise<void> {
  for (const user of USERS) {
    await client.user.upsert({
      where: { anonId: user.anonId },
      update: {},
      create: user
    })
  }

  // 帖子没有业务唯一键，用固定 content 判重，避免重复执行时越插越多
  for (const post of POSTS) {
    const existing = await client.wallPost.findFirst({
      where: { authorId: post.authorId, content: post.content }
    })
    if (existing) continue
    await client.wallPost.create({ data: post })
  }

  for (const activity of ACTIVITIES) {
    await client.activity.upsert({
      where: { sourceUrl: activity.sourceUrl },
      update: {},
      create: activity
    })
  }
}

async function main(): Promise<void> {
  const client = new PrismaClient()
  try {
    await seedDatabase(client)
    const [users, posts, activities] = await Promise.all([
      client.user.count(),
      client.wallPost.count(),
      client.activity.count()
    ])
    console.log(`[seed] users=${users} posts=${posts} activities=${activities}`)
  } finally {
    await client.$disconnect()
  }
}

// 仅当作为脚本直接执行时跑 main()，被测试 import 时不触发
const entry = process.argv[1] ? pathToFileURL(process.argv[1]).href : ''
if (entry && import.meta.url === entry) {
  main().catch((error) => {
    console.error('[seed] failed', error)
    process.exitCode = 1
  })
}
