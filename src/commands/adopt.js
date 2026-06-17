import { parseCliArgs } from '../utils/options.js';
import { createReporter } from '../utils/log.js';
import {
  collectProjectContext,
  collectExistingRepoAdapterFiles,
  ensureBranchForAdopt,
  ensureRepoAdapters,
  ensureUniversalFiles,
  parseAgentOption,
  runInitScript,
  runSpecKit,
  writeProgressBlocker
} from '../project.js';

export async function adoptProject(args) {
  const options = parseCliArgs(args);
  const agents = parseAgentOption(args);
  const rootDirectory = process.cwd();
  const reporter = createReporter();

  const branchResult = await ensureBranchForAdopt(rootDirectory, options);
  const existingRepoAdapterFiles = await collectExistingRepoAdapterFiles(
    rootDirectory,
    agents
  );
  const specKit = await runSpecKit(rootDirectory, agents, 'adopt', options);
  const context = await collectProjectContext(rootDirectory);

  if (!context.git.clean) {
    reporter.warn('working tree is not clean; proceeding carefully');
  }

  await ensureUniversalFiles(rootDirectory, context, 'adopt', {
    dryRun: options.dryRun,
    force: options.force
  });
  await ensureRepoAdapters(rootDirectory, agents, {
    dryRun: options.dryRun,
    force: options.force,
    merge: true,
    mergeExistingFiles: existingRepoAdapterFiles
  });

  const initResult = await runInitScript(rootDirectory, options);
  if (initResult.ran && !initResult.ok) {
    await writeProgressBlocker(
      rootDirectory,
      'baseline verification failed during adopt',
      options
    );
  }

  reporter.ok(`adopted repository on branch ${branchResult.branch}`);
  for (const warning of specKit.warnings) {
    reporter.warn(warning);
  }
  if (initResult.ran && initResult.ok) reporter.ok('./init.sh passed');
  else if (!initResult.ok) reporter.warn('./init.sh reported blockers');
}
