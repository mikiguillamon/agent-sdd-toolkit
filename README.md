# agent_sdd_toolkit

`agent_sdd_toolkit` is a public npm CLI for bootstrapping a Specification-Driven Development (SDD) workspace designed for AI-agent-assisted projects.

## Usage

Run it directly with `npx`:

```sh
npx agent_sdd_toolkit init my-project
```

This creates:

- `AGENTS.md` with agent operating instructions.
- `docs/spec.md` for requirements and acceptance criteria.
- `docs/plan.md` for architecture, risks, and validation.
- `docs/tasks.md` for implementation tracking.

## Commands

```sh
npx agent_sdd_toolkit --help
npx agent_sdd_toolkit --version
npx agent_sdd_toolkit init [directory] [--force]
```

## Publishing to npm

The package is configured for public npm publishing through GitHub Actions. To publish a new version:

1. Create an npm automation token.
2. Add it to the GitHub repository secrets as `NPM_TOKEN`.
3. Update `package.json` version using semantic versioning.
4. Push a tag named `vX.Y.Z`.

```sh
git tag v0.1.0
git push origin v0.1.0
```

The release workflow runs tests, linting, formatting checks, and then publishes with public access.

## Local development

```sh
npm install
npm test
npm run lint
npm run format:check
```

## License

MIT
