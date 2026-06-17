import { parseCliArgs } from '../utils/options.js';
import { createReporter } from '../utils/log.js';
import { parseAgentOption, syncGlobalAssets } from '../project.js';
import { withRollback } from '../utils/withRollback.js';

export async function sync(args) {
  const options = parseCliArgs(args);
  const agents = parseAgentOption(args);
  const reporter = createReporter();

  if (!options.to) {
    throw new Error('sync requires --to <host>');
  }

  await withRollback(reporter, options, async (scopedOptions) => {
    const commands = await syncGlobalAssets(options.to, agents, scopedOptions);
    reporter.ok(`prepared ${commands.length} sync commands for ${options.to}`);
  });
}
