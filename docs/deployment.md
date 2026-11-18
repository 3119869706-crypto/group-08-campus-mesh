# 部署与一键启动

## 1. 环境要求

| 方式 | 需要 |
|---|---|
| 本地开发 | Node.js ≥ 20、pnpm 9 |
| Docker | Docker Desktop / Docker Engine + Compose v2 |

## 2. 本地一键启动（推荐）

```bash
corepack enable
corepack prepare pnpm@9.15.9 --activate

pnpm install
cp .env.example .env      # 可选；不填也能用默认端口
pnpm dev
```

启动后：

- 前端：<http://localhost:5173>
- 服务端：<http://localhost:3000>
- 健康检查：<http://localhost:3000/api/v1/health>

首次访问校园墙会自动创建匿名身份并保存在浏览器 `localStorage`，不需要数据库或 LLM Key。

### 常用命令

```bash
pnpm lint        # ESLint
pnpm typecheck   # TypeScript / vue-tsc
pnpm test        # 单元测试
pnpm test:cov    # 覆盖率
pnpm build       # 生产构建
```

## 3. Docker 启动

```bash
docker compose up --build
```

- 前端：<http://localhost:8080>
- 服务端：<http://localhost:3000>
- 健康检查：<http://localhost:3000/api/v1/health>

Compose 会构建两个镜像：

| 服务 | 说明 | 端口 |
|---|---|---|
| `server` | Fastify + 信令服务，带健康检查 | 3000 |
| `web` | Nginx 托管前端静态文件，反向代理 `/api` 与 `/ws` | 8080 |

停止：

```bash
docker compose down
```

只改前端/服务端代码后重新构建：

```bash
docker compose up --build
```

## 4. 环境变量

复制 `.env.example` 为 `.env`，按需修改：

| 变量 | 默认 | 说明 |
|---|---|---|
| `PORT` | `3000` | 服务端端口 |
| `VITE_API_BASE` | `/api/v1` | 前端接口前缀；Docker 下由 Nginx 代理 |
| `LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL` | 空 | AI 功能使用；不填则 AI 不可用 |
| `TURN_URL` / `TURN_USERNAME` / `TURN_PASSWORD` | 空 | P2P 中继；不填则只用 STUN |

> `.env` 已在 `.gitignore` 中，禁止提交密钥。前端只使用 `VITE_` 前缀变量，LLM Key 不得出现在前端。

## 5. 验收清单

- [ ] `curl http://localhost:3000/api/v1/health` 返回 `{"status":"ok",...}`
- [ ] 浏览器打开前端，校园墙显示“服务端状态：正常”
- [ ] 首次访问自动生成匿名身份，刷新后 `anonId` 不变
- [ ] 点击“重置身份”二次确认后生成新 ID
- [ ] 仓库中无 `.env`、无 `sk-` 开头的密钥
- [ ] 新环境按本节步骤 10 分钟内可启动

## 6. 常见问题

| 现象 | 处理 |
|---|---|
| `pnpm: command not found` | 执行 `corepack enable`，或 `npm i -g pnpm@9` |
| 3000 / 8080 端口被占用 | 改 `docker-compose.yml` 的宿主机端口，或设置 `PORT` |
| Docker 构建很慢 | 首次需下载 Node/Nginx 镜像与依赖；可配置国内镜像源 |
| 前端接口 404 | 本地确认 `pnpm dev` 的 Vite 代理；Docker 确认 Nginx 的 `/api/` 配置 |
| WebSocket 连接失败（Docker） | 确认 Nginx `/ws/` 已配置 `Upgrade` 与 `Connection` 头 |
| AI 报“AI 暂不可用” | 未配置 `LLM_API_KEY`，属预期行为，不影响私聊/校园墙 |
