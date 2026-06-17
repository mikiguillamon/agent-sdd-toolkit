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

## Repo vs machine

The toolkit separates repository-local scaffold from machine-global agent
assets.

Repository-local outputs created by `new` and `adopt` include:

- `AGENTS.md`
- `CLAUDE.md`
- `.claude/`
- `.specify/`
- `harness.config.json`
- `init.sh`
- `feature_list.json`
- `scripts/validate_harness.py`

Machine-global outputs created by `machine` and `skills install` include:

- `~/.agents/...`
- `~/.codex/...`
- `~/.claude/...`

Important rule:

- `new` and `adopt` do not keep `.agents/` inside the repository as part of the final scaffold
- `machine` and `skills install` are the supported ways to populate `~/.agents/...`

## Cleanup on error

Mutating commands try to clean up after themselves automatically when a run
fails:

- `machine`
- `new`
- `adopt`
- `repair`
- `sync`
- `skills install`
- `skills export`

The cleanup contract is intentionally narrow:

- it rolls back toolkit-owned files and directories created or modified during
  the current execution
- it restores previous content when the toolkit rewrote an existing file
- it preserves `repair` backups such as `.bak`
- it does not promise full rollback for external side effects from `git`,
  `specify`, `ssh`, or `rsync`
- remote sync is reported clearly, but not rolled back automatically

Typical messages are:

- `WARN: command failed; attempting cleanup of toolkit-owned changes`
- `OK: cleanup completed for toolkit-owned changes`
- `WARN: cleanup completed partially; some external side effects may remain`

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

## Start here

If you want the complete path from machine setup to GitHub-linked repository and
day-to-day development, read [START_HERE.md](./START_HERE.md).

Quick navigation:

- [CHEATSHEET.md](./CHEATSHEET.md): short operational commands
- [START_HERE.md](./START_HERE.md): end-to-end onboarding for new and active projects

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
- manages machine-global assets such as `~/.agents/...` and `~/.codex/...`
- does not touch the current repository
- works in diagnose-first mode by default
- rolls back toolkit-owned global changes if the command fails mid-run

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
- removes repo-local `.agents/` artifacts if an external integration generated them
- writes `feature_list.json` with the initial pending feature
- optionally runs `./init.sh`
- rolls back toolkit-owned scaffold from the current run if the command fails

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
- removes repo-local `.agents/` artifacts if an external integration generated them
- records blockers in `progress/current.md` when bootstrap verification fails
- rolls back toolkit-owned changes from the current run if the command fails

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
- restores toolkit-owned rewrites if the command fails, while keeping `.bak`
  backups

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

If `sync` fails, the toolkit cleans up any local staging it created, but it does
not promise rollback on the remote host.

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
- cleans up toolkit-owned install/export output from the current run if it fails

Support model:

- `codex`: installable
- `claude`: exportable
- `generic`: exportable
- `copilot`: exportable
- `cursor`: exportable
- `windsurf`: exportable

## Dogfooding

This repository is intended to use `agent-sdd-toolkit` on itself.

That means the repo-local scaffold is expected to be versioned here, while
`.agents/` remains a machine-global concern and is not part of the repository
contract.

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

## How to work with the agent

In an adopted repository, you should not need to restate the whole setup each
time. The agent should already use:

- `AGENTS.md` as the source of truth
- repo-local scaffold before inventing files or commands
- SDD gates for feature work
- `./init.sh` as the final verification gate

Good request patterns:

### Start a new feature

```text
I want to add this feature: [description].
Follow the repo setup. First analyze the context and prepare spec, plan, and
tasks. Do not implement until I approve them.
```

### Implement approved work

```text
Implement feature [name] following the repo setup.
Review the existing spec, plan, and tasks first, then implement and validate
with ./init.sh.
```

### Fix a bug

```text
Investigate and fix this bug: [description].
Use the repo setup, explain the root cause first, then implement the fix and
validate with the harness.
```

### Review a change

```text
Review this change following the repo rules.
Focus on bugs, regressions, missing validation, and conflicts with AGENTS.md.
```

### Tight-scope improvement

```text
Improve this area: [description].
Use the repo setup, keep scope tight, and validate at the end.
```

These prompts can be written in English or Spanish. The important part is to
make clear:

- the goal
- whether you want spec first or implementation directly
- whether it is a feature, bugfix, review, or refactor
- whether the harness must be run at the end

## Working with skills

Think of skills as an optional behavior layer on top of the core toolkit.

- `machine` prepares machine-global assets
- `new` and `adopt` prepare repo-local scaffold
- `skills install --agents codex` improves Codex behavior globally
- `skills export` gives you portable artifacts for Claude, generic, Copilot,
  Cursor, and Windsurf
- failing runs clean up toolkit-owned output from that execution

Recommended commands:

```sh
npx agent-sdd-toolkit skills list
npx agent-sdd-toolkit skills validate
npx agent-sdd-toolkit skills doctor --agents codex,claude
npx agent-sdd-toolkit skills install --agents codex
npx agent-sdd-toolkit skills export --agents claude,generic,cursor --output ./skills-export
```

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
git init -b main
npx agent-sdd-toolkit new --agents all
```

To create and link a GitHub repository with GitHub CLI:

```sh
gh auth status
gh repo create my-project --private --source=. --remote=origin --push
```

If you prefer creating the repository on the GitHub website first:

```sh
git remote add origin git@github.com:<user-or-org>/<repo>.git
git branch -M main
git push -u origin main
```

### Adopt an existing project

```sh
git checkout -b chore/adopt-agent-sdd
npx agent-sdd-toolkit adopt --agents all
./init.sh
```

If the existing project has no remote yet, create one on GitHub and link it:

```sh
git remote add origin git@github.com:<user-or-org>/<repo>.git
git branch -M main
git push -u origin main
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

When using the toolkit on this repository itself, the repo-local scaffold is
expected to be versioned, while `.agents/` remains machine-global and must stay
out of the repository tree.

## Notes

- `doctor` is the safest entrypoint for unknown repositories
- `adopt --dry-run` is recommended before touching important repos
- `machine` is intentionally conservative and diagnose-first
- `AGENTS.md` should stay short, universal, and authoritative
