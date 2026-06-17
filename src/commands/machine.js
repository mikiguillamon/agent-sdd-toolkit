import { parseCliArgs } from '../utils/options.js';
import { createReporter } from '../utils/log.js';
import { maybeFail } from '../utils/failpoint.js';
import { withRollback } from '../utils/withRollback.js';
import {
  diagnoseMachine,
  ensureGlobalAdapters,
  parseAgentOption
} from '../project.js';
import { diagnoseSkillsPackTargets } from '../skills/pack.js';

export async function machine(args) {
  const options = parseCliArgs(args);
  const agents = parseAgentOption(args);
  const reporter = createReporter();

  await withRollback(reporter, options, async (scopedOptions) => {
    const checks = await diagnoseMachine(agents);
    for (const [name, ok] of checks) {
      if (ok) reporter.ok(`${name} found`);
      else reporter.warn(`${name} missing`);
    }

    if (!scopedOptions.yes) {
      reporter.info(
        'machine runs in diagnose-first mode; no tools were auto-installed'
      );
    }

    await ensureGlobalAdapters(agents, {
      dryRun: scopedOptions.dryRun,
      force: scopedOptions.force,
      transaction: scopedOptions.transaction
    });

    maybeFail('after-machine-global-adapters');

    reporter.ok(`global adapters checked for: ${agents.join(', ')}`);

    const skillChecks = await diagnoseSkillsPackTargets(agents);
    for (const check of skillChecks) {
      if (!check.ok && check.level === 'warn') {
        reporter.info(check.message);
      }
    }
  });
}
