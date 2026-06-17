import path from 'node:path';
import { exists } from '../fs/fileOps.js';

export async function detectExistingAgentFiles(rootDirectory) {
  const files = {
    agents: await exists(path.join(rootDirectory, 'AGENTS.md')),
    claude: await exists(path.join(rootDirectory, 'CLAUDE.md')),
    copilot: await exists(
      path.join(rootDirectory, '.github', 'copilot-instructions.md')
    ),
    cursor: await exists(
      path.join(rootDirectory, '.cursor', 'rules', 'agent-sdd.mdc')
    ),
    windsurf: await exists(path.join(rootDirectory, '.windsurfrules')),
    readmeAgent: await exists(path.join(rootDirectory, 'README_AGENT.md')),
    codexRepo: await exists(path.join(rootDirectory, '.codex'))
  };

  return files;
}
