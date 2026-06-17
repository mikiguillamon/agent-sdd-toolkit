import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { exists } from '../fs/fileOps.js';

export async function detectCommands(rootDirectory, stackInfo) {
  const commands = {
    setup: [],
    format_check: [],
    lint: [],
    typecheck: [],
    test: [],
    build: [],
    smoke: []
  };

  if (stackInfo.stack.includes('node')) {
    await detectNodeCommands(
      rootDirectory,
      commands,
      stackInfo.packageManagers
    );
  }

  if (stackInfo.stack.includes('python')) {
    await detectPythonCommands(rootDirectory, commands);
  }

  return commands;
}

async function detectNodeCommands(rootDirectory, commands, packageManagers) {
  const pkg = JSON.parse(
    await readFile(path.join(rootDirectory, 'package.json'), 'utf8')
  );
  const scripts = pkg.scripts || {};
  const runner = packageManagers.includes('pnpm')
    ? 'pnpm'
    : packageManagers.includes('yarn')
      ? 'yarn'
      : 'npm run';

  if (scripts.setup) commands.setup.push(formatRunner(runner, 'setup'));
  else if (packageManagers.includes('pnpm'))
    commands.setup.push('pnpm install');
  else if (packageManagers.includes('yarn'))
    commands.setup.push('yarn install');
  else commands.setup.push('npm install');

  if (scripts['format:check']) {
    commands.format_check.push(formatRunner(runner, 'format:check'));
  }
  if (scripts.lint) commands.lint.push(formatRunner(runner, 'lint'));
  if (scripts.typecheck)
    commands.typecheck.push(formatRunner(runner, 'typecheck'));
  if (scripts.test) commands.test.push(formatRunner(runner, 'test'));
  if (scripts.build) commands.build.push(formatRunner(runner, 'build'));
  if (scripts.smoke) commands.smoke.push(formatRunner(runner, 'smoke'));
}

async function detectPythonCommands(rootDirectory, commands) {
  const pyprojectPath = path.join(rootDirectory, 'pyproject.toml');
  const requirementsPath = path.join(rootDirectory, 'requirements.txt');

  if ((await exists(pyprojectPath)) || (await exists(requirementsPath))) {
    commands.setup.push('uv sync');
  }

  if (await exists(pyprojectPath)) {
    const pyproject = await readFile(pyprojectPath, 'utf8');
    if (pyproject.includes('ruff')) commands.lint.push('uv run ruff check .');
    if (pyproject.includes('mypy')) commands.typecheck.push('uv run mypy .');
    if (pyproject.includes('pytest')) commands.test.push('uv run pytest');
  }

  if ((await exists(requirementsPath)) && commands.test.length === 0) {
    commands.test.push('uv run pytest');
  }
}

function formatRunner(runner, script) {
  return runner === 'yarn' ? `yarn ${script}` : `${runner} ${script}`;
}
