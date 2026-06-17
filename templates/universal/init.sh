#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

if ! command -v python3 >/dev/null 2>&1; then
  echo "ERROR: python3 is required"
  exit 1
fi

for file in AGENTS.md harness.config.json scripts/validate_harness.py; do
  if [ ! -f "$file" ]; then
    echo "ERROR: missing $file"
    exit 1
  fi
done

python3 scripts/validate_harness.py

python3 - <<'PYRUN'
import json
import subprocess
from pathlib import Path

cfg = json.loads(Path('harness.config.json').read_text())
commands = cfg.get('commands', {})
order = ['setup', 'format_check', 'lint', 'typecheck', 'test', 'build', 'smoke']

for group in order:
    items = commands.get(group, [])
    if not items:
        print(f'WARN: no commands configured for {group}')
        continue
    for cmd in items:
        print(f'RUN: {cmd}')
        subprocess.run(cmd, shell=True, check=True)
PYRUN

echo "OK: harness validation passed"
