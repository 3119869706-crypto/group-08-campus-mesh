import { PrismaClient } from '@prisma/client'
import type { Prisma } from '@prisma/client'

/**
 * Prisma 客户端单例。
 *
 * 为什么不用 `new PrismaClient()` 到处建：tsx watch 热重载会不断创建新连接，
 * SQLite 下很快出现 "database is locked"，开发体验极差。
 */
const globalForPrisma = globalThis as unknown as {
  __campusmeshPrisma?: PrismaClient
}

export function createPrismaClient(databaseUrl?: string): PrismaClient {
  // 给一个开发期默认值，避免“import 一下就报 DATABASE_URL 缺失”
  const url = databaseUrl ?? process.env.DATABASE_URL ?? 'file:./data/campusmesh.sqlite'
  return new PrismaClient({ datasourceUrl: url })
}

export const prisma: PrismaClient = globalForPrisma.__campusmeshPrisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__campusmeshPrisma = prisma
}

/** 事务封装：发帖、评论、总结保存必须走事务，失败回滚（SRS 4.3 数据可靠性） */
export async function withTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  client: PrismaClient = prisma
): Promise<T> {
  return client.$transaction(fn)
}

/** 优雅关闭：进程退出前释放连接，避免迁移/测试时锁库 */
export async function disconnectPrisma(client: PrismaClient = prisma): Promise<void> {
  await client.$disconnect()
}
