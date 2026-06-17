const SUPPORTED = [
  'codex',
  'claude',
  'copilot',
  'cursor',
  'windsurf',
  'generic'
];

export function parseAgents(args = []) {
  const index = args.indexOf('--agents');
  let value = 'generic';

  if (index !== -1 && args[index + 1]) {
    value = args[index + 1];
  }

  if (value === 'all') {
    return [...SUPPORTED];
  }

  const agents = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  for (const agent of agents) {
    if (!SUPPORTED.includes(agent)) {
      throw new Error(
        `Unsupported agent: ${agent}. Supported: ${SUPPORTED.join(', ')}, all`
      );
    }
  }

  return agents.length ? agents : ['generic'];
}

export function hasAgent(agents, name) {
  return agents.includes(name);
}

export { SUPPORTED as supportedAgents };
