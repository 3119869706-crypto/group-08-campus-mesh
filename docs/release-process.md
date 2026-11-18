# 发布流程

## 1. 版本规划

| 版本 | 阶段 | 内容 | 时间 |
|---|---|---|---|
| `v0.1.0` | Alpha | 脚手架、匿名身份、校园墙 MVP、1v1 私聊、AI 对话、CI | 第 8 周 |
| `v0.2.0` | Beta | 评论互动、举报过滤、AI 人设/技能、二课工具、覆盖率 ≥40% | 第 12 周 |
| `v1.0.0` | Final | 安全与性能加固、完整文档、答辩材料 | 第 16 周 |

版本号遵循语义化版本：`MAJOR.MINOR.PATCH`。课程阶段用 `0.x.y`，终版为 `1.0.0`。

## 2. 发布前检查

- [ ] `main` 上最新提交的 CI 全绿
- [ ] 本次要发布的 Issue 全部关闭，对应 PR 已合并
- [ ] `CHANGELOG.md` 已把 `Unreleased` 内容移到新版本下
- [ ] README 的启动步骤在新环境实测可用
- [ ] 无 `.env`、密钥、构建产物入库
- [ ] 至少 1 名非作者完成 Review

## 3. 发布步骤

```bash
# 1. 同步 main
git switch main
git pull origin main

# 2. 确认 CI 与测试
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test:cov
pnpm build

# 3. 打标签（附注标签）
git tag -a v0.1.0 -m "CampusMesh v0.1.0 Alpha"

# 4. 推送标签，触发 Release 工作流
git push origin v0.1.0
```

推送标签后，`.github/workflows/release.yml` 会自动：

1. 安装依赖；
2. 执行 `pnpm build`；
3. 调用 `gh release create --generate-notes` 创建 GitHub Release。

Release Notes 的分类来自 `.github/release.yml`：Features / Bug Fixes / Tests & CI / Documentation / Other。

## 4. 发布后验证

- [ ] GitHub `Releases` 页面出现对应版本
- [ ] Release Notes 包含 Features / Fixes / Known Limitations
- [ ] 标签指向的提交与 `main` 一致
- [ ] 从 Release 页面下载源码可正常启动（按 README）

## 5. 热修复

线上/演示环境发现严重缺陷时：

```bash
git switch main
git pull origin main
git switch -c hotfix/30-token-leak
# 修复并提交
git push -u origin hotfix/30-token-leak
# 开 PR，1 人 Approve + CI 通过后合并
git switch main
git pull origin main
git tag -a v0.1.1 -m "CampusMesh v0.1.1"
git push origin v0.1.1
```

## 6. 发布记录模板

每次发布在 `CHANGELOG.md` 中保留：

```markdown
## [0.1.0] - 2026-11-30

### Added
- 匿名身份与本地持久化
- 校园墙信息流与发帖
- WebSocket 信令与 1v1 私聊

### Fixed
- 修复 pnpm 版本冲突导致的 CI 失败（#19）

### Known Limitations
- 群聊、音视频未实现
- 二课抓取仅覆盖公开页面
```
