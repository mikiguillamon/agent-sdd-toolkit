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
import { exists } from '../src/fs/fileOps.js';
import { validateSkillsPack } from '../src/skills/pack.js';

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
    assert.equal(await exists(path.join(directory, '.agents')), false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('new with codex cleans repo-local .agents output from Spec Kit', async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), 'agent-sdd-new-codex-')
  );

  try {
    await main(['new', directory, '--agents', 'codex', '--no-run-init']);
    assert.equal(await exists(path.join(directory, '.agents')), false);
    assert.equal(await exists(path.join(directory, 'AGENTS.md')), true);
    assert.equal(await exists(path.join(directory, 'feature_list.json')), true);
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
    const agents = await readFile(path.join(directory, 'AGENTS.md'), 'utf8');
    const content = await readFile(path.join(directory, 'CLAUDE.md'), 'utf8');
    const reviewer = await readFile(
      path.join(directory, '.claude', 'agents', 'reviewer.md'),
      'utf8'
    );
    const prettierignore = await readFile(
      path.join(directory, '.prettierignore'),
      'utf8'
    );
    assert.match(agents, /Source of truth/i);
    assert.equal((agents.match(/# AGENTS\.md/g) || []).length, 1);
    assert.match(content, /AGENTS\.md/);
    assert.doesNotMatch(reviewer, /agent-sdd:adapter-claude:start/);
    assert.match(prettierignore, /\.specify\//);
    assert.equal(await exists(path.join(directory, '.agents')), false);
  } finally {
    process.chdir(originalCwd);
    await rm(directory, { recursive: true, force: true });
  }
});

test('adopt with codex cleans .agents and stays idempotent on repeat', async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), 'agent-sdd-adopt-codex-')
  );
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
    await main(['adopt', '--agents', 'codex,claude', '--no-run-init']);
    const firstAgents = await readFile(
      path.join(directory, 'AGENTS.md'),
      'utf8'
    );
    const firstClaude = await readFile(
      path.join(directory, 'CLAUDE.md'),
      'utf8'
    );

    assert.equal(await exists(path.join(directory, '.agents')), false);

    await main(['adopt', '--agents', 'codex,claude', '--no-run-init']);
    const secondAgents = await readFile(
      path.join(directory, 'AGENTS.md'),
      'utf8'
    );
    const secondClaude = await readFile(
      path.join(directory, 'CLAUDE.md'),
      'utf8'
    );

    assert.equal(await exists(path.join(directory, '.agents')), false);
    assert.equal(firstAgents, secondAgents);
    assert.equal(firstClaude, secondClaude);
  } finally {
    process.chdir(originalCwd);
    await rm(directory, { recursive: true, force: true });
  }
});

test('adopt preserves Spec Kit AGENTS stub and appends a formatted contract', async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), 'agent-sdd-adopt-speckit-')
  );
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
    await writeFile(
      path.join(directory, 'AGENTS.md'),
      [
        '<!-- SPECKIT START -->',
        'For additional context about technologies to be used, project structure,',
        'shell commands, and other important information, read the current plan',
        '<!-- SPECKIT END -->',
        ''
      ].join('\n')
    );
    await main(['adopt', '--agents', 'claude', '--no-run-init']);
    const agents = await readFile(path.join(directory, 'AGENTS.md'), 'utf8');
    assert.match(agents, /<!-- SPECKIT START -->\n\nFor additional context/);
    assert.match(
      agents,
      /<!-- agent-sdd:agents-contract:start -->\n\n# AGENTS\.md/
    );
    assert.match(
      agents,
      /explicit\s+approval\.\n\n<!-- agent-sdd:agents-contract:end -->/
    );
    assert.equal(await exists(path.join(directory, '.agents')), false);
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

test('skills pack validates successfully', async () => {
  const result = await validateSkillsPack();
  assert.equal(result.ok, true);
});

test('skills list and validate commands run', async () => {
  await main(['skills', 'list']);
  await main(['skills', 'validate']);
  assert.ok(true);
});

test('skills install and export support dry-run flows', async () => {
  const home = await mkdtemp(path.join(os.tmpdir(), 'agent-sdd-skills-home-'));
  const directory = await mkdtemp(
    path.join(os.tmpdir(), 'agent-sdd-skills-export-')
  );
  const originalHome = process.env.HOME;
  const originalCwd = process.cwd();

  try {
    process.env.HOME = home;
    process.chdir(directory);
    await main(['skills', 'install', '--agents', 'codex', '--dry-run']);
    await main([
      'skills',
      'export',
      '--agents',
      'claude,generic,cursor',
      '--output',
      'out',
      '--dry-run'
    ]);
    await main(['skills', 'doctor', '--agents', 'codex,claude']);
    assert.ok(true);
  } finally {
    process.env.HOME = originalHome;
    process.chdir(originalCwd);
    await rm(home, { recursive: true, force: true });
    await rm(directory, { recursive: true, force: true });
  }
});

test('skills install writes codex skills into a temporary HOME', async () => {
  const home = await mkdtemp(path.join(os.tmpdir(), 'agent-sdd-skills-home-'));
  const originalHome = process.env.HOME;

  try {
    process.env.HOME = home;
    await main(['skills', 'install', '--agents', 'codex']);
    const installed = await readFile(
      path.join(home, '.agents', 'skills', 'token-discipline', 'SKILL.md'),
      'utf8'
    );
    assert.match(installed, /Token Discipline/);
  } finally {
    process.env.HOME = originalHome;
    await rm(home, { recursive: true, force: true });
  }
});
