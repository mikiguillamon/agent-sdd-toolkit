import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { parseCliArgs } from '../utils/options.js';
import { createReporter } from '../utils/log.js';
import { maybeFail } from '../utils/failpoint.js';
import { withRollback } from '../utils/withRollback.js';
import {
  cleanupRepoLocalMachineArtifacts,
  collectProjectContext,
  ensureRepoAdapters,
  ensureUniversalFiles,
  initializeGitRepo,
  parseAgentOption,
  runInitScript,
  runSpecKit
} from '../project.js';

export async function newProject(args) {
  const options = parseCliArgs(args);
  const agents = parseAgentOption(args);
  const targetDirectory = path.resolve(
    process.cwd(),
    options.positionals[0] || '.'
  );

  const reporter = createReporter();

  if (!options.dryRun) {
    await mkdir(targetDirectory, { recursive: true });
  }

  await withRollback(reporter, options, async (scopedOptions) => {
    await initializeGitRepo(targetDirectory, scopedOptions);
    const specKit = await runSpecKit(
      targetDirectory,
      agents,
      'new',
      scopedOptions
    );
    const context = await collectProjectContext(targetDirectory);

    await ensureUniversalFiles(targetDirectory, context, 'new', {
      dryRun: scopedOptions.dryRun,
      force: scopedOptions.force,
      transaction: scopedOptions.transaction
    });
    await ensureRepoAdapters(targetDirectory, agents, {
      dryRun: scopedOptions.dryRun,
      force: scopedOptions.force,
      transaction: scopedOptions.transaction
    });
    const cleanupResult = await cleanupRepoLocalMachineArtifacts(
      targetDirectory,
      scopedOptions
    );

    maybeFail('after-new-scaffold');

    const initResult = await runInitScript(targetDirectory, scopedOptions);

    for (const warning of specKit.warnings) {
      reporter.warn(warning);
    }
    if (cleanupResult.warning) {
      reporter.warn(cleanupResult.warning);
    }
    if (initResult.ran && !initResult.ok) {
      throw new Error('./init.sh reported blockers');
    }

    reporter.ok(`project initialized at ${targetDirectory}`);
    reporter.ok(`agents configured: ${agents.join(', ')}`);
    if (initResult.ran && initResult.ok) reporter.ok('./init.sh passed');
    else if (scopedOptions.noRunInit)
      reporter.info('./init.sh skipped by --no-run-init');

    printNextPrompts(agents);
  });
}

function printNextPrompts(agents) {
  const prompt = agents.includes('claude')
    ? 'Lee AGENTS.md y CLAUDE.md. Revisa el bootstrap, crea la constitution con Spec Kit y prepara la primera feature. No implementes codigo hasta que apruebe spec, plan y tasks.'
    : 'Lee AGENTS.md. Este proyecto esta preparado para SDD. Prepara la primera especificacion y no implementes codigo hasta aprobacion humana.';

  console.log(`INFO: next prompt -> ${prompt}`);
}
