import { parseCliArgs } from '../utils/options.js';
import { createReporter } from '../utils/log.js';
import {
  diagnoseMachine,
  ensureGlobalAdapters,
  parseAgentOption
} from '../project.js';

export async function machine(args) {
  const options = parseCliArgs(args);
  const agents = parseAgentOption(args);
  const reporter = createReporter();

  const checks = await diagnoseMachine(agents);
  for (const [name, ok] of checks) {
    if (ok) reporter.ok(`${name} found`);
    else reporter.warn(`${name} missing`);
  }

  if (!options.yes) {
    reporter.info(
      'machine runs in diagnose-first mode; no tools were auto-installed'
    );
  }

  await ensureGlobalAdapters(agents, {
    dryRun: options.dryRun,
    force: options.force
  });

  reporter.ok(`global adapters checked for: ${agents.join(', ')}`);
}
