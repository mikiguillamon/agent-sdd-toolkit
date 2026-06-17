#!/usr/bin/env python3
import json
import sys
from pathlib import Path

ROOT = Path.cwd()
VALID_STATUS = {'pending', 'spec_ready', 'in_progress', 'done', 'blocked'}


def fail(message: str) -> None:
    print(f'ERROR: {message}')
    sys.exit(1)


for path in ['AGENTS.md', 'harness.config.json', 'init.sh']:
    if not (ROOT / path).exists():
        fail(f'missing required file: {path}')

try:
    cfg = json.loads((ROOT / 'harness.config.json').read_text())
except Exception as exc:
    fail(f'invalid harness.config.json: {exc}')

commands = cfg.get('commands')
if not isinstance(commands, dict):
    fail('harness.config.json must contain commands object')

for key in ['setup', 'format_check', 'lint', 'typecheck', 'test', 'build', 'smoke']:
    value = commands.get(key, [])
    if not isinstance(value, list):
        fail(f'commands.{key} must be a list')
    for item in value:
        if not isinstance(item, str):
            fail(f'commands.{key} entries must be strings')

feature_list = ROOT / 'feature_list.json'
if feature_list.exists():
    try:
        data = json.loads(feature_list.read_text())
    except Exception as exc:
        fail(f'invalid feature_list.json: {exc}')

    features = data.get('features', [])
    if not isinstance(features, list):
        fail('feature_list.json features must be a list')

    in_progress = 0

    for feature in features:
        fid = feature.get('id')
        status = feature.get('status')

        if not fid:
            fail('feature missing id')
        if status not in VALID_STATUS:
            fail(f'feature {fid} has invalid status: {status}')
        if status == 'in_progress':
            in_progress += 1

    if in_progress > 1:
        fail('more than one feature is in_progress')

print('OK: static harness validation passed')
