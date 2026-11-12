# CampusMesh

> 基于 Web 的 P2P 私密通讯与自定义 AI 聊天系统
> 匿名进入 · 私聊不落库 · AI 人设自定义 · 二课活动一键总结

CampusMesh 是一个面向校园场景的轻量 Web 应用。它把四件事放进同一个网页：一对一私密聊天、匿名校园墙、可自定义的 AI 助手、第二课堂活动查询与总结生成。无需安装客户端，打开浏览器即可使用。

## 功能特性

- **P2P 私密通讯**：房间号建连，WebRTC DataChannel 加密直传，服务端只转发信令，不存储、不转发私聊消息。
- **匿名校园墙**：树洞 / 求助 / 闲置 / 活动 / 感想五类动态，支持点赞、评论、热度排序、举报与内容过滤。
- **自定义 AI**：用户可创建多套 AI 人设与技能，在私聊、发帖润色、二课总结中复用。
- **二课工具**：抓取公开活动信息，支持检索，并基于活动详情与个人要点生成可编辑、可导出的总结。
- **匿名与隐私**：不采集手机号、学号；AI 配置与聊天记录仅存浏览器本地。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3 · Vite · TypeScript · Pinia · Vue Router |
| 服务端 | Node.js 20/22 · Fastify（或 Express）· WebSocket |
| 通信 | WebRTC DataChannel · STUN/TURN（coturn） |
| AI | OpenAI 兼容接口 · SSE 流式输出 |
| 数据 | SQLite（开发）/ MySQL 8（部署）· IndexedDB（本地） |
| 工程 | pnpm workspace · ESLint · Prettier · Vitest · GitHub Actions / Gitee Go |

## 快速开始

### 环境要求

- Node.js >= 20
- pnpm >= 9
- （可选）Docker Desktop

### 启动步骤

```bash
git clone https://github.com/3119869706-crypto/group-08-campus-mesh.git
cd campus-mesh
pnpm install
cp .env.example .env        # 填写数据库与 LLM 配置
pnpm dev                    # 同时启动前端与服务端
```

- 前端：http://localhost:5173
- 服务端：http://localhost:3000
- 健康检查：http://localhost:3000/api/v1/health

> 没有 LLM Key 也能启动：私聊、校园墙、二课列表可用，AI 功能会提示“AI 暂不可用”。

### 常用命令

```bash
pnpm lint          # 代码检查
pnpm typecheck     # 类型检查
pnpm test          # 单元测试
pnpm test:cov      # 覆盖率
pnpm build         # 构建
```

## 项目结构

```text
campusmesh/
├── apps/
│   ├── web/                 # Vue 3 前端
│   └── server/              # Node.js 服务端
├── packages/
│   └── shared/              # 前后端共用类型与工具
├── docs/                    # 架构、接口、ADR、会议纪要
├── tests/                   # 单元 / 接口 / E2E
├── .github/                 # Issue / PR 模板与 CI
└── docker/                  # 部署脚本（可选）
```

## 团队与分工

| 成员 | 角色 | 主要职责 |
|---|---|---|
| 汪星同 | Maintainer / 架构 | 仓库治理、信令服务、匿名身份、CI、发布 |
| 黄仁才 | 前端负责人 | 应用框架、设计系统、校园墙 |
| 张米奇 | P2P / AI 负责人 | WebRTC、私聊、AI 网关与技能 |
| 陈永学 | 数据 / 质量负责人 | 数据模型、二课抓取与总结、测试与 CI |

## 开发进度

- [x] 需求分析与 SRS V1.0
- [x] 架构与接口设计
- [ ] v0.1.0 Alpha：匿名身份 + 校园墙 MVP + 1v1 私聊 + AI 对话
- [ ] v0.2.0 Beta：评论互动 + AI 人设/技能 + 二课工具 + 覆盖率 ≥40%
- [ ] v1.0.0 Final：安全与性能加固 + 文档 + 答辩

## 文档

- [软件需求规格说明书](docs/requirements/CampusMesh-SRS.docx)
- [架构设计](docs/architecture.md)
- [接口文档](docs/api.md)
- [贡献指南](CONTRIBUTING.md)
- [变更日志](CHANGELOG.md)
- [团队分工与启动方案](docs/team-plan.md)

## 许可证

[MIT](LICENSE)
