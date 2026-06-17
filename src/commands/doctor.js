import { parseCliArgs } from '../utils/options.js';
import { createReporter } from '../utils/log.js';
import {
  diagnoseMachine,
  diagnoseRepository,
  parseAgentOption
} from '../project.js';

export async function doctor(args) {
  const options = parseCliArgs(args);
  const agents = parseAgentOption(args);
  const reporter = createReporter();

  const machineChecks = await diagnoseMachine(agents);
  for (const [name, ok] of machineChecks) {
    if (ok) reporter.ok(`${name} found`);
    else reporter.warn(`${name} missing`);
  }

  const repoChecks = await diagnoseRepository(process.cwd(), agents, options);
  for (const [name, ok] of repoChecks) {
    if (ok) reporter.ok(`${name} valid`);
    else reporter.warn(`${name} missing or invalid`);
  }
}
