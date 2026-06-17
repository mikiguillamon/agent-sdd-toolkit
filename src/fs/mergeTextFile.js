import { readFile } from 'node:fs/promises';
import { exists, writeText } from './fileOps.js';

export async function appendManagedBlock(
  file,
  blockName,
  content,
  options = {}
) {
  const start = `<!-- agent-sdd:${blockName}:start -->`;
  const end = `<!-- agent-sdd:${blockName}:end -->`;
  const block = `${start}\n${content.trim()}\n${end}\n`;

  let current = '';
  if (await exists(file)) {
    current = await readFile(file, 'utf8');
  }

  if (current.includes(start) && current.includes(end)) {
    const pattern = new RegExp(
      `${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}\\n?`
    );
    const next = current.replace(pattern, block);
    if (!options.dryRun) {
      await writeText(file, next, options);
    }
    return { changed: next !== current, mode: 'replaced' };
  }

  const next = current.trim() ? `${current.trim()}\n\n${block}` : `${block}`;

  if (!options.dryRun) {
    await writeText(file, next, options);
  }

  return { changed: true, mode: 'appended' };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
