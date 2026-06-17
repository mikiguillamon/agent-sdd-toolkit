import {
  chmod,
  copyFile,
  mkdir,
  readFile,
  stat,
  writeFile
} from 'node:fs/promises';
import path from 'node:path';

export async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

export async function ensureParent(filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

export async function writeText(filePath, content, options = {}) {
  if (options.dryRun) {
    return false;
  }
  await ensureParent(filePath);
  await writeFile(filePath, content, 'utf8');
  if (options.mode) {
    await chmod(filePath, options.mode);
  }
  return true;
}

export async function copyWithBackup(filePath, backupPath, options = {}) {
  if (options.dryRun) {
    return false;
  }
  await ensureParent(backupPath);
  await copyFile(filePath, backupPath);
  return true;
}

export async function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return fallback;
    }
    throw error;
  }
}
