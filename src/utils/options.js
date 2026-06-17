export function parseCliArgs(args = []) {
  const options = {
    agents: undefined,
    yes: false,
    dryRun: false,
    force: false,
    noRunInit: false,
    to: undefined,
    output: undefined,
    positionals: []
  };

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];

    if (value === '--agents') {
      options.agents = args[index + 1];
      index += 1;
      continue;
    }

    if (value === '--to') {
      options.to = args[index + 1];
      index += 1;
      continue;
    }

    if (value === '--output') {
      options.output = args[index + 1];
      index += 1;
      continue;
    }

    if (value === '--yes') {
      options.yes = true;
      continue;
    }

    if (value === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (value === '--force') {
      options.force = true;
      continue;
    }

    if (value === '--no-run-init') {
      options.noRunInit = true;
      continue;
    }

    options.positionals.push(value);
  }

  return options;
}
