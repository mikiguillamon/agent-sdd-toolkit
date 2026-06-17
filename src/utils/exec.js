import { spawnSync } from 'node:child_process';

export function commandExists(command) {
  const result = spawnSync('sh', ['-lc', `command -v ${shellQuote(command)}`], {
    encoding: 'utf8'
  });
  return result.status === 0;
}

export function run(command, options = {}) {
  const {
    cwd = process.cwd(),
    dryRun = false,
    allowFailure = false,
    silent = false,
    env
  } = options;

  if (!silent) {
    console.log(`$ ${command}`);
  }

  if (dryRun) {
    return { status: 0, stdout: '', stderr: '' };
  }

  const result = spawnSync('sh', ['-lc', command], {
    cwd,
    env: env ? { ...process.env, ...env } : process.env,
    encoding: 'utf8',
    stdio: silent ? 'pipe' : 'inherit'
  });

  if (result.status !== 0 && !allowFailure) {
    throw new Error(`Command failed: ${command}`);
  }

  return result;
}

export function capture(command, options = {}) {
  const result = spawnSync('sh', ['-lc', command], {
    cwd: options.cwd || process.cwd(),
    env: options.env ? { ...process.env, ...options.env } : process.env,
    encoding: 'utf8'
  });

  return {
    ok: result.status === 0,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
    status: result.status
  };
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}
