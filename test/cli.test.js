import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { main } from '../src/cli.js';
import { detectCommands } from '../src/detect/detectCommands.js';
import { detectStack } from '../src/detect/detectStack.js';
import { parseAgents } from '../src/agents/parseAgents.js';
import { appendManagedBlock } from '../src/fs/mergeTextFile.js';

test('parseAgents supports all', () => {
  assert.deepEqual(parseAgents(['--agents', 'all']), [
    'codex',
    'claude',
    'copilot',
    'cursor',
    'windsurf',
    'generic'
  ]);
});

test('detectStack and commands infer node project metadata', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'agent-sdd-node-'));

  try {
    await writeFile(
      path.join(directory, 'package.json'),
      JSON.stringify(
        {
          name: 'fixture',
          scripts: {
            test: 'node --test',
            lint: 'eslint .',
            build: 'node build.js'
          }
        },
        null,
        2
      )
    );

    const stack = await detectStack(directory);
    const commands = await detectCommands(directory, stack);

    assert.deepEqual(stack.stack, ['node']);
    assert.match(commands.lint[0], /lint/);
    assert.match(commands.test[0], /test/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('appendManagedBlock appends and replaces managed sections', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'agent-sdd-merge-'));
  const file = path.join(directory, 'CLAUDE.md');

  try {
    appendManagedBlock(file, 'adapter-claude', 'alpha');
    appendManagedBlock(file, 'adapter-claude', 'beta');
    const content = await readFile(file, 'utf8');
    assert.match(content, /beta/);
    assert.doesNotMatch(content, /alpha/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('new creates the universal scaffold and adapters', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'agent-sdd-new-'));

  try {
    await main([
      'new',
      directory,
      '--agents',
      'claude,copilot,generic',
      '--no-run-init'
    ]);
    const agents = await readFile(path.join(directory, 'AGENTS.md'), 'utf8');
    const harness = JSON.parse(
      await readFile(path.join(directory, 'harness.config.json'), 'utf8')
    );
    const claude = await readFile(path.join(directory, 'CLAUDE.md'), 'utf8');

    assert.match(agents, /source of truth/i);
    assert.equal(harness.features, undefined);
    assert.match(claude, /@AGENTS.md/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('adopt upgrades an existing git repository', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'agent-sdd-adopt-'));
  const originalCwd = process.cwd();

  try {
    await writeFile(
      path.join(directory, 'package.json'),
      JSON.stringify({
        name: 'fixture',
        version: '1.0.0',
        scripts: { test: 'node --test' }
      })
    );
    process.chdir(directory);
    await main(['new', '.', '--agents', 'generic', '--no-run-init']);
    await main(['adopt', '--agents', 'claude', '--no-run-init']);
    const content = await readFile(path.join(directory, 'CLAUDE.md'), 'utf8');
    assert.match(content, /AGENTS\.md/);
  } finally {
    process.chdir(originalCwd);
    await rm(directory, { recursive: true, force: true });
  }
});

test('repair creates backups for legacy files', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'agent-sdd-repair-'));
  const originalCwd = process.cwd();

  try {
    await mkdir(path.join(directory, '.github'), { recursive: true });
    await writeFile(path.join(directory, 'AGENTS.md'), '# AGENTS');
    await writeFile(
      path.join(directory, '.github', 'copilot-instructions.md'),
      'legacy agent_sdd_toolkit content'
    );
    process.chdir(directory);
    await main(['repair', '--agents', 'copilot', '--no-run-init']);
    const backup = await readFile(
      path.join(directory, '.github', 'copilot-instructions.md.bak'),
      'utf8'
    );
    assert.match(backup, /legacy/);
  } finally {
    process.chdir(originalCwd);
    await rm(directory, { recursive: true, force: true });
  }
});

test('sync supports dry-run planning', async () => {
  const home = await mkdtemp(path.join(os.tmpdir(), 'agent-sdd-home-'));
  const directory = await mkdtemp(path.join(os.tmpdir(), 'agent-sdd-sync-'));
  const originalHome = process.env.HOME;
  const originalCwd = process.cwd();

  try {
    process.env.HOME = home;
    process.chdir(directory);
    await main(['machine', '--agents', 'codex,claude', '--dry-run']);
    await main([
      'sync',
      '--to',
      'devbox',
      '--agents',
      'codex,claude',
      '--dry-run'
    ]);
    assert.ok(true);
  } finally {
    process.env.HOME = originalHome;
    process.chdir(originalCwd);
    await rm(home, { recursive: true, force: true });
    await rm(directory, { recursive: true, force: true });
  }
});
