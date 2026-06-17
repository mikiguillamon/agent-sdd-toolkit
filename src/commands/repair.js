import { parseCliArgs } from '../utils/options.js';
import { createReporter } from '../utils/log.js';
import { doctor } from './doctor.js';
import { parseAgentOption, repairRepository } from '../project.js';

export async function repair(args) {
  const options = parseCliArgs(args);
  const agents = parseAgentOption(args);
  const reporter = createReporter();

  const changes = await repairRepository(process.cwd(), agents, options);
  if (changes.length === 0) {
    reporter.info('no legacy issues detected');
  } else {
    for (const change of changes) {
      reporter.ok(change);
    }
  }

  await doctor(args.filter((arg) => arg !== '--dry-run'));
}
