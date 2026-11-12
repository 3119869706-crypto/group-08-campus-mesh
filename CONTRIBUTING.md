# 贡献指南

本文档约定 CampusMesh 的分支、提交、PR、评审与合并规则。所有成员（包括汪星同）都必须遵守。

## 1. 基本原则

- `main` 分支受保护，**任何人不得直接推送**。
- 一个 Issue 对应一个分支、一个 PR；PR 合并后自动关闭 Issue。
- 所有变更必须经过至少 1 名非作者 Approve，且 CI 通过。
- 小步提交、小 PR（建议 ≤400 行），避免“巨石提交”。

## 2. 分支规范

| 类型 | 格式 | 示例 |
|---|---|---|
| 新功能 | `feature/<issue 号>-<英文简述>` | `feature/12-chat-ui` |
| 缺陷修复 | `bugfix/<issue 号>-<英文简述>` | `bugfix/21-login-error` |
| 紧急修复 | `hotfix/<issue 号>-<英文简述>` | `hotfix/30-token-leak` |
| 文档/构建 | `chore/<英文简述>` | `chore/update-ci` |

```bash
git switch main
git pull origin main
git switch -c feature/12-chat-ui
```

## 3. 提交规范

采用 Conventional Commits：

```text
<type>(<scope>): <subject>
```

- type：`feat` `fix` `docs` `test` `refactor` `style` `chore` `perf`
- subject 用英文祈使句，首字母小写，结尾不加句号，一行 ≤72 字符。
- 一个 Commit 只做一件事；必要时在正文说明“为什么”。

示例：

```bash
git commit -m "feat(chat): add message list with local persistence"
git commit -m "fix(auth): reject expired anonymous token"
git commit -m "test(signaling): cover room expiry"
git commit -m "docs(api): document summary SSE endpoint"
```

## 4. PR 流程

1. 从最新 `main` 切分支，开发并本地自测（lint / typecheck / test / build）。
2. Push 分支，创建 PR，目标分支 `main`。
3. 按模板填写：关联 Issue、变更说明、测试说明、自查清单；UI 变更附截图。
4. 指定评审人（见轮值表），48 小时内响应评审意见。
5. 有 `Request changes` 时，在同一分支继续提交并 push，PR 会自动更新。
6. 至少 1 名非作者 Approve + CI 全绿 + 无冲突，方可合并。
7. 合并后删除分支，本地切回 `main` 并 pull。

PR 描述必须包含 `Closes #<issue 号>`。

## 5. 评审规范

有效评审 = 指出具体位置 + 说明原因 + 给出建议：

> `[apps/server/src/auth/token.ts:42]` 令牌过期时间写死为 24 小时，与 SRS 中“短期令牌”不一致。建议改为配置项 `TOKEN_TTL`，并补充过期用例。

无效评审：`LGTM`、`可以`、`+1`、只点 Approve 不写评论。

评审轮值：

| 作者 | 第一评审人 | 备份 |
|---|---|---|
| 汪星同 | 张米奇 | 黄仁才 |
| 黄仁才 | 汪星同 | 陈永学 |
| 张米奇 | 陈永学 | 汪星同 |
| 陈永学 | 黄仁才 | 张米奇 |

## 6. Definition of Done

- [ ] 验收标准逐条满足
- [ ] 至少 1 个非作者 Approve，至少 2 条实质性评论
- [ ] CI 全绿
- [ ] 有测试或说明为何不需要
- [ ] 文档/接口同步
- [ ] 分支已删除，Issue 已关闭

## 7. 安全与隐私

- 禁止提交 `.env`、密钥、Token、数据库口令；使用 `.env.example`。
- 私聊消息不得写入服务端数据库或日志。
- 不采集手机号、学号、身份证号。
- 提交前自查：`git grep -iE "sk-|password|secret|token"`。
