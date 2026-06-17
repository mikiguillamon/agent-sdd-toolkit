# agent-sdd-toolkit

`agent-sdd-toolkit` is a public npm CLI for preparing machines and repositories for agent-agnostic Specification-Driven Development.

## Commands

```sh
npx agent-sdd-toolkit machine --agents all
npx agent-sdd-toolkit new my-project --agents codex,claude,copilot,cursor,generic
npx agent-sdd-toolkit adopt --agents all
npx agent-sdd-toolkit doctor --agents all
npx agent-sdd-toolkit repair --agents all
npx agent-sdd-toolkit sync --to devbox --agents codex,claude
```

The package exposes the bin `agent-sdd`.

## Architecture

- `AGENTS.md` is the source of truth.
- Spec Kit is the SDD engine when available.
- `harness.config.json` stores real project commands.
- `init.sh` is the executable verification gate.
- Agent adapters are thin layers that point back to `AGENTS.md`.

## Machine behavior

`machine` is diagnose-first by default. It checks tools such as `git`, `node`, `npm`, `python3`, `uv`, and `specify`, then installs or refreshes supported global adapters. It does not auto-install missing tools unless a future workflow explicitly allows it with `--yes`.

## Team policy

Version these files in each repository when applicable:

- `AGENTS.md`
- `CLAUDE.md`
- `.github/copilot-instructions.md`
- `.cursor/rules/`
- `.specify/`
- `specs/`
- `harness.config.json`
- `init.sh`
- `scripts/validate_harness.py`
- `feature_list.json`
- `progress/current.md`

Do not version:

- personal home-directory agent config
- `.env`
- credentials, tokens, private keys, or sessions

## SSH workflow

For remote bootstrap, ensure the remote machine has `node`, `npm`, `git`, `python3`, `uv`, and `specify` where needed, then run:

```sh
npx agent-sdd-toolkit machine --agents codex,claude
npx agent-sdd-toolkit doctor --agents codex,claude
```

`sync` uses `ssh` and `rsync` to copy only non-sensitive global toolkit assets.

## Local development

```sh
npm install
npm test
npm run lint
npm run format:check
npm pack --dry-run
```
