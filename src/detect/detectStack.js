import path from 'node:path';
import { exists } from '../fs/fileOps.js';

export async function detectStack(rootDirectory) {
  const stack = [];
  const packageManagers = [];

  if (await exists(path.join(rootDirectory, 'package.json'))) {
    stack.push('node');
    packageManagers.push(
      (await exists(path.join(rootDirectory, 'pnpm-lock.yaml')))
        ? 'pnpm'
        : (await exists(path.join(rootDirectory, 'yarn.lock')))
          ? 'yarn'
          : 'npm'
    );
  }

  if (
    (await exists(path.join(rootDirectory, 'pyproject.toml'))) ||
    (await exists(path.join(rootDirectory, 'requirements.txt'))) ||
    (await exists(path.join(rootDirectory, 'setup.py')))
  ) {
    stack.push('python');
    packageManagers.push('uv');
  }

  if (await exists(path.join(rootDirectory, 'Cargo.toml'))) {
    stack.push('rust');
    packageManagers.push('cargo');
  }

  if (await exists(path.join(rootDirectory, 'go.mod'))) {
    stack.push('go');
  }

  if (await exists(path.join(rootDirectory, 'composer.json'))) {
    stack.push('php');
    packageManagers.push('composer');
  }

  if (await exists(path.join(rootDirectory, 'Gemfile'))) {
    stack.push('ruby');
    packageManagers.push('bundler');
  }

  if (
    (await exists(path.join(rootDirectory, 'Dockerfile'))) ||
    (await exists(path.join(rootDirectory, 'docker-compose.yml')))
  ) {
    stack.push('docker');
  }

  return {
    stack,
    packageManagers: [...new Set(packageManagers)]
  };
}
