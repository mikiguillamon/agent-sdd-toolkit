import {
  chmod,
  copyFile,
  mkdir,
  readFile,
  rm,
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

export async function ensureParent(filePath, options = {}) {
  const directories = [];
  let current = path.dirname(filePath);

  while (current && current !== path.dirname(current)) {
    directories.push(current);
    current = path.dirname(current);
  }

  for (const directory of directories.reverse()) {
    if (await exists(directory)) {
      continue;
    }
    if (options.transaction) {
      await options.transaction.recordCreatedDirectory(directory);
    }
    await mkdir(directory, { recursive: false });
  }
}

export async function writeText(filePath, content, options = {}) {
  if (options.dryRun) {
    return false;
  }

  if (options.transaction) {
    await options.transaction.snapshotPath(filePath);
  }
  await ensureParent(filePath, options);
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

  if (options.transaction && !options.preserveOnRollback) {
    await options.transaction.snapshotPath(backupPath);
  }
  await ensureParent(backupPath, options);
  await copyFile(filePath, backupPath);
  return true;
}

export async function removePath(targetPath, options = {}) {
  if (options.dryRun) {
    return false;
  }

  if (options.transaction) {
    await options.transaction.snapshotPath(targetPath);
  }

  await rm(targetPath, { recursive: true, force: true });
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
