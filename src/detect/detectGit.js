import path from 'node:path';
import { capture } from '../utils/exec.js';

export function detectGit(rootDirectory) {
  const topLevel = capture('git rev-parse --show-toplevel', {
    cwd: rootDirectory
  });
  const branch = capture('git branch --show-current', { cwd: rootDirectory });
  const status = capture('git status --porcelain', { cwd: rootDirectory });

  return {
    isRepo: topLevel.ok,
    root: topLevel.ok ? topLevel.stdout : path.resolve(rootDirectory),
    branch: branch.ok ? branch.stdout : '',
    clean: status.ok ? status.stdout.length === 0 : false,
    statusLines: status.ok ? status.stdout.split('\n').filter(Boolean) : []
  };
}
