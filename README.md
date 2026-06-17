# agent-sdd-toolkit

`agent-sdd-toolkit` is a CLI for preparing machines and repositories for agent-agnostic Specification-Driven Development (SDD).

It is designed around one core rule:

- `AGENTS.md` is the source of truth.

Everything else is derived from that:

- Spec Kit integrations when available
- repository harness files
- agent-specific adapters for Codex, Claude, Copilot, Cursor, Windsurf, and generic agents

The package exposes two runnable bins:

- `agent-sdd`
- `agent-sdd-toolkit`

## What the toolkit does

The toolkit helps with four practical problems:

1. Preparing a local machine or SSH box for AI-agent-assisted development
2. Bootstrapping a brand-new repository for SDD
3. Adopting SDD in an existing repository without blindly overwriting files
4. Diagnosing, repairing, and syncing the non-sensitive parts of the setup

It also includes an optional capability pack:

5. Installing or exporting a reusable multi-agent skills pack for Codex-first environments

The generated repository model is:

- `AGENTS.md` defines the shared operating contract
- `harness.config.json` stores real detected commands
- `init.sh` is the executable verification gate
- `scripts/validate_harness.py` validates the static setup
- `feature_list.json` tracks bootstrap or feature lifecycle state
- agent adapters point back to `AGENTS.md` instead of duplicating the whole methodology

## Supported agents

- `codex`
- `claude`
- `copilot`
- `cursor`
- `windsurf`
- `generic`
- `all`

## Install and run

Run directly with `npx`:

```sh
npx agent-sdd-toolkit doctor --agents all --no-run-init
```

Or install globally if you prefer:

```sh
npm install -g agent-sdd-toolkit
agent-sdd doctor --agents all --no-run-init
```

## Commands

### `machine`

Prepare the current machine for agent-driven SDD.

Example:

```sh
npx agent-sdd-toolkit machine --agents codex,claude
```

What it does:

- checks `git`, `node`, `npm`, `python3`, `uv`, and `specify`
- installs or refreshes supported global adapters for selected agents
- does not touch the current repository
- works in diagnose-first mode by default

Use `--dry-run` to preview behavior:

```sh
npx agent-sdd-toolkit machine --agents all --dry-run
```

### `new`

Bootstrap a new SDD-ready project in a target directory.

Example:

```sh
npx agent-sdd-toolkit new my-project --agents claude,copilot,generic
```

What it does:

- creates the target directory if needed
- initializes Git if needed
- attempts Spec Kit integrations for selected agents
- creates the universal SDD layer
- creates repository-local adapters
- writes `feature_list.json` with the initial pending feature
- optionally runs `./init.sh`

Useful option:

```sh
--no-run-init
```

### `adopt`

Adopt the toolkit into an existing repository.

Example:

```sh
npx agent-sdd-toolkit adopt --agents all
```

What it does:

- checks that the current directory is a Git repo
- warns if the working tree is dirty
- creates or recommends `chore/adopt-agent-sdd` when starting from `main` or `master`
- detects stack, commands, CI, and existing agent files
- writes or updates the universal SDD layer
- merges adapter content safely instead of replacing blindly
- records blockers in `progress/current.md` when bootstrap verification fails

Use `--dry-run` first on important repositories.

### `doctor`

Diagnose machine state and repository state.

Example:

```sh
npx agent-sdd-toolkit doctor --agents all --no-run-init
```

What it checks:

- machine tooling availability
- presence of the universal harness files
- selected adapter coherence
- `feature_list.json` presence
- optional `./init.sh` execution unless skipped

This is the safest first command to run when you are unsure of the current state.

### `repair`

Repair older or inconsistent setups.

Example:

```sh
npx agent-sdd-toolkit repair --agents all
```

What it does:

- looks for older naming and legacy adapter content
- creates `.bak` backups for sensitive files before rewriting them
- rewrites adapters toward pointer-style files that reference `AGENTS.md`
- runs a `doctor` pass afterward

Use `--dry-run` to inspect the changes before writing them.

### `sync`

Sync non-sensitive global toolkit assets to a remote host over SSH/rsync.

Example:

```sh
npx agent-sdd-toolkit sync --to devbox --agents codex,claude
```

What it syncs:

- Codex skills
- Codex subagents
- Codex config
- Claude global adapter files

What it does not sync:

- `.env`
- secrets
- tokens
- SSH keys
- sessions
- private history

### `skills`

Manage the optional `agent-sdd-skills` pack.

Examples:

```sh
npx agent-sdd-toolkit skills list
npx agent-sdd-toolkit skills validate
npx agent-sdd-toolkit skills doctor --agents codex,claude
npx agent-sdd-toolkit skills install --agents codex
npx agent-sdd-toolkit skills export --agents claude,generic,cursor --output ./skills-export
```

What it does:

- lists the bundled skills and their support state by target
- validates the pack structure and metadata
- checks whether installable targets are already present
- installs Codex skills globally
- exports best-effort artifacts for Claude, generic, Copilot, Cursor, and Windsurf

Support model:

- `codex`: installable
- `claude`: exportable
- `generic`: exportable
- `copilot`: exportable
- `cursor`: exportable
- `windsurf`: exportable

## Main options

- `--agents <list>`: comma-separated list or `all`
- `--dry-run`: preview operations without writing files
- `--force`: overwrite toolkit-managed outputs where supported
- `--no-run-init`: skip `./init.sh`
- `--yes`: reserved for install-allowed flows such as future machine enhancements
- `--to <host>`: sync destination for `sync`
- `--output <dir>`: export destination for `skills export`

## Skills pack

The repository includes `agent-sdd-skills/`, a Codex-first but AI-ready pack of small operational skills.

Included skills:

- `token-discipline`
- `spec-driven-development`
- `repo-cartographer`
- `minimal-implementer`
- `senior-code-reviewer`
- `security-pass`
- `docs-writer`
- `ux-polish-reviewer`

Design rules:

- `AGENTS.md` remains the source of truth
- skills are optional accelerators, not replacements for repo policy
- each skill has one universal definition plus target-specific adapters
- non-Codex targets are exportable even when they are not natively installable yet

## Generated files in repositories

The toolkit may generate or update:

- `AGENTS.md`
- `harness.config.json`
- `init.sh`
- `scripts/validate_harness.py`
- `feature_list.json`
- `README_AGENT.md`
- `CLAUDE.md`
- `.claude/commands/*`
- `.claude/agents/*`
- `.claude/rules/*`
- `.github/copilot-instructions.md`
- `.cursor/rules/agent-sdd.mdc`
- `.windsurfrules`

## Global files on a machine

Depending on the selected agents, `machine` may create:

- `~/.agents/skills/sdd-project-bootstrap/SKILL.md`
- `~/.codex/agents/project_explorer.toml`
- `~/.codex/agents/spec_author.toml`
- `~/.codex/agents/implementer.toml`
- `~/.codex/agents/reviewer.toml`
- `~/.codex/config.toml`
- `~/.claude/CLAUDE.md`
- `~/.claude/rules/agent-sdd.md`

With `skills install --agents codex`, the toolkit may also create:

- `~/.agents/skills/token-discipline/`
- `~/.agents/skills/spec-driven-development/`
- `~/.agents/skills/repo-cartographer/`
- `~/.agents/skills/minimal-implementer/`
- `~/.agents/skills/senior-code-reviewer/`
- `~/.agents/skills/security-pass/`
- `~/.agents/skills/docs-writer/`
- `~/.agents/skills/ux-polish-reviewer/`

## Recommended usage flow

### Prepare a machine

```sh
npx agent-sdd-toolkit machine --agents codex,claude,copilot,cursor,generic
npx agent-sdd-toolkit doctor --agents all --no-run-init
npx agent-sdd-toolkit skills install --agents codex
```

### Create a new project

```sh
mkdir my-project
cd my-project
npx agent-sdd-toolkit new --agents all
```

### Adopt an existing project

```sh
git checkout -b chore/adopt-agent-sdd
npx agent-sdd-toolkit adopt --agents all
./init.sh
```

### Check a repository safely

```sh
npx agent-sdd-toolkit doctor --agents all --no-run-init
npx agent-sdd-toolkit adopt --agents all --dry-run
```

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
- credentials
- tokens
- private keys
- sessions

## SSH workflow

For remote bootstrap:

```sh
ssh devbox
node --version
npm --version
python3 --version
git --version
```

Then on the remote side:

```sh
npx agent-sdd-toolkit machine --agents codex,claude
npx agent-sdd-toolkit doctor --agents codex,claude --no-run-init
```

To copy global non-sensitive assets from local to remote:

```sh
npx agent-sdd-toolkit sync --to devbox --agents codex,claude
```

To export skills for other AI environments:

```sh
npx agent-sdd-toolkit skills export --agents claude,generic,copilot,cursor,windsurf --output ./skills-export
```

## Publish and release flow

Typical release flow:

```sh
npm test
npm run lint
npm run format:check
npm pack --dry-run
npm version patch
git push origin main --follow-tags
```

If GitHub Actions and npm Trusted Publisher are configured, the tag push publishes automatically.

## Local development

```sh
npm install
npm test
npm run lint
npm run format:check
npm pack --dry-run
```

## Notes

- `doctor` is the safest entrypoint for unknown repositories
- `adopt --dry-run` is recommended before touching important repos
- `machine` is intentionally conservative and diagnose-first
- `AGENTS.md` should stay short, universal, and authoritative
