import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { machine } from './commands/machine.js';
import { newProject } from './commands/new.js';
import { adoptProject } from './commands/adopt.js';
import { doctor } from './commands/doctor.js';
import { repair } from './commands/repair.js';
import { sync } from './commands/sync.js';

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

const helpText = `Agent SDD Toolkit

Usage:
  agent-sdd machine --agents <list>
  agent-sdd new [directory] --agents <list>
  agent-sdd adopt --agents <list>
  agent-sdd doctor --agents <list>
  agent-sdd repair --agents <list>
  agent-sdd sync --to <host> --agents <list>

Options:
  --agents <list>   codex,claude,copilot,cursor,windsurf,generic,all
  --yes             Allow installations when a command supports it
  --dry-run         Print actions without writing files
  --force           Overwrite toolkit-managed files
  --no-run-init     Skip ./init.sh execution
  --to <host>       Sync target host for sync
`;

export async function main(args) {
  const [command] = args;

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

  const subcommandArgs = args.slice(1);

  switch (command) {
    case 'machine':
      await machine(subcommandArgs);
      break;
    case 'new':
      await newProject(subcommandArgs);
      break;
    case 'adopt':
      await adoptProject(subcommandArgs);
      break;
    case 'doctor':
      await doctor(subcommandArgs);
      break;
    case 'repair':
      await repair(subcommandArgs);
      break;
    case 'sync':
      await sync(subcommandArgs);
      break;
    default:
      throw new Error(`Unknown command: ${command}\n\n${helpText}`);
  }
}
