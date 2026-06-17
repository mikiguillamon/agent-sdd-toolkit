import { parseCliArgs } from '../utils/options.js';
import { createReporter } from '../utils/log.js';
import { maybeFail } from '../utils/failpoint.js';
import { withRollback } from '../utils/withRollback.js';
import {
  cleanupRepoLocalMachineArtifacts,
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

  await withRollback(reporter, options, async (scopedOptions, transaction) => {
    const branchResult = await ensureBranchForAdopt(
      rootDirectory,
      scopedOptions
    );
    if (branchResult.created) {
      transaction.noteExternalSideEffect(
        `git branch ${branchResult.branch} may have been created before the failure`
      );
    }

    const existingRepoAdapterFiles = await collectExistingRepoAdapterFiles(
      rootDirectory,
      agents
    );
    const specKit = await runSpecKit(
      rootDirectory,
      agents,
      'adopt',
      scopedOptions
    );
    const context = await collectProjectContext(rootDirectory);

    if (!context.git.clean) {
      reporter.warn('working tree is not clean; proceeding carefully');
    }

    await ensureUniversalFiles(rootDirectory, context, 'adopt', {
      dryRun: scopedOptions.dryRun,
      force: scopedOptions.force,
      transaction: scopedOptions.transaction
    });
    await ensureRepoAdapters(rootDirectory, agents, {
      dryRun: scopedOptions.dryRun,
      force: scopedOptions.force,
      merge: true,
      mergeExistingFiles: existingRepoAdapterFiles,
      transaction: scopedOptions.transaction
    });
    const cleanupResult = await cleanupRepoLocalMachineArtifacts(
      rootDirectory,
      scopedOptions
    );

    maybeFail('after-adopt-scaffold');

    const initResult = await runInitScript(rootDirectory, scopedOptions);
    if (initResult.ran && !initResult.ok) {
      await writeProgressBlocker(
        rootDirectory,
        'baseline verification failed during adopt',
        scopedOptions
      );
      throw new Error('./init.sh reported blockers');
    }

    reporter.ok(`adopted repository on branch ${branchResult.branch}`);
    for (const warning of specKit.warnings) {
      reporter.warn(warning);
    }
    if (cleanupResult.warning) {
      reporter.warn(cleanupResult.warning);
    }
    if (initResult.ran && initResult.ok) reporter.ok('./init.sh passed');
  });
}
