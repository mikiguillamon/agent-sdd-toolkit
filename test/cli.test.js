import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { initWorkspace } from '../src/cli.js';

test('initWorkspace creates the SDD template files', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'agent-sdd-toolkit-'));

  try {
    await initWorkspace(directory);
    const spec = await readFile(path.join(directory, 'docs/spec.md'), 'utf8');
    assert.match(spec, /# Specification/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
