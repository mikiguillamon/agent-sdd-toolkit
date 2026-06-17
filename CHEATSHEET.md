# agent-sdd-toolkit cheatsheet

## Core idea

- `AGENTS.md` is the source of truth
- adapters point back to `AGENTS.md`
- `init.sh` is the verification gate
- `doctor` is the safest first command

## Main commands

```sh
npx agent-sdd-toolkit machine --agents all
npx agent-sdd-toolkit new my-project --agents all
npx agent-sdd-toolkit adopt --agents all
npx agent-sdd-toolkit doctor --agents all --no-run-init
npx agent-sdd-toolkit repair --agents all
npx agent-sdd-toolkit sync --to devbox --agents codex,claude
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
```

### New project

```sh
mkdir my-project
cd my-project
npx agent-sdd-toolkit new --agents all
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

## What gets created in a repo

- `AGENTS.md`
- `harness.config.json`
- `init.sh`
- `scripts/validate_harness.py`
- `feature_list.json`
- agent-specific adapter files

## What `machine` may create globally

- `~/.agents/skills/sdd-project-bootstrap/SKILL.md`
- `~/.codex/agents/*`
- `~/.codex/config.toml`
- `~/.claude/CLAUDE.md`
- `~/.claude/rules/agent-sdd.md`

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
