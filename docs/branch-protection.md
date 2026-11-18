# 分支保护配置

## 1. 规则位置

GitHub 仓库 → **Settings → Rules → Rulesets**（或旧版 **Settings → Branches**）。

- 仓库：<https://github.com/3119869706-crypto/group-08-campus-mesh>
- 目标分支：`main`（默认分支）
- Ruleset 名称：`protect-main`
- Enforcement：**Active**
- Bypass list：**空**（不要把自己加进去）

## 2. 已启用规则

| 规则 | 设置 |
|---|---|
| Require a pull request before merging | ✅ |
| Required approvals | 1 |
| Dismiss stale pull request approvals when new commits are pushed | ✅ |
| Require conversation resolution before merging | ✅ |
| Require status checks to pass | ✅ `build-test` |
| Require branches to be up to date before merging | 建议 ✅ |
| Restrict deletions | ✅ |
| Block force pushes | ✅ |
| Do not allow force pushes / deletions | ✅ |

## 3. 验证方式

```bash
git switch main
git commit --allow-empty -m "test: protected branch"
git push origin main
```

应被拒绝（`protected branch`）。测试后删除本地空提交：

```bash
git reset --hard HEAD~1
```

再验证 PR：

1. 从 `main` 切一个分支，随便改一行；
2. push 并开 PR；
3. 未 Approve 或 CI 未绿时，Merge 按钮应不可用；
4. 另一个人 Approve 且 CI 绿后，才能合并。

## 4. 评审要求

- 每个 PR 至少 **1 名非作者 Approve**；
- 至少 **2 条实质性行内评论**（指出位置 + 原因 + 建议）；
- 作者不能自己 Approve 自己的 PR；
- 合并后删除分支，本地切回 `main` 并 pull。

## 5. 说明

PR #19（脚手架）在分支保护配置完成前已合并，无法补 Approve；从 PR #2/#3/#5 开始必须走完整流程。答辩时如被问到，如实说明“保护规则在第一次合并后补齐，后续 PR 均按规则执行”。
