import { parseCliArgs } from '../utils/options.js';
import { createReporter } from '../utils/log.js';
import { parseAgentOption, syncGlobalAssets } from '../project.js';

export async function sync(args) {
  const options = parseCliArgs(args);
  const agents = parseAgentOption(args);
  const reporter = createReporter();

  if (!options.to) {
    throw new Error('sync requires --to <host>');
  }

  const commands = await syncGlobalAssets(options.to, agents, options);
  reporter.ok(`prepared ${commands.length} sync commands for ${options.to}`);
}
