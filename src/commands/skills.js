import path from 'node:path';
import { parseCliArgs } from '../utils/options.js';
import { createReporter } from '../utils/log.js';
import { parseAgentOption } from '../project.js';
import {
  diagnoseSkillsPackTargets,
  exportSkillsPack,
  installSkillsPack,
  listSkillsPack,
  validateSkillsPack
} from '../skills/pack.js';

export async function skills(args) {
  const [subcommand] = args;
  const reporter = createReporter();
  const options = parseCliArgs(args.slice(1));
  const agents = subcommand === 'list' ? [] : parseAgentOption(args.slice(1));

  switch (subcommand) {
    case 'list': {
      const summary = await listSkillsPack();
      reporter.info(`pack: ${summary.name} (${summary.skills.length} skills)`);
      for (const skill of summary.skills) {
        reporter.ok(
          `${skill.name}: ${skill.shortDescription} [${skill.targetSummary}]`
        );
      }
      break;
    }
    case 'validate': {
      const result = await validateSkillsPack();
      reporter.ok(result.message);
      break;
    }
    case 'doctor': {
      const checks = await diagnoseSkillsPackTargets(agents);
      for (const check of checks) {
        if (check.ok) reporter.ok(check.message);
        else if (check.level === 'warn') reporter.warn(check.message);
        else reporter.error(check.message);
      }
      break;
    }
    case 'install': {
      const result = await installSkillsPack(agents, {
        dryRun: options.dryRun,
        force: options.force
      });
      for (const message of result.messages) {
        if (message.level === 'warn') reporter.warn(message.text);
        else reporter.ok(message.text);
      }
      break;
    }
    case 'export': {
      const outputDirectory = path.resolve(
        process.cwd(),
        options.output || 'agent-sdd-skills-export'
      );
      const result = await exportSkillsPack(agents, outputDirectory, {
        dryRun: options.dryRun,
        force: options.force
      });
      for (const message of result.messages) {
        if (message.level === 'warn') reporter.warn(message.text);
        else reporter.ok(message.text);
      }
      break;
    }
    default:
      throw new Error(
        'Unknown skills command. Use one of: list, validate, doctor, install, export'
      );
  }
}
