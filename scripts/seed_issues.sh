#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

count=$(jq length scripts/issues.json)
existing=$(gh issue list --state all --limit 200 --json title --jq '.[].title' || true)
created=0
skipped=0

for i in $(seq 0 $((count - 1))); do
  title=$(jq -r ".[$i].title" scripts/issues.json)
  if printf '%s\n' "$existing" | grep -Fxq "$title"; then
    skipped=$((skipped + 1))
    continue
  fi
  body=$(jq -r ".[$i].body" scripts/issues.json)
  milestone=$(jq -r ".[$i].milestone // empty" scripts/issues.json)
  assignee=$(jq -r ".[$i].assignee // empty" scripts/issues.json)
  args=(--title "$title" --body "$body")
  while IFS= read -r label; do
    [ -n "$label" ] && args+=(--label "$label")
  done < <(jq -r ".[$i].labels[]" scripts/issues.json)
  [ -n "$milestone" ] && args+=(--milestone "$milestone")
  [ -n "$assignee" ] && args+=(--assignee "$assignee")
  gh issue create "${args[@]}"
  created=$((created + 1))
  existing="$existing"$'\n'"$title"
done

echo "created=$created skipped=$skipped" > scripts/seed-result.txt
echo "created=$created skipped=$skipped"
