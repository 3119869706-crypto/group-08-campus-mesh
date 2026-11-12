# CampusMesh 四人团队分工与项目启动方案

> 适用项目：CampusMesh——基于 Web 的 P2P 私密通讯与自定义 AI 聊天系统
> 适用课程：《软件工程与项目管理》小组项目（70% 小组 + 30% 个人）
> 版本：v1.1　|　日期：2026-11-12　|　维护人：汪星同（组长）
> 本组成员：组长 **汪星同**；组员 **黄仁才、张米奇、陈永学**。下文 A / B / C / D 分别对应四人。

---

## 0. 一页结论

**项目定位**：一个不用安装、匿名使用、私聊不落库的校园 Web 应用，包含四个模块——P2P 私密通讯、匿名校园墙、自定义 AI、二课工具。

**四人分工一句话**：

| 角色 | 一句话职责 | 主责模块 |
|---|---|---|
| 汪星同（组长） | 保住“能交付”：架构、信令、身份、CI、发布、统筹 | 平台基座 + 信令服务 |
| 黄仁才 | 保住“好看好用”：前端框架、设计系统、校园墙 | 校园墙 + 全部页面 |
| 张米奇 | 攻克“最难技术”：WebRTC、私聊、AI 网关 | P2P 私聊 + AI 能力 |
| 陈永学 | 保住“数据与质量”：数据模型、二课、测试、CI 用例 | 二课工具 + 测试质量 |

**先做哪三件事**：① 把仓库协作规则配好（分支保护 + 模板 + CI）；② 把 18 个 Issue 录入并分到人；③ 用两周打通“匿名身份 → 发帖 → 1v1 私聊”最小闭环。功能可以少，但**过程必须完整**——课程评分看的是 Issue → 分支 → PR → Review → CI → Release 的闭环。

**三条红线**：不直接推 `main`；不虚构 Issue/PR/评审记录；不让一个人包办（会触发“一人代劳”扣分）。

---

## 1. 项目定位与范围裁剪

### 1.1 一句话价值

> 让校园里的“公开表达”和“私密沟通”在一个网页里完成：公开内容可匿名发，私密消息只在两台浏览器之间走，AI 能力可以由用户自己定义。

### 1.2 四个模块与优先级

| 模块 | 核心能力 | 优先级 | 课程内的定位 |
|---|---|---|---|
| P2P 私密通讯 | 房间号建连、WebRTC DataChannel、端到端加密、断线重连 | **P0** | 技术亮点，答辩重点演示 |
| 匿名校园墙 | 发帖、信息流、点赞、评论、举报、过滤 | **P0** | 功能闭环，最容易做出“可演示”的效果 |
| 自定义 AI | 人设模板、技能/Prompt、私聊内调用、发帖润色 | **P1** | 创新点，但必须建立在 P0 稳定之后 |
| 二课工具 | 活动抓取、检索、总结生成、编辑导出 | **P1** | 实用价值，答辩时的“落地场景” |

### 1.3 本期做 / 不做（写进 SRS 的边界）

**做**：1v1 文本私聊、匿名墙、AI 文本对话、人设/技能配置、二课活动抓取与总结、基础管理端审核。

**不做**：实名注册、群聊、音视频、文件传输、独立 App/小程序、跨校联邦、复杂推荐、自研加密协议。

> 范围裁剪不是“偷懒”，而是为了保证 P0 能 100% 完成。课程评分中 A3（功能完成度 16 分）明确规定“不可运行 = 本项最高 4 分”，**能跑通比功能多重要**。

### 1.4 MVP 的验收画面（第 8 周必须能演示）

1. 打开网页，自动获得匿名身份，刷新后不变。
2. 在校园墙发一条帖子，另一台设备能看到、能点赞、能评论。
3. A 创建房间，B 输入房间号加入，双方互发消息；断网后恢复能重连。
4. 在私聊里让 AI 回答一个问题，流式输出，确认后插入聊天。
5. 仓库的 CI 是绿的，`main` 有保护，最近 3 个 PR 有评审记录。

---

## 2. 四人角色与职责

### 2.1 角色卡

#### 汪星同（组长）—— Maintainer / 架构 / 信令

- **对什么负责**：项目能不能按时交付、仓库是否规范、架构是否自洽、发布是否可用。
- **具体工作**：仓库治理（分支保护、模板、CI、Release）、匿名身份与鉴权、Node.js 信令服务、前后端联调、部署脚本、进度跟踪。
- **代码所有权**：`apps/server/src/signaling/`、`apps/server/src/auth/`、`.github/`、`docker/`、根目录工程配置。
- **考核关注**：A1～A8 全部；个人 B1～B7 全项；组长附加分 0～2（但“一人代劳”会取消并倒扣）。
- **不要做**：不要把所有活都自己写了。组长的价值是让四个人都有活干、有 PR 可审。

#### 黄仁才（组员）—— 前端负责人 / 校园墙

- **对什么负责**：所有页面的观感、交互与响应式；校园墙从发帖到互动的完整闭环。
- **具体工作**：Vue 3 应用框架、路由、设计 token、组件库、校园墙列表/详情/发帖、点赞评论、举报入口、加载/空/错误态。
- **代码所有权**：`apps/web/src/components/`、`apps/web/src/views/wall/`、`apps/web/src/styles/`。
- **考核关注**：B2 代码质量（前端核心模块）、B3 PR 规范、B4 评审、B5 为自己功能补测试。
- **不要做**：不要只改颜色和样式；至少要独立完成“校园墙”这一条业务线的前端 + 接口对接。

#### 张米奇（组员）—— P2P / AI 负责人

- **对什么负责**：项目最难的两块技术——WebRTC 建连与 AI 流式对话——能稳定跑通。
- **具体工作**：信令客户端、Offer/Answer/ICE、DataChannel、聊天 UI 与本地消息存储、断线重连、AI 网关对接、SSE 流式渲染、快捷技能。
- **代码所有权**：`apps/web/src/features/chat/`、`apps/web/src/features/ai/`、`apps/server/src/ai/`。
- **考核关注**：B2 技术含量（核心模块）、B3、B4、B5（测试与 bugfix）。
- **不要做**：不要等所有 UI 完成才联调；第 2 周就要有双端 Demo。

#### 陈永学（组员）—— 数据 / 二课 / 质量负责人

- **对什么负责**：数据模型不返工、二课工具能落地、测试与 CI 真的能挡住问题。
- **具体工作**：数据库 schema 与迁移、活动抓取与解析、总结生成/编辑/导出、AI 人设与技能配置、测试框架与用例、覆盖率报告、CI 维护。
- **代码所有权**：`apps/server/src/activities/`、`apps/server/src/db/`、`apps/web/src/features/persona/`、`tests/`。
- **考核关注**：B2（数据与后端）、B5（测试是强项）、B6 文档、B1 任务闭环。
- **不要做**：不要只做“测试员”；必须自己写业务代码（爬虫、总结、数据层），否则 B2 会被判“贡献边缘化”。

### 2.2 RACI 矩阵

> R = 负责执行，A = 最终拍板，C = 需要咨询，I = 需要知会。

| 工作流 | 汪星同（组长） | 黄仁才 | 张米奇 | 陈永学 |
|---|---|---|---|---|
| 需求与 SRS | **A/R** | C | C | C |
| 架构与技术选型 | **A/R** | C | C | C |
| UI/UX 与设计系统 | I | **A/R** | C | I |
| 匿名身份与鉴权 | **A/R** | I | C | I |
| 信令服务 | **A/R** | I | **R** | I |
| WebRTC / 私聊 | A | C | **R** | I |
| 校园墙 | A | **R** | I | C |
| AI 网关与技能 | A | C | **R** | C |
| AI 人设配置 | I | C | C | **R** |
| 二课抓取与总结 | A | I | C | **R** |
| 测试与 CI | **A** | C | C | **R** |
| 发布与答辩 | **A/R** | C | C | C |

### 2.3 为什么这样分

- **按“业务线”而不是“纯前端/纯后端”分**：4 个人的团队如果按层切，会出现“前端等接口、后端等页面”的互相等待。让每个人端到端负责一条线，接口在组内直接对齐，返工更少。
- **技术风险集中在 C**：WebRTC 和 AI 流式是项目最容易翻车的两块，必须由一个人持续攻坚，不能碎片化。
- **质量不能只压在 D 身上**：D 负责测试框架与门禁，但每个人都要为自己的功能写测试（B5 是个人分）。
- **组长保留平台与发布权**：仓库、CI、部署、Release 必须由一个人统一，避免配置冲突。

---

## 3. 模块与目录所有权

```text
campusmesh/
├── README.md                     # A 维护
├── LICENSE                       # A
├── CONTRIBUTING.md               # A
├── CHANGELOG.md                  # A（每次 Release 更新）
├── .env.example                  # A
├── .github/
│   ├── workflows/ci.yml          # A
│   ├── ISSUE_TEMPLATE/           # A
│   └── pull_request_template.md  # A
├── docs/
│   ├── architecture.md           # A
│   ├── api.md                    # A + C
│   ├── adr/                      # 谁决策谁写
│   ├── meetings/                 # 记录人轮值
│   └── contributions/            # 每人一份
├── apps/
│   ├── web/                      # B 主责，C 参与 chat/ai 页面
│   │   ├── src/components/       # B
│   │   ├── src/views/wall/       # B
│   │   ├── src/features/chat/    # C
│   │   ├── src/features/ai/      # C
│   │   └── src/features/persona/ # D
│   └── server/                   # A 主责
│       ├── src/signaling/        # A
│       ├── src/auth/             # A
│       ├── src/wall/             # B
│       ├── src/ai/               # C
│       ├── src/activities/       # D
│       └── src/db/               # D
├── packages/
│   └── shared/                   # 类型与工具，A 维护
└── tests/
    ├── unit/                     # 各模块作者
    ├── api/                      # D 牵头
    └── e2e/                      # D 牵头
```

**所有权规则**：

1. 自己的目录自己改，跨目录改动必须在 PR 描述里说明原因。
2. 公共文件（`package.json`、`README`、CI）由 A 统一改，其他人提 Issue 或 PR 由 A 审。
3. 接口契约（`packages/shared/types`、`docs/api.md`）变更必须 A + 相关模块负责人共同确认。

---

## 4. 里程碑与迭代节奏

### 4.1 三个 Release

| 版本 | 时间 | 主题 | 必须包含 | 验收 |
|---|---|---|---|---|
| **v0.1.0 Alpha** | 第 8 周 | 跑通最小闭环 | 匿名身份、校园墙 MVP、1v1 私聊、AI 对话、CI 绿 | 5 分钟演示不报错 |
| **v0.2.0 Beta** | 第 12 周 | 功能完整 | 评论互动、举报过滤、AI 人设/技能、二课抓取与总结、覆盖率 ≥40% | P0 100%、P1 ≥70% |
| **v1.0.0 Final** | 第 16 周 | 可交付 | 安全/性能加固、文档齐全、答辩材料 | 组外同学按 README 可启动 |

### 4.2 双周迭代（Sprint）

| 时间 | 动作 | 产出 |
|---|---|---|
| 周一 20:00 | 30 分钟站会：上周完成 / 本周计划 / 阻塞 | 会议纪要（`docs/meetings/`） |
| 周三 20:00 | 联调：前后端对齐接口，解决阻塞 | 联调记录 / 新 Issue |
| 周六 14:00 | 集中 Review + 合并 + 发版（按需） | PR 评审意见、Release |
| 周日 | 个人自查：Issue/PR/Commit/Review 数据 | 个人贡献记录 |

### 4.3 每个 Issue 的 Definition of Done

- [ ] 有明确的 Assignee 和 Milestone
- [ ] 验收标准全部满足（逐条勾选）
- [ ] 至少 1 个非作者 Approve，至少 2 条实质性评审意见
- [ ] CI 全绿（lint + test + build）
- [ ] 有测试（单元或接口），或说明为何不需要
- [ ] 文档/接口说明已同步
- [ ] PR 合并且分支已删除，Issue 自动关闭

---

## 5. 18 个 Issue 的拆解

> 详细字段（验收标准、依赖、标签、工时）见《CampusMesh-迭代计划与Issue清单.xlsx》。人均 4～5 个，单个 3～10 小时，符合课程“2～8 小时/个”的要求（#11 为 10 小时，需在 Issue 中说明或拆成两个子任务）。

| # | 标题 | 负责人 | 里程碑 | 工时 | 依赖 |
|---|---|---|---|---|---|
| 1 | [chore] 初始化前端脚手架与工程规范 | A | v0.1.0 | 8 | — |
| 2 | [feat] 匿名身份与本地密钥 | A | v0.1.0 | 6 | #1 |
| 3 | [feat] 信令服务：房间创建、加入与转发 | A | v0.1.0 | 8 | #1 |
| 4 | [chore] CI/CD、分支保护与发布流程 | A | v0.1.0 | 4 | #1 |
| 5 | [feat] 一键启动与部署文档 | A | v0.1.0 | 3 | #1,#4 |
| 6 | [feat] 应用框架、路由与设计系统 | B | v0.1.0 | 6 | #1 |
| 7 | [feat] 校园墙信息流与发帖 | B | v0.1.0 | 8 | #6 |
| 8 | [feat] 评论、点赞与热度排序 | B | v0.2.0 | 6 | #7 |
| 9 | [feat] 内容过滤、举报与审核入口 | B | v0.2.0 | 5 | #7 |
| 10 | [feat] 全局加载/错误/空态与响应式适配 | B | v0.2.0 | 4 | #6 |
| 11 | [feat] WebRTC 1v1 私聊与 DataChannel | C | v0.1.0 | 10 | #3 |
| 12 | [feat] 私聊会话 UI 与本地消息存储 | C | v0.1.0 | 6 | #11 |
| 13 | [feat] AI 网关与流式对话 | C | v0.1.0 | 8 | #1 |
| 14 | [feat] AI 快捷技能（翻译/润色/总结） | C | v0.2.0 | 5 | #13 |
| 15 | [feat] 自定义 AI 人设与技能配置 | D | v0.2.0 | 6 | #6 |
| 16 | [feat] 二课活动抓取与活动 API | D | v0.2.0 | 8 | #1 |
| 17 | [feat] 二课总结生成、编辑与导出 | D | v0.2.0 | 6 | #13,#16 |
| 18 | [test] 测试体系与核心用例（覆盖率 ≥40%） | D | v0.1.0 | 8 | #4 |

**说明**：

- 这 18 个是“主 Issue”，后续 bugfix 要单独建 `[Bug]` Issue，不能复用已关闭 Issue 刷数量。
- 每人至少要有 4 个**自己作为 Assignee 且已关闭**的 Issue；如果某人少于 4 个，从对应模块再拆 1～2 个。
- #11 工作量 10 小时，建议拆成 #11a（建连与信令联调，6h）和 #11b（消息收发与重连，4h），避免被判定“任务粒度过大”。

---

## 6. 协作规范（照做即可）

### 6.1 分支与提交

```bash
# 每次开始新任务前
git switch main
git pull origin main
git switch -c feature/12-chat-ui

# 开发后，按逻辑拆分提交
git add apps/web/src/features/chat/
git commit -m "feat(chat): add message list and local persistence"
git add tests/unit/chat.spec.ts
git commit -m "test(chat): cover message send and reconnect"
git push -u origin feature/12-chat-ui
```

- 分支命名：`feature/<issue 号>-<英文简述>`、`bugfix/<issue 号>-<简述>`、`chore/<简述>`。
- Commit 类型：`feat` `fix` `docs` `test` `refactor` `style` `chore` `perf`；一行 ≤72 字符；一个提交只做一件事。
- 禁止：`update`、`修改`、`final`、`final2`、空提交、一次性几千行的“巨石提交”。

### 6.2 PR 规范

PR 描述必须包含：

```markdown
## 关联 Issue
Closes #12

## 变更说明
- 新增聊天消息列表与输入框
- 消息写入 IndexedDB，刷新后恢复
- 增加连接状态与重连提示

## 测试说明
- [x] 新增单元测试 6 个用例
- [x] 本地 lint / test / build 通过
- [x] 手动验证：双端收发、断网重连

## 自查清单
- [x] 无硬编码密钥
- [x] 无调试代码
- [x] 文档已同步
```

- 单个 PR 建议 ≤400 行；超过 800 行须拆分或说明理由。
- 每个 PR 至少 1 名非作者 Approve；禁止自评自合。
- 合并后删除分支，本地 `git switch main && git pull`。

### 6.3 Code Review 规范

有效评审 = **指出具体位置 + 说明原因 + 给出建议**。示例：

> `[apps/server/src/signaling/room.ts:63]` 房间过期只在前端判断，服务端仍会接受加入请求。建议在 `joinRoom()` 入口检查 `expiresAt`，过期返回 `ROOM_EXPIRED`，并补一条接口测试。

无效评审：`LGTM`、`可以`、`+1`、只点 Approve 不写评论。

每人每周至少花 30 分钟审别人的 PR；评审在 48 小时内响应。

### 6.4 评审轮值表

| PR 作者 | 第一评审人 | 备份评审人 |
|---|---|---|
| 汪星同 | 张米奇 | 黄仁才 |
| 黄仁才 | 汪星同 | 陈永学 |
| 张米奇 | 陈永学 | 汪星同 |
| 陈永学 | 黄仁才 | 张米奇 |

> 每个 PR 至少 2 条行内评论；一个人对同一个 PR 的多条评论可以累计，但至少要覆盖 3 个不同 PR。

### 6.5 分支保护（必须截图存档）

在 Gitee/GitHub 的 `main` 分支上启用：

- [ ] Require a pull request before merging
- [ ] Required approvals ≥ 1
- [ ] Dismiss stale approvals when new commits are pushed
- [ ] Require status checks to pass（选中 CI）
- [ ] Require conversation resolution before merging
- [ ] Do not allow force pushes
- [ ] Do not allow deletions

### 6.6 CI 最小配置

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test -- --coverage
      - run: pnpm build
```

> Gitee 用户可用 Gitee Go，步骤等价；如果课程要求 GitHub 数据，见 10.1 的镜像方案。

---

## 7. 考核硬指标看板

课程评分对个人有硬下限（见考核方案 5.1）。把这张表贴在群公告，每周日自查。

| 指标 | 下限 | A | B | C | D |
|---|---|---|---|---|---|
| 已关闭 Issue（本人 Assignee） | 4 | ☐ | ☐ | ☐ | ☐ |
| 已合并 PR | 4 | ☐ | ☐ | ☐ | ☐ |
| 有效 Commit（已合并） | 8 | ☐ | ☐ | ☐ | ☐ |
| 对他人 PR 的有效评审 | 6 条 / ≥3 个 PR | ☐ | ☐ | ☐ | ☐ |
| 有效测试用例 或 bugfix PR | 5 个 / 2 个 | ☐ | ☐ | ☐ | ☐ |
| docs 提交 或 实质讨论 | 3 次 / 5 条 | ☐ | ☐ | ☐ | ☐ |
| 会议纪要（团队） | ≥4 次 | ☐ | ☐ | ☐ | ☐ |
| Release（团队） | ≥2 个 | ☐ | ☐ | ☐ | ☐ |

**自查命令**：

```bash
# 本人有效提交数
git log --author="你的邮箱" --oneline --no-merges | wc -l
# 本人增删行数（仅参考）
git log --author="你的邮箱" --pretty=tformat: --numstat | awk '{a+=$1;d+=$2} END{print a,d}'
# 某时间段内的提交
git log --author="你的邮箱" --since="2026-10-08" --oneline
```

**注意**：2 项及以上未达标 → 个人工程贡献 ×0.6；全部未达标 → ×0.3 并约谈。不要等到期末才补，补录会被识别为异常模式。

---

## 8. 从哪开始：第一周 7 步

### Step 0（今天，30 分钟）：定人、定组号、定规则

- [x] 确认 4 人姓名：汪星同（组长）、黄仁才、张米奇、陈永学；学号与账号待补。
- [x] 确认小组编号：第 8 组，报告与 SRS 封面已填。
- [ ] 建群，置顶本方案 + SRS + Issue 清单。
- [ ] 每个人认领角色（A/B/C/D），在群里回复“确认”。

### Step 1（第 1 天）：仓库治理

- [ ] 在 Gitee 仓库 `Settings → Collaborators` 邀请 3 人。
- [ ] `Settings → Branches` 保护 `main`（见 6.5）。
- [ ] 建 Labels：`feature` `bug` `test` `docs` `chore` `frontend` `backend` `ai` `webrtc` `P0` `P1` `P2`。
- [ ] 建 Milestones：`v0.1.0`（第 8 周）、`v0.2.0`（第 12 周）、`v1.0.0`（第 16 周）。
- [ ] 建 Project/看板：`待办 → 进行中 → 待评审 → 已完成`。

### Step 2（第 1～2 天）：录入 18 个 Issue

- [ ] 按《迭代计划与Issue清单.xlsx》逐条创建，标题以 `[feat]` / `[chore]` / `[test]` 开头。
- [ ] 每条都填：背景、任务清单、验收标准、Assignee、Labels、Milestone、预估工时。
- [ ] 依赖关系写进 Issue 描述（`依赖 #3`、`阻塞 #12`）。
- [ ] 每人至少认领 4 个，当场确认，不允许“无主 Issue”。

### Step 3（第 2～3 天）：搭脚手架

```bash
git clone https://github.com/3119869706-crypto/group-08-campus-mesh.git
cd campus-mesh
git switch -c feature/1-init-scaffold
pnpm create vite apps/web --template vue-ts
# 服务端可用 Fastify/Express + tsx，自行初始化
pnpm add -D eslint prettier typescript vitest
```

最低要求：`pnpm dev` 能同时起前端与服务端；`pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build` 四条命令可执行。

### Step 4（第 3～4 天）：CI 变绿

- [ ] 加 `.github/workflows/ci.yml`（或 Gitee Go 等价配置）。
- [ ] 先让 CI 在空项目上跑通，再把它设为 `main` 的 Required Check。
- [ ] 故意提一个会失败的 PR，确认 CI 能挡住合并，然后关掉。

### Step 5（第 3～5 天）：三个技术 Spike（各限时 2 小时）

| Spike | 负责人 | 产出 | 失败时的退路 |
|---|---|---|---|
| WebRTC 双端 DataChannel | C | 两台设备互发“hello” | 先用公共 STUN；再不行自建 coturn |
| LLM 流式接口 | C | 命令行/网页收到流式 token | 换兼容接口；仍不行则先做非流式 |
| 二课页面抓取 | D | 解析出 10 条活动 | 改为半自动导入 JSON，爬虫降为 P2 |

> Spike 的结论写进 `docs/adr/ADR-00x-*.md`，失败也是有效产出（说明选型依据）。

### Step 6（第 5～6 天）：冻结接口与数据模型

- [ ] `docs/api.md`：按 SRS 3.7 的 18 个接口，确认字段与错误码。
- [ ] `packages/shared/types.ts`：前后端共用的 TypeScript 类型。
- [ ] `docs/architecture.md`：五层架构 + 数据流 + 关键决策（可直接用 SRS 第 2 章）。
- [ ] 数据库 schema 第一版 + 迁移脚本。

### Step 7（第 7 天）：开第一次正式会议 + 交报告

- [ ] 会议议程：分工确认 / 里程碑确认 / 本周阻塞 / 风险。
- [ ] 产出会议纪要（模板见 starter 包 `docs/meetings/TEMPLATE.md`）。
- [ ] 把 SRS、报告、Issue 清单打包提交；报告中的姓名、组号、周期按实际替换。
- [ ] 拍照/截图：仓库首页、分支保护、Issue 面板、CI 绿、会议现场（附件用）。

---

## 9. 前两周任务分配（可直接照做）

### 第 1 周

| 人 | 任务 | 交付 |
|---|---|---|
| A | 仓库治理 + CI + 脚手架 + 匿名身份接口 | CI 绿；`POST /auth/anonymous` 可用 |
| B | 设计 token + 路由 + 校园墙静态页 | 4 个路由可跳转；信息流静态稿 |
| C | 信令服务骨架 + WebRTC Spike | 双端 DataChannel Demo |
| D | 数据库 schema + 测试框架 + 爬虫 Spike | 迁移脚本；vitest 可跑；10 条活动样本 |

### 第 2 周

| 人 | 任务 | 交付 |
|---|---|---|
| A | 身份鉴权中间件 + 部署脚本 | 受保护接口 401/200 正确 |
| B | 校园墙列表/发帖接真实 API | 发帖 → 列表可见 |
| C | 聊天 UI + 信令联调 | 双端互发文本 |
| D | 活动 API + 接口测试 | `GET /activities` 可用；5 个接口用例 |

> 第 2 周末做一次“最小闭环演示”：匿名进入 → 发帖 → 另一台设备看到 → 创建房间 → 互发消息。跑通后再加 AI。

---

## 10. 风险与对策

### 10.1 Gitee 与课程要求不一致（最高优先级）

课程考核方案明确写“所有评分数据取自课程 GitHub 组织的仓库”。你们现在用的是 Gitee，存在**过程数据不被认可**的风险。

**动作**：

1. 本周内问清老师：Gitee 是否可接受？是否必须迁到课程 GitHub Organization？
2. 如果必须 GitHub：把 Gitee 作为镜像，主仓库迁到 GitHub，保留完整提交历史：

```bash
git remote add github git@github.com:<课程组织>/<组号>-campus-mesh.git
git push github main --tags
git push github --all
```

3. 迁移后，Issue/PR/评审要在 GitHub 重新建（Gitee 的不会自动过去），所以要**尽早迁**，不要等做完再迁。

### 10.2 功能太大，做不完

- 严格按 P0/P1/P2 排期；P0 未完成不碰 P1。
- 每两周检查一次“P0 完成度”，低于 70% 立即砍 P2。
- 二课爬虫是最大不确定项：先做“手动导入 JSON”的降级方案，爬虫作为增强。

### 10.3 WebRTC 连不上

- 第 1 周就做 Spike，不要拖到联调。
- 准备公共 STUN + 自建 coturn 两套方案；实在不行，降级为“服务端 WebSocket 中继”，但在文档与答辩中如实说明——**不要假装是 P2P**。
- 演示环境优先用同一局域网，减少 NAT 变量。

### 10.4 AI 费用与密钥

- 密钥只放服务端 `.env`，`.gitignore` 排除，提交前用 `git grep -i "sk-"` 自查。
- 每人每日调用限额 + 全局限额；失败时降级，不影响核心功能。
- 不在前端暴露模型名与额度信息。

### 10.5 匿名内容失控

- 敏感词过滤 + 发帖频率限制 + 举报 + 管理员隐藏。
- 明确社区公约；保留审计日志，但不采集实名信息。

### 10.6 “一人代劳”判定

- 每个 PR 必须有非作者 Approve；组长只做自己模块的 PR。
- 每周检查一次 Contributors 分布，发现某人连续两周无提交，立即在站会中调整任务。
- 会议纪要记录“谁认领了什么”，避免期末扯皮。

### 10.7 AI 生成代码的合规

- AI 生成的代码必须理解、测试、改造后再提交；答辩会随机抽问。
- 大量使用 AI 的模块，在 PR 描述中注明。
- 不要把 AI 生成的整段代码原样提交，尤其是安全相关逻辑。

---

## 11. 模板与文档索引

| 文档 | 位置 | 用途 |
|---|---|---|
| SRS | `CampusMesh-软件需求规格说明书.docx` | 需求基线，随变更更新 |
| 进展报告 | `《软件工程与项目管理》第8组第1次项目进展报告.docx` | 本次提交 |
| Issue 清单 | `CampusMesh-迭代计划与Issue清单.xlsx` | 录入仓库的底稿 |
| 会议纪要模板 | `starter/docs/meetings/TEMPLATE.md` | 每次会议复制一份 |
| 贡献说明书模板 | `starter/docs/contributions/TEMPLATE.md` | 期末每人一份 |
| Issue 模板 | `starter/.github/ISSUE_TEMPLATE/` | 功能 / 缺陷 |
| PR 模板 | `starter/.github/pull_request_template.md` | 每个 PR |
| ADR 模板 | `starter/docs/adr/TEMPLATE.md` | 关键技术决策 |
| 架构文档 | `starter/docs/architecture.md` | 可直接改用 |

---

## 12. 最后三条建议

1. **先让流程跑起来，再让功能多起来。** 第 1 周就把 Issue、分支、PR、Review、CI 走一遍，哪怕只改一个 README。流程顺了，后面加功能才不痛。
2. **每周日花 10 分钟自查考核数据。** 不要等期末才发现某人的 PR 数不够、评审没留痕。
3. **答辩讲“为什么”，不只讲“做了什么”。** 为什么选 WebRTC、为什么私聊不落库、为什么 AI 放服务端、为什么砍掉群聊——这些设计决策比功能列表更加分。
