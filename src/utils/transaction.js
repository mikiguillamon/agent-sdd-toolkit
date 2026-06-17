import os from 'node:os';
import path from 'node:path';
import {
  chmod,
  cp,
  mkdtemp,
  mkdir,
  readFile,
  rm,
  stat,
  writeFile
} from 'node:fs/promises';
import { exists } from '../fs/fileOps.js';

export class OperationJournal {
  constructor() {
    this.snapshots = new Map();
    this.createdDirectories = [];
    this.externalNotes = [];
    this.tempRootPromise = mkdtemp(path.join(os.tmpdir(), 'agent-sdd-tx-'));
  }

  async snapshotPath(targetPath) {
    if (this.snapshots.has(targetPath)) {
      return;
    }

    if (!(await exists(targetPath))) {
      this.snapshots.set(targetPath, { kind: 'missing' });
      return;
    }

    const info = await stat(targetPath);
    if (info.isDirectory()) {
      const backupPath = path.join(
        await this.tempRootPromise,
        `dir-${this.snapshots.size}`
      );
      await cp(targetPath, backupPath, { recursive: true });
      this.snapshots.set(targetPath, {
        kind: 'directory',
        backupPath,
        mode: info.mode
      });
      return;
    }

    this.snapshots.set(targetPath, {
      kind: 'file',
      content: await readFile(targetPath),
      mode: info.mode
    });
  }

  async recordCreatedDirectory(directoryPath) {
    if (
      this.createdDirectories.includes(directoryPath) ||
      (await exists(directoryPath))
    ) {
      return;
    }

    this.createdDirectories.push(directoryPath);
  }

  noteExternalSideEffect(message) {
    if (!this.externalNotes.includes(message)) {
      this.externalNotes.push(message);
    }
  }

  async rollback() {
    const failures = [];

    for (const [targetPath, snapshot] of [
      ...this.snapshots.entries()
    ].reverse()) {
      try {
        await restorePath(targetPath, snapshot);
      } catch (error) {
        failures.push({
          path: targetPath,
          reason: error instanceof Error ? error.message : String(error)
        });
      }
    }

    for (const directoryPath of [...this.createdDirectories].reverse()) {
      try {
        await rm(directoryPath, { recursive: true, force: true });
      } catch (error) {
        if (!(error && error.code === 'ENOENT')) {
          failures.push({
            path: directoryPath,
            reason: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }

    return {
      ok: failures.length === 0,
      partial: failures.length > 0 || this.externalNotes.length > 0,
      failures,
      externalNotes: [...this.externalNotes]
    };
  }

  async dispose() {
    const tempRoot = await this.tempRootPromise;
    await rm(tempRoot, { recursive: true, force: true });
  }
}

async function restorePath(targetPath, snapshot) {
  if (snapshot.kind === 'missing') {
    await rm(targetPath, { recursive: true, force: true });
    return;
  }

  await rm(targetPath, { recursive: true, force: true });

  if (snapshot.kind === 'directory') {
    await cp(snapshot.backupPath, targetPath, { recursive: true });
    await chmod(targetPath, snapshot.mode);
    return;
  }

  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, snapshot.content);
  await chmod(targetPath, snapshot.mode);
}
