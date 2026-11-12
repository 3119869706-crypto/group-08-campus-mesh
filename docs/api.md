# 接口文档

Base URL：`/api/v1`　|　鉴权：`Authorization: Bearer <token>`

## 1. 通用约定

- 请求/响应均为 JSON（AI 与总结接口为 SSE 流）。
- 时间使用 ISO 8601 UTC 字符串。
- 错误响应：`{ "code": "RATE_LIMITED", "message": "...", "requestId": "..." }`

### 错误码

| 错误码 | HTTP | 含义 |
|---|---|---|
| INVALID_PARAM | 400 | 参数缺失或格式错误 |
| UNAUTHORIZED | 401 | 令牌缺失/过期 |
| FORBIDDEN | 403 | 无权访问 |
| NOT_FOUND | 404 | 资源不存在 |
| CONFLICT | 409 | 重复操作 |
| RATE_LIMITED | 429 | 触发限流 |
| INTERNAL_ERROR | 500 | 服务端错误 |
| AI_UNAVAILABLE | 503 | AI 不可用/额度不足 |

## 2. REST 接口

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| POST | `/auth/anonymous` | 创建匿名身份并签发令牌 | 否 |
| POST | `/auth/refresh` | 刷新令牌 | 是 |
| GET | `/wall/posts` | 帖子列表（sort/category/keyword/page） | 否 |
| POST | `/wall/posts` | 发布帖子 | 是 |
| GET | `/wall/posts/{id}` | 帖子详情 | 否 |
| DELETE | `/wall/posts/{id}` | 删除自己的帖子（软删除） | 是 |
| POST | `/wall/posts/{id}/like` | 点赞（幂等） | 是 |
| DELETE | `/wall/posts/{id}/like` | 取消点赞 | 是 |
| GET | `/wall/posts/{id}/comments` | 评论列表 | 否 |
| POST | `/wall/posts/{id}/comments` | 发表评论/回复 | 是 |
| POST | `/wall/reports` | 提交举报 | 是 |
| GET | `/activities` | 二课活动列表 | 否 |
| POST | `/activities/sync` | 手动触发抓取（管理员） | 是 |
| POST | `/summaries` | 生成总结（SSE） | 是 |
| GET | `/summaries/{id}` | 总结详情 | 是 |
| PUT | `/summaries/{id}` | 保存编辑 | 是 |
| POST | `/ai/chat` | AI 对话（SSE） | 是 |
| GET | `/health` | 健康检查 | 否 |

### 示例：创建匿名身份

```http
POST /api/v1/auth/anonymous
Content-Type: application/json

{ "nickname": "匿名同学#A3F" }
```

```json
{
  "anonId": "u_7f3a9c",
  "nickname": "匿名同学#A3F",
  "token": "eyJhbGciOi...",
  "expiresIn": 86400
}
```

## 3. WebSocket 信令

连接：`wss://<host>/ws/signal?token=<token>`

消息封装：`{ "type": "...", "roomId": "...", "from": "...", "to": "...", "payload": {}, "ts": 0 }`

| 事件 | 方向 | 说明 |
|---|---|---|
| `room:create` | C→S | 创建房间 |
| `room:created` | S→C | 返回 roomId/passcode/expiresAt |
| `room:join` | C→S | 加入房间 |
| `room:joined` | S→C | 加入成功，返回在线对端 |
| `room:peer-joined` | S→C | 通知对端已加入 |
| `signal:offer` | C↔S↔C | 转发 Offer |
| `signal:answer` | C↔S↔C | 转发 Answer |
| `signal:ice` | C↔S↔C | 转发 ICE 候选 |
| `room:leave` | C→S | 主动离开 |
| `room:closed` | S→C | 房间过期/对端离开 |
| `error` | S→C | 鉴权失败、房间不存在、限流 |

> 信令服务只转发 SDP/ICE，不解析、不存储消息内容。
