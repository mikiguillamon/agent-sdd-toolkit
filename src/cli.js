import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

const helpText = `agent_sdd_toolkit

Usage:
  npx agent_sdd_toolkit init [directory] [--force]
  npx agent_sdd_toolkit --help
  npx agent_sdd_toolkit --version

Commands:
  init       Create a Specification-Driven Development workspace for AI agents.

Options:
  --force    Overwrite existing toolkit files.
`;

export async function main(args) {
  const [command, maybeDirectory, ...rest] = args;

  if (!command || command === '--help' || command === '-h') {
    console.log(helpText.trimEnd());
    return;
  }

  if (command === '--version' || command === '-v') {
    const pkg = JSON.parse(
      await readFile(path.join(packageRoot, 'package.json'), 'utf8')
    );
    console.log(pkg.version);
    return;
  }

  if (command === 'init') {
    const targetDirectory =
      maybeDirectory && !maybeDirectory.startsWith('-') ? maybeDirectory : '.';
    const flags = new Set([maybeDirectory, ...rest].filter(Boolean));
    await initWorkspace(path.resolve(process.cwd(), targetDirectory), {
      force: flags.has('--force')
    });
    return;
  }

  throw new Error(`Unknown command: ${command}\n\n${helpText}`);
}

export async function initWorkspace(targetDirectory, options = {}) {
  const templateDirectory = path.join(
    packageRoot,
    'templates',
    'sdd-workspace'
  );
  const files = ['AGENTS.md', 'docs/spec.md', 'docs/plan.md', 'docs/tasks.md'];

  await mkdir(targetDirectory, { recursive: true });

  for (const relativePath of files) {
    const source = path.join(templateDirectory, relativePath);
    const destination = path.join(targetDirectory, relativePath);
    await mkdir(path.dirname(destination), { recursive: true });

    if (!options.force && (await exists(destination))) {
      throw new Error(
        `Refusing to overwrite ${relativePath}. Re-run with --force to replace it.`
      );
    }

    await writeFile(destination, await readFile(source, 'utf8'), 'utf8');
  }

  console.log(`SDD workspace ready at ${targetDirectory}`);
}

async function exists(filePath) {
  try {
    await readFile(filePath);
    return true;
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}
