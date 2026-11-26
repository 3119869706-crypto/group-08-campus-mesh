#!/usr/bin/env bash
set -uo pipefail

create() {
  local head="$1"
  local title="$2"
  local body="$3"
  local count
  count=$(gh pr list --head "$head" --state open --json number --jq 'length' 2>/dev/null || echo 0)
  if [ "$count" != "0" ]; then
    echo "skip $head (PR already open)"
    return
  fi
  echo "create $head"
  gh pr create --base main --head "$head" --title "$title" --body "$body" || true
}

body2=$(cat <<'EOF'
Closes #2

## 变更说明
- 新增 `apps/web/src/identity.ts`：localStorage 读写、结构校验、ensure/reset
- 校园墙首次访问自动创建身份；刷新后 `anonId` 不变
- 新增“重置身份”，二次确认后清除旧身份并生成新 ID
- 根目录 `test` / `test:cov` 同时跑 server 与 web

## 测试说明
- [x] pnpm lint / typecheck / test / build
- [x] server 4 个 + web 7 个测试通过
- [x] 手动验证：刷新保持、重置后变化
EOF
)

body3=$(cat <<'EOF'
Closes #3

## 变更说明
- `RoomStore`：6 位房间号、4 位口令、24h 过期、5 次错误锁定 1 分钟
- `/ws/signal`：room:create/join/leave、signal:offer/answer/ice、peer-joined/left
- 服务端只转发 `payload`，不解析 SDP/ICE 内容
- 7 个 RoomStore 单测 + 3 个 WebSocket 集成测试

## 测试说明
- [x] pnpm lint / typecheck / test:cov / build
- [x] 14 个测试通过，覆盖率 87.68%
EOF
)

body5=$(cat <<'EOF'
Closes #5

## 变更说明
- 多阶段 Dockerfile：server（Node 22）+ web（Nginx）
- docker-compose：server 3000、web 8080，带健康检查
- Nginx 反代 `/api` 与 `/ws`（含 WebSocket Upgrade）
- 新增 docs/deployment.md，README 补充 Docker 启动

## 测试说明
- [x] compose YAML 校验通过
- [x] 本地 `pnpm dev` 启动与健康检查已验证
- [ ] Docker 实机构建：本机未安装 Docker，建议合并前让有 Docker 的同学跑一次 `docker compose up --build`
EOF
)

body4=$(cat <<'EOF'
Closes #4

## 变更说明
- `.github/workflows/release.yml`：推送 `v*` 标签自动构建并创建 GitHub Release
- `.github/release.yml`：Features / Bug Fixes / Tests & CI / Documentation 分类
- `docs/release-process.md`：版本规划、发布步骤、热修复
- `docs/branch-protection.md`：ruleset 配置与验证方式

## 测试说明
- [x] release.yml / release.yml 语法校验
- [x] 分支保护已在 Settings → Rules 配置（`build-test`）
EOF
)

create "feature/2-anonymous-identity" "feat(identity): persist anonymous identity in localStorage" "$body2"
create "feature/3-signaling" "feat(signaling): add room store and WebSocket relay" "$body3"
create "feature/5-docker" "feat(deploy): add Dockerfile, compose and deployment guide" "$body5"
create "chore/4-ci-release" "chore(ci): add release workflow and protection docs" "$body4"
