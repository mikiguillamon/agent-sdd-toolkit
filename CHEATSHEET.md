# agent-sdd-toolkit cheatsheet

## Core idea

- `AGENTS.md` is the source of truth
- adapters point back to `AGENTS.md`
- `init.sh` is the verification gate
- `doctor` is the safest first command
- repo-local scaffold stays in the repo
- `.agents/` belongs to the machine, not to the repository

## Main commands

```sh
npx agent-sdd-toolkit machine --agents all
npx agent-sdd-toolkit new my-project --agents all
npx agent-sdd-toolkit adopt --agents all
npx agent-sdd-toolkit doctor --agents all --no-run-init
npx agent-sdd-toolkit repair --agents all
npx agent-sdd-toolkit sync --to devbox --agents codex,claude
npx agent-sdd-toolkit skills list
npx agent-sdd-toolkit skills validate
npx agent-sdd-toolkit skills install --agents codex
npx agent-sdd-toolkit skills export --agents claude,generic --output ./skills-export
```

## Safe first steps

### Unknown repo

```sh
npx agent-sdd-toolkit doctor --agents all --no-run-init
npx agent-sdd-toolkit adopt --agents all --dry-run
```

### New machine

```sh
npx agent-sdd-toolkit machine --agents codex,claude,copilot,cursor,generic
npx agent-sdd-toolkit doctor --agents all --no-run-init
npx agent-sdd-toolkit skills install --agents codex
```

### New project

```sh
mkdir my-project
cd my-project
git init -b main
npx agent-sdd-toolkit new --agents all
```

### Link GitHub

With GitHub CLI:

```sh
gh auth status
gh repo create my-project --private --source=. --remote=origin --push
```

With a repository created on the GitHub website:

```sh
git remote add origin git@github.com:<user-or-org>/<repo>.git
git branch -M main
git push -u origin main
```

### Existing project

```sh
git checkout -b chore/adopt-agent-sdd
npx agent-sdd-toolkit adopt --agents all
./init.sh
```

## Useful flags

- `--agents all`
- `--dry-run`
- `--force`
- `--no-run-init`
- `--to <host>`
- `--output <dir>`

## How to ask the agent

### New feature

```text
I want to add this feature: [description].
Follow the repo setup. First prepare spec, plan, and tasks. Do not implement
until I approve them.
```

### Implement approved work

```text
Implement [feature or task] following the repo setup.
Review the existing context first and validate with ./init.sh at the end.
```

### Bugfix

```text
Investigate and fix this bug: [description].
Explain the root cause first, then implement the fix and validate with the
harness.
```

### Review

```text
Review this change following the repo rules.
Focus on bugs, regressions, and missing validation.
```

### Improvement

```text
Improve this area: [description].
Keep scope tight, follow the repo setup, and validate at the end.
```

These prompts can be in English or Spanish.

## What gets created in a repo

- `AGENTS.md`
- `CLAUDE.md`
- `.claude/`
- `.specify/`
- `harness.config.json`
- `init.sh`
- `scripts/validate_harness.py`
- `feature_list.json`
- agent-specific adapter files

Important:

- `new` and `adopt` do not keep `.agents/` inside the repository

## What `machine` may create globally

- `~/.agents/skills/sdd-project-bootstrap/SKILL.md`
- `~/.codex/agents/*`
- `~/.codex/config.toml`
- `~/.claude/CLAUDE.md`
- `~/.claude/rules/agent-sdd.md`
- `~/.agents/skills/token-discipline/`
- `~/.agents/skills/spec-driven-development/`
- `~/.agents/skills/repo-cartographer/`
- `~/.agents/skills/minimal-implementer/`
- `~/.agents/skills/senior-code-reviewer/`
- `~/.agents/skills/security-pass/`
- `~/.agents/skills/docs-writer/`
- `~/.agents/skills/ux-polish-reviewer/`

## Skills mental model

- `machine`: prepare machine-global agent assets
- `new` or `adopt`: prepare repo-local scaffold
- `skills install --agents codex`: strengthen Codex globally
- `skills export`: prepare portable artifacts for other AI environments

## Release flow

```sh
npm test
npm run lint
npm run format:check
npm pack --dry-run
npm version patch
git push origin main --follow-tags
```

## Mental model

- `machine`: prepare machine
- `new`: bootstrap new repo
- `adopt`: add SDD to existing repo
- `doctor`: inspect and diagnose
- `repair`: fix older setup
- `sync`: copy non-sensitive global assets to remote
- `skills`: list, validate, install, export, and inspect the optional skills pack
