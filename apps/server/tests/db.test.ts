import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { execFileSync, execSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'
import { createPrismaClient, withTransaction } from '../src/db/client'
import { seedDatabase } from '../prisma/seed'

const isWin = process.platform === 'win32'
const serverRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const prismaBin = join(serverRoot, 'node_modules', '.bin', isWin ? 'prisma.cmd' : 'prisma')

let tmpDir: string
let dbUrl: string
let client: PrismaClient

beforeAll(async () => {
  // 每个测试文件用独立临时库，避免与其他用例互相污染
  tmpDir = mkdtempSync(join(tmpdir(), 'campusmesh-db-'))
  // Prisma 的 SQLite URL 统一用正斜杠，Windows 反斜杠会被当作转义
  dbUrl = `file:${join(tmpDir, 'test.db').replace(/\\/g, '/')}`
  const env = { ...process.env, DATABASE_URL: dbUrl }

  if (isWin) {
    // Windows 下不能直接 execFileSync 一个 .cmd，必须交给解释器
    execSync(`"${prismaBin}" migrate deploy`, { cwd: serverRoot, env, stdio: 'pipe' })
  } else {
    execFileSync(prismaBin, ['migrate', 'deploy'], { cwd: serverRoot, env, stdio: 'pipe' })
  }

  client = new PrismaClient({ datasourceUrl: dbUrl })
  await seedDatabase(client)
}, 30_000)

afterAll(async () => {
  if (client) await client.$disconnect()
  rmSync(tmpDir, { recursive: true, force: true })
})

describe('迁移脚本', () => {
  it('在空库上建出 7 张核心表', async () => {
    const rows = await client.$queryRaw<Array<{ name: string }>>`
      SELECT name FROM sqlite_master
      WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%'
    `
    const names = rows.map((row) => row.name)
    for (const table of [
      'User',
      'WallPost',
      'Comment',
      'Like',
      'Report',
      'Activity',
      'Summary'
    ]) {
      expect(names).toContain(table)
    }
  })

  it('建出检索与去重所需的索引', async () => {
    const rows = await client.$queryRaw<Array<{ name: string }>>`
      SELECT name FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%'
    `
    const names = rows.map((row) => row.name)
    for (const index of [
      'WallPost_status_createdAt_idx',
      'WallPost_status_hotScore_idx',
      'Activity_startTime_idx',
      'Activity_contentHash_idx',
      'Summary_userId_createdAt_idx'
    ]) {
      expect(names).toContain(index)
    }
  })
})

describe('约束', () => {
  it('Activity.sourceUrl 唯一：重复来源被拒绝（第一道去重）', async () => {
    await expect(
      client.activity.create({
        data: {
          title: '重复来源的活动',
          startTime: new Date('2026-11-20T06:30:00Z'),
          sourceUrl: 'https://example.edu/activities/2026-a01',
          contentHash: 'duplicate-test'
        }
      })
    ).rejects.toMatchObject({ code: 'P2002' })
  })

  it('Like 联合主键幂等：同一用户对同一帖子只能有一条记录', async () => {
    const post = await client.wallPost.findFirstOrThrow()
    await client.like.create({ data: { postId: post.id, userId: 'u_seed01' } })
    await expect(
      client.like.create({ data: { postId: post.id, userId: 'u_seed01' } })
    ).rejects.toMatchObject({ code: 'P2002' })
  })

  it('Summary 默认 visibility 为 private（隐私默认值）', async () => {
    const activity = await client.activity.findFirstOrThrow()
    const summary = await client.summary.create({
      data: { userId: 'u_seed01', activityId: activity.id, content: '测试总结' }
    })
    expect(summary.visibility).toBe('private')
  })
})

describe('种子数据', () => {
  it('seed 产出 3 用户 / 5 帖子 / 10 活动', async () => {
    const [users, posts, activities] = await Promise.all([
      client.user.count(),
      client.wallPost.count(),
      client.activity.count()
    ])
    expect(users).toBe(3)
    expect(posts).toBe(5)
    expect(activities).toBe(10)
  })

  it('seed 可重复执行，数量不变（幂等）', async () => {
    await seedDatabase(client)
    const [users, posts, activities] = await Promise.all([
      client.user.count(),
      client.wallPost.count(),
      client.activity.count()
    ])
    expect([users, posts, activities]).toEqual([3, 5, 10])
  })
})

describe('Prisma 客户端封装', () => {
  it('createPrismaClient 可用指定 URL 连接已迁移的库', async () => {
    const custom = createPrismaClient(dbUrl)
    try {
      expect(await custom.user.count()).toBe(3)
    } finally {
      await custom.$disconnect()
    }
  })

  it('withTransaction 成功时提交', async () => {
    const before = await client.wallPost.count()
    await withTransaction(async (tx) => {
      await tx.wallPost.create({
        data: { authorId: 'u_seed01', category: '感想', content: '事务提交用例' }
      })
    }, client)
    expect(await client.wallPost.count()).toBe(before + 1)
  })

  it('withTransaction 抛错时整体回滚', async () => {
    const before = await client.wallPost.count()
    await expect(
      withTransaction(async (tx) => {
        await tx.wallPost.create({
          data: { authorId: 'u_seed01', category: '感想', content: '事务回滚用例' }
        })
        throw new Error('boom')
      }, client)
    ).rejects.toThrow('boom')
    expect(await client.wallPost.count()).toBe(before)
  })
})
