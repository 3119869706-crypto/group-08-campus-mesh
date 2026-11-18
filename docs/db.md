# 数据库设计（SQLite 开发期 / MySQL 部署期）

> 关联 Issue：#19
> 字段口径来源：SRS 表 22~26
> 模型文件：`apps/server/prisma/schema.prisma`

## 1. 边界：哪些实体入库

SRS 3.6.2 列了 10 个实体，但按 ADR-002（公私数据分离），只有公开数据入库：

| 实体 | 存储位置 | 是否在 schema |
|---|---|---|
| User | 服务端 | 是 |
| WallPost | 服务端 | 是 |
| Comment | 服务端 | 是 |
| Like | 服务端 | 是 |
| Report | 服务端 | 是 |
| Activity | 服务端 | 是 |
| Summary | 服务端（默认 private） | 是 |
| AiPersona / AiSkill | 浏览器 IndexedDB | **否** |
| ChatMessage | 浏览器 IndexedDB | **否** |

因此 schema 里只有 **7 张表**。私聊记录没有对应表，是设计约束而非遗漏——答辩时可直接用这一点佐证“服务端没有消息明文”。

## 2. 常用命令

```bash
cp .env.example .env                     # 首次：DATABASE_URL=file:./data/campusmesh.sqlite

pnpm --filter @campusmesh/server db:migrate       # 部署：应用 migrations
pnpm --filter @campusmesh/server db:migrate:dev   # 开发：改 schema 后生成新迁移
pnpm --filter @campusmesh/server db:seed          # 灌入种子数据（可重复执行）
pnpm --filter @campusmesh/server db:studio        # 可视化查看
```

> `DATABASE_URL` 的相对路径由 Prisma 按 **schema 文件所在目录** 解析，`file:./data/...` 实际落在 `apps/server/prisma/data/`。如需落在 `apps/server/data/`，写 `file:../data/campusmesh.sqlite`。

## 3. 表与字段映射

### User（SRS 表 22）

| SRS 字段 | schema 字段 | SQLite | MySQL |
|---|---|---|---|
| anon_id VARCHAR(16) 主键 | `anonId` | TEXT | VARCHAR(16) |
| nickname VARCHAR(32) | `nickname` | TEXT | VARCHAR(32) |
| avatar_seed VARCHAR(32) | `avatarSeed` | TEXT | VARCHAR(32) |
| token_version INT 默认 1 | `tokenVersion` | INTEGER | INT |
| created_at | `createdAt` | DATETIME | DATETIME |
| last_seen_at | `lastSeenAt` | DATETIME | DATETIME |

### WallPost（SRS 表 23）

| SRS 字段 | schema 字段 | 说明 |
|---|---|---|
| post_id BIGINT 主键 | `id` Int 自增 | 见第 4 节“主键”说明 |
| author_id | `authorId` | 外键 → User.anonId |
| category ENUM | `category` String | 应用层 zod 五选一 |
| content TEXT ≤2000 | `content` | 长度在接口层校验 |
| images JSON ≤3 | `images` String `"[]"` | JSON 文本，序列化工具见 4.1 |
| like_count / comment_count | 同名 Int | 默认 0 |
| hot_score DOUBLE | `hotScore` Float | 每小时重算 |
| status ENUM | `status` String `"normal"` | normal/hidden/deleted 软删除 |
| created_at | `createdAt` | — |

### Activity（SRS 表 24）

| SRS 字段 | schema 字段 | 说明 |
|---|---|---|
| activity_id BIGINT | `id` Int | — |
| title VARCHAR(128) | `title` | — |
| organizer | `organizer` | 可空，取 RSS 第一个分类 |
| start_time / end_time | `startTime` / `endTime` | 建索引 |
| location | `location` | — |
| credits DECIMAL(4,1) | `credits` Float | 展示层 `toFixed(1)` |
| category | `category` | 与 startTime 联合索引 |
| description | `description` | — |
| source_url VARCHAR(512) 唯一 | `sourceUrl` `@unique` | **第一道去重** |
| content_hash CHAR(64) | `contentHash` | **第二道去重**，建索引 |
| fetched_at | `fetchedAt` 默认 now | 失败时用于标 stale |

### Summary（SRS 表 25）

`userId`、`activityId` 均为外键；`personaSnapshot` 存 JSON 文本；`visibility` 默认 `private`；`updatedAt` 由 Prisma 自动维护。

### Comment / Like / Report（SRS 表 26）

- `Comment.parentId` 仅两级，**不加自关联**，避免 SQLite 递归查询复杂度。
- `Like` 用 `@@id([postId, userId])` 联合主键，插入重复点赞直接 `P2002`，天然幂等。
- `Report` 的“24 小时仅计一次”由应用层按 `@@index([targetType, targetId, createdAt])` 查询判定，不建唯一约束（否则会误伤跨天的合法举报）。

## 4. SQLite 与 MySQL 的 5 个差异点

| # | 差异 | 开发期（SQLite） | 部署期（MySQL） | 隔离方式 |
|---|---|---|---|---|
| 1 | 枚举 | 不支持 `enum`，用 `String` | `ENUM(...)` | 取值常量化在 `zod` 里，业务代码不依赖数据库枚举 |
| 2 | 主键 | `Int @default(autoincrement())` | `BIGINT` | 上线前一个迁移改列类型；DTO 层统一 `Number()` |
| 3 | JSON | `images`、`personaSnapshot` 存 `String` | `JSON` | 出入参走 `serializeJson/parseJson` |
| 4 | 小数 | `Float`（无精确 DECIMAL） | `DECIMAL(4,1)` | credits 出参统一格式化到 1 位 |
| 5 | 时间 | `DateTime` | `DATETIME` | 出参统一 ISO 8601 UTC 字符串 |

> 不要写方言 SQL、不要用 `$queryRaw` 拼字符串。迁移命令 `prisma migrate deploy` 在两种数据库上语义一致。

## 5. 索引与理由

| 索引 | 服务的查询 |
|---|---|
| `WallPost_status_createdAt_idx` | 信息流按最新排序分页 |
| `WallPost_status_hotScore_idx` | 按热度排序 |
| `Activity_sourceUrl_key`（唯一） | 抓取 upsert 走主键路径，天然去重 |
| `Activity_contentHash_idx` | 第二道去重查询 |
| `Activity_startTime_idx` / `Activity_category_startTime_idx` | 活动检索按时间与分类筛选 |
| `Comment_postId_createdAt_idx` | 帖子评论列表 |
| `Summary_userId_createdAt_idx` | “我的总结”列表 |
| `Report_targetType_targetId_createdAt_idx` | 举报去重与审核列表 |

## 6. 迁移规范

1. 迁移文件一旦合并**不再修改**，改表就新增迁移。
2. 迁移目录命名保持 Prisma 生成的 `YYYYMMDDHHMMSS_名称`。
3. 破坏性变更（删列/改类型）必须在 PR 描述写明数据迁移方案。
4. CI 与测试使用独立临时库（`file:${tmpdir}/test.db`），不碰开发库。

## 7. 种子数据

`prisma/seed.ts` 生成 3 个匿名用户（`u_seed01`~`u_seed03`）、5 篇覆盖五类分类的帖子、10 条示例活动（`sourceUrl` 为 `example.edu` 占位域名）。

全部使用 `upsert` / 固定内容判重，**可重复执行**，供 B、C 做页面联调，也用于 `db.test.ts` 的幂等断言。
