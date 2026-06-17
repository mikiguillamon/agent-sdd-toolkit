import fs from 'node:fs';
import path from 'node:path';

export function appendManagedBlock(file, blockName, content, options = {}) {
  const { dryRun = false } = options;
  const start = `<!-- agent-sdd:${blockName}:start -->`;
  const end = `<!-- agent-sdd:${blockName}:end -->`;
  const block = `${start}\n${content.trim()}\n${end}\n`;

  let current = '';
  if (fs.existsSync(file)) {
    current = fs.readFileSync(file, 'utf8');
  }

  if (current.includes(start) && current.includes(end)) {
    const pattern = new RegExp(
      `${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}\\n?`
    );
    const next = current.replace(pattern, block);
    if (!dryRun) {
      fs.writeFileSync(file, next);
    }
    return { changed: next !== current, mode: 'replaced' };
  }

  const next = current.trim() ? `${current.trim()}\n\n${block}` : `${block}`;

  if (!dryRun) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, next);
  }

  return { changed: true, mode: 'appended' };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
