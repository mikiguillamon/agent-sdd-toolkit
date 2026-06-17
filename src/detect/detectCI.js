import path from 'node:path';
import { exists } from '../fs/fileOps.js';

export async function detectCI(rootDirectory) {
  const checks = [
    ['github_actions', path.join(rootDirectory, '.github', 'workflows')],
    ['gitlab', path.join(rootDirectory, '.gitlab-ci.yml')],
    ['bitbucket', path.join(rootDirectory, 'bitbucket-pipelines.yml')],
    ['azure', path.join(rootDirectory, 'azure-pipelines.yml')]
  ];

  const found = [];

  for (const [name, filePath] of checks) {
    if (await exists(filePath)) {
      found.push(name);
    }
  }

  return found;
}
