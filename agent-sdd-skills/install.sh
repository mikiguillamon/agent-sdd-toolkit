#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="$HOME/.agents/skills"

mkdir -p "$DEST"

for skill in \
  token-discipline \
  spec-driven-development \
  repo-cartographer \
  minimal-implementer \
  senior-code-reviewer \
  security-pass \
  docs-writer \
  ux-polish-reviewer
do
  if [ ! -f "$ROOT/$skill/SKILL.md" ]; then
    echo "ERROR: missing $ROOT/$skill/SKILL.md"
    exit 1
  fi
  rm -rf "$DEST/$skill"
  cp -R "$ROOT/$skill" "$DEST/$skill"
  echo "Installed $skill -> $DEST/$skill"
done

echo "OK: skills installed in $DEST"
