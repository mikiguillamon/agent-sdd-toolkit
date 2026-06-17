import { parseCliArgs } from '../utils/options.js';
import { createReporter } from '../utils/log.js';
import { maybeFail } from '../utils/failpoint.js';
import { withRollback } from '../utils/withRollback.js';
import { doctor } from './doctor.js';
import { parseAgentOption, repairRepository } from '../project.js';

export async function repair(args) {
  const options = parseCliArgs(args);
  const agents = parseAgentOption(args);
  const reporter = createReporter();

  await withRollback(reporter, options, async (scopedOptions) => {
    const changes = await repairRepository(
      process.cwd(),
      agents,
      scopedOptions
    );
    if (changes.length === 0) {
      reporter.info('no legacy issues detected');
    } else {
      for (const change of changes) {
        reporter.ok(change);
      }
    }

    maybeFail('after-repair-rewrites');

    await doctor(args.filter((arg) => arg !== '--dry-run'));
  });
}
