import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const repoRoot = path.resolve(__dirname, '..', '..');
export const templateRoot = path.join(repoRoot, 'templates');
export const skillsPackRoot = path.join(repoRoot, 'agent-sdd-skills');

export function homePath(...parts) {
  return path.join(process.env.HOME || os.homedir(), ...parts);
}

export function templatePath(...parts) {
  return path.join(templateRoot, ...parts);
}
