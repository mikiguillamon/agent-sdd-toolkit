import path from 'node:path';
import { chmod, readFile } from 'node:fs/promises';
import { parseAgents, hasAgent } from './agents/parseAgents.js';
import { SPEC_KIT_INTEGRATION } from './agents/integrationMatrix.js';
import { detectCI } from './detect/detectCI.js';
import { detectCommands } from './detect/detectCommands.js';
import { detectExistingAgentFiles } from './detect/detectExistingAgentFiles.js';
import { detectGit } from './detect/detectGit.js';
import { detectStack } from './detect/detectStack.js';
import { appendManagedBlock } from './fs/mergeTextFile.js';
import { exists, readJson, writeText, copyWithBackup } from './fs/fileOps.js';
import { renderTemplate } from './fs/renderTemplate.js';
import { templatePath, homePath } from './utils/paths.js';
import { commandExists, run } from './utils/exec.js';

const REPO_TEMPLATE_MAP = {
  generic: [['generic/README_AGENT.md', 'README_AGENT.md']],
  claude: [
    ['claude/CLAUDE.md', 'CLAUDE.md'],
    ['claude/commands/sdd-bootstrap.md', '.claude/commands/sdd-bootstrap.md'],
    ['claude/commands/sdd-feature.md', '.claude/commands/sdd-feature.md'],
    ['claude/commands/sdd-review.md', '.claude/commands/sdd-review.md'],
    ['claude/agents/spec-author.md', '.claude/agents/spec-author.md'],
    ['claude/agents/reviewer.md', '.claude/agents/reviewer.md'],
    ['claude/rules/sdd.md', '.claude/rules/sdd.md'],
    ['claude/rules/security.md', '.claude/rules/security.md']
  ],
  copilot: [
    ['copilot/copilot-instructions.md', '.github/copilot-instructions.md']
  ],
  cursor: [['cursor/rules/agent-sdd.mdc', '.cursor/rules/agent-sdd.mdc']],
  windsurf: [['windsurf/windsurfrules', '.windsurfrules']]
};

const GLOBAL_TEMPLATE_MAP = {
  codex: [
    [
      'codex/skills/sdd-project-bootstrap/SKILL.md',
      homePath('.agents', 'skills', 'sdd-project-bootstrap', 'SKILL.md')
    ],
    [
      'codex/agents/project_explorer.toml',
      homePath('.codex', 'agents', 'project_explorer.toml')
    ],
    [
      'codex/agents/spec_author.toml',
      homePath('.codex', 'agents', 'spec_author.toml')
    ],
    [
      'codex/agents/implementer.toml',
      homePath('.codex', 'agents', 'implementer.toml')
    ],
    [
      'codex/agents/reviewer.toml',
      homePath('.codex', 'agents', 'reviewer.toml')
    ],
    ['codex/config.toml', homePath('.codex', 'config.toml')]
  ],
  claude: [
    ['claude/CLAUDE.md', homePath('.claude', 'CLAUDE.md')],
    ['claude/rules/sdd.md', homePath('.claude', 'rules', 'agent-sdd.md')]
  ]
};

export async function collectProjectContext(rootDirectory) {
  const stackInfo = await detectStack(rootDirectory);
  return {
    rootDirectory,
    git: detectGit(rootDirectory),
    stackInfo,
    commands: await detectCommands(rootDirectory, stackInfo),
    ci: await detectCI(rootDirectory),
    agentFiles: await detectExistingAgentFiles(rootDirectory)
  };
}

export async function ensureUniversalFiles(
  rootDirectory,
  context,
  mode,
  options = {}
) {
  const agentsPath = path.join(rootDirectory, 'AGENTS.md');
  const variables = {
    project: path.basename(rootDirectory) || 'Unknown',
    description: 'Unknown',
    detected_stack: formatJsonForTemplate(context.stackInfo.stack, 4),
    detected_package_managers: formatJsonForTemplate(
      context.stackInfo.packageManagers,
      4
    ),
    detected_source_dirs: formatJsonForTemplate(
      await inferSourceDirs(rootDirectory),
      4
    ),
    detected_test_dirs: formatJsonForTemplate(
      await inferTestDirs(rootDirectory),
      4
    ),
    detected_ci: formatJsonForTemplate(context.ci, 4),
    commands_json: formatJsonForTemplate(context.commands, 2),
    features_json: JSON.stringify(
      {
        features: [baselineFeature(mode)]
      },
      null,
      2
    )
  };

  await ensureAgentsFile(agentsPath, variables, options);
  await writeTemplateToDestination(
    'universal/harness.config.json',
    path.join(rootDirectory, 'harness.config.json'),
    variables,
    options
  );
  await writeTemplateToDestination(
    'universal/init.sh',
    path.join(rootDirectory, 'init.sh'),
    variables,
    { ...options, mode: 0o755 }
  );
  await writeTemplateToDestination(
    'universal/scripts/validate_harness.py',
    path.join(rootDirectory, 'scripts', 'validate_harness.py'),
    variables,
    { ...options, mode: 0o755 }
  );
  await writeTemplateToDestination(
    'universal/feature_list.json',
    path.join(rootDirectory, 'feature_list.json'),
    variables,
    options
  );
  await ensurePrettierIgnore(rootDirectory, options);
}

export async function ensureRepoAdapters(rootDirectory, agents, options = {}) {
  for (const agent of agents) {
    const files = REPO_TEMPLATE_MAP[agent] || [];
    for (const [templateName, destination] of files) {
      const filePath = path.join(rootDirectory, destination);
      const shouldMerge =
        options.merge &&
        options.mergeExistingFiles &&
        options.mergeExistingFiles.has(filePath);

      if (shouldMerge) {
        const template = await readTemplate(templateName);
        appendManagedBlock(filePath, `adapter-${agent}`, template, options);
        continue;
      }
      await writeTemplateToDestination(
        templateName,
        filePath,
        {},
        {
          ...options,
          force: options.force || (await exists(filePath))
        }
      );
    }
  }
}

export async function ensureGlobalAdapters(agents, options = {}) {
  for (const agent of agents) {
    const files = GLOBAL_TEMPLATE_MAP[agent] || [];
    for (const [templateName, destination] of files) {
      if (!options.force && (await exists(destination))) {
        continue;
      }
      await writeTemplateToDestination(templateName, destination, {}, options);
    }
  }
}

export async function runSpecKit(rootDirectory, agents, mode, options = {}) {
  if (!commandExists('specify')) {
    return {
      attempted: false,
      warnings: ['specify not found; skipped Spec Kit initialization']
    };
  }

  const warnings = [];

  for (const agent of agents) {
    const command =
      mode === 'new'
        ? SPEC_KIT_INTEGRATION[agent]?.commandNew
        : SPEC_KIT_INTEGRATION[agent]?.commandAdopt;

    if (!command) {
      continue;
    }

    const result = run(command, {
      cwd: rootDirectory,
      dryRun: options.dryRun,
      allowFailure: true,
      silent: true
    });

    if (result.status !== 0) {
      warnings.push(
        `Spec Kit integration for ${agent} failed; continuing with generic fallback`
      );
    }
  }

  return { attempted: true, warnings };
}

export async function runInitScript(rootDirectory, options = {}) {
  if (options.noRunInit) {
    return { ran: false, ok: true };
  }

  const result = run('./init.sh', {
    cwd: rootDirectory,
    dryRun: options.dryRun,
    allowFailure: true
  });

  return {
    ran: !options.dryRun,
    ok: result.status === 0,
    status: result.status
  };
}

export async function ensureBranchForAdopt(rootDirectory, options = {}) {
  const git = detectGit(rootDirectory);
  if (!git.isRepo) {
    throw new Error('adopt requires an existing Git repository');
  }

  if (!['main', 'master'].includes(git.branch)) {
    return { created: false, branch: git.branch };
  }

  const target = 'chore/adopt-agent-sdd';
  if (options.dryRun) {
    return { created: true, branch: target };
  }

  const result = run(`git checkout -b ${target}`, {
    cwd: rootDirectory,
    allowFailure: true,
    silent: true
  });

  return {
    created: result.status === 0,
    branch: result.status === 0 ? target : git.branch
  };
}

export async function repairRepository(rootDirectory, agents, options = {}) {
  const changes = [];
  const targets = [
    path.join(rootDirectory, 'CLAUDE.md'),
    path.join(rootDirectory, '.github', 'copilot-instructions.md'),
    path.join(rootDirectory, '.cursor', 'rules', 'agent-sdd.mdc'),
    path.join(rootDirectory, '.windsurfrules'),
    path.join(rootDirectory, 'AGENTS.md')
  ];

  for (const target of targets) {
    if (!(await exists(target))) {
      continue;
    }
    const content = await readFile(target, 'utf8');
    if (
      content.includes('agent_sdd_toolkit') ||
      content.includes('agent-sdd-toolkit') ||
      content.length > 2000
    ) {
      await copyWithBackup(target, `${target}.bak`, options);
      changes.push(
        `backup created for ${path.relative(rootDirectory, target)}`
      );
    }
  }

  await ensureRepoAdapters(rootDirectory, agents, { ...options, merge: true });
  return changes;
}

export async function diagnoseMachine(agents) {
  const checks = [
    ['git', commandExists('git')],
    ['node', commandExists('node')],
    ['npm', commandExists('npm')],
    ['python3', commandExists('python3')],
    ['uv', commandExists('uv')],
    ['specify', commandExists('specify')]
  ];

  for (const agent of agents) {
    if (agent === 'codex') {
      checks.push([
        'codex global adapters',
        (await exists(
          homePath('.agents', 'skills', 'sdd-project-bootstrap', 'SKILL.md')
        )) &&
          (await exists(homePath('.codex', 'agents', 'project_explorer.toml')))
      ]);
    }

    if (agent === 'claude') {
      checks.push([
        'claude global adapters',
        await exists(homePath('.claude', 'CLAUDE.md'))
      ]);
    }
  }

  return checks;
}

export async function diagnoseRepository(rootDirectory, agents, options = {}) {
  const checks = [];
  const required = [
    'AGENTS.md',
    'harness.config.json',
    'init.sh',
    path.join('scripts', 'validate_harness.py')
  ];

  for (const file of required) {
    checks.push([file, await exists(path.join(rootDirectory, file))]);
  }

  const featureList = await readJson(
    path.join(rootDirectory, 'feature_list.json'),
    null
  );
  checks.push(['feature_list.json', featureList !== null]);

  if (
    hasAgent(agents, 'claude') &&
    (await exists(path.join(rootDirectory, 'CLAUDE.md')))
  ) {
    const content = await readFile(
      path.join(rootDirectory, 'CLAUDE.md'),
      'utf8'
    );
    checks.push([
      'CLAUDE.md imports AGENTS.md',
      content.includes('@AGENTS.md')
    ]);
  }

  if (
    hasAgent(agents, 'copilot') &&
    (await exists(
      path.join(rootDirectory, '.github', 'copilot-instructions.md')
    ))
  ) {
    const content = await readFile(
      path.join(rootDirectory, '.github', 'copilot-instructions.md'),
      'utf8'
    );
    checks.push(['Copilot points to AGENTS.md', content.includes('AGENTS.md')]);
  }

  if (
    hasAgent(agents, 'cursor') &&
    (await exists(
      path.join(rootDirectory, '.cursor', 'rules', 'agent-sdd.mdc')
    ))
  ) {
    const content = await readFile(
      path.join(rootDirectory, '.cursor', 'rules', 'agent-sdd.mdc'),
      'utf8'
    );
    checks.push(['Cursor points to AGENTS.md', content.includes('AGENTS.md')]);
  }

  if (
    hasAgent(agents, 'windsurf') &&
    (await exists(path.join(rootDirectory, '.windsurfrules')))
  ) {
    const content = await readFile(
      path.join(rootDirectory, '.windsurfrules'),
      'utf8'
    );
    checks.push([
      'Windsurf points to AGENTS.md',
      content.includes('AGENTS.md')
    ]);
  }

  if (
    !options.noRunInit &&
    (await exists(path.join(rootDirectory, 'init.sh')))
  ) {
    const result = run('./init.sh', {
      cwd: rootDirectory,
      dryRun: options.dryRun,
      allowFailure: true
    });
    checks.push(['./init.sh', result.status === 0]);
  }

  return checks;
}

export async function initializeGitRepo(rootDirectory, options = {}) {
  const git = detectGit(rootDirectory);
  if (!git.isRepo) {
    run('git init -b main', { cwd: rootDirectory, dryRun: options.dryRun });
    return;
  }

  if (!git.branch) {
    run('git checkout -B main', { cwd: rootDirectory, dryRun: options.dryRun });
  }
}

export async function writeProgressBlocker(
  rootDirectory,
  message,
  options = {}
) {
  const progressPath = path.join(rootDirectory, 'progress', 'current.md');
  const content = `# Current progress\n\n- Blocker: ${message}\n`;
  await writeText(progressPath, content, options);
}

export async function syncGlobalAssets(host, agents, options = {}) {
  const sources = [];
  for (const agent of agents) {
    const mappings = GLOBAL_TEMPLATE_MAP[agent] || [];
    for (const [, destination] of mappings) {
      if (await exists(destination)) {
        sources.push(destination);
      }
    }
  }

  const requirements = ['ssh', 'rsync'];
  const missing = requirements.filter((command) => !commandExists(command));
  if (missing.length > 0) {
    throw new Error(`sync requires: ${missing.join(', ')}`);
  }

  const commands = sources.map((source) => {
    const basename = path.basename(source);
    return `rsync -av ${shellEscape(source)} ${shellEscape(`${host}:~/agent-sdd-sync/${basename}`)}`;
  });

  for (const command of commands) {
    run(command, { dryRun: options.dryRun, allowFailure: false });
  }

  return commands;
}

async function writeTemplateToDestination(
  templateName,
  destination,
  variables,
  options
) {
  const rendered = renderTemplate(await readTemplate(templateName), variables);
  if (!options.force && (await exists(destination)) && !options.merge) {
    return false;
  }
  await writeText(destination, rendered, options);
  if (options.mode && !options.dryRun) {
    await chmod(destination, options.mode);
  }
  return true;
}

async function readTemplate(templateName) {
  return readFile(templatePath(...templateName.split('/')), 'utf8');
}

async function inferSourceDirs(rootDirectory) {
  const candidates = ['src', 'app', 'lib', 'packages', 'services'];
  const found = [];
  for (const candidate of candidates) {
    if (await exists(path.join(rootDirectory, candidate))) {
      found.push(candidate);
    }
  }
  return found;
}

async function inferTestDirs(rootDirectory) {
  const candidates = ['test', 'tests', '__tests__'];
  const found = [];
  for (const candidate of candidates) {
    if (await exists(path.join(rootDirectory, candidate))) {
      found.push(candidate);
    }
  }
  return found;
}

function baselineFeature(mode) {
  return mode === 'new'
    ? {
        id: 'define_first_product_feature',
        status: 'pending',
        sdd: true
      }
    : {
        id: 'baseline_existing_project',
        status: 'pending',
        sdd: false
      };
}

function shellEscape(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}

export function parseAgentOption(args) {
  return parseAgents(args);
}

export async function collectExistingRepoAdapterFiles(rootDirectory, agents) {
  const existing = new Set();

  for (const agent of agents) {
    const files = REPO_TEMPLATE_MAP[agent] || [];
    for (const [, destination] of files) {
      const filePath = path.join(rootDirectory, destination);
      if (await exists(filePath)) {
        existing.add(filePath);
      }
    }
  }

  return existing;
}

async function ensurePrettierIgnore(rootDirectory, options) {
  const target = path.join(rootDirectory, '.prettierignore');
  const content = [
    '.agents/',
    '.claude/skills/',
    '.specify/',
    'harness.config.json'
  ].join('\n');
  appendManagedBlock(target, 'generated-ignore', content, options);
}

function formatJsonForTemplate(value, indent) {
  const json = JSON.stringify(value, null, 2);
  const padding = ' '.repeat(indent);
  return json.replace(/\n/g, `\n${padding}`);
}

async function ensureAgentsFile(filePath, variables, options) {
  const rendered = renderTemplate(
    await readTemplate('universal/AGENTS.md'),
    variables
  );

  if (!(await exists(filePath))) {
    await writeText(filePath, rendered, options);
    return;
  }

  let current = await readFile(filePath, 'utf8');
  current = normalizeAgentsMarkdown(current);

  if (!options.dryRun) {
    await writeText(filePath, current, options);
  }

  appendManagedBlock(filePath, 'agents-contract', rendered, options);
}

function normalizeAgentsMarkdown(content) {
  let next = content.replace(
    /<!-- SPECKIT START -->\n(?!\n)/g,
    '<!-- SPECKIT START -->\n\n'
  );
  next = next.replace(
    /(?<!\n)\n<!-- SPECKIT END -->/g,
    '\n\n<!-- SPECKIT END -->'
  );
  return next.trimEnd() + '\n';
}
