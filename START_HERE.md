# agent-sdd-toolkit start here

This guide is for someone starting from zero with:

- a new machine or a partially prepared machine
- a new or active repository
- GitHub as the remote source of truth
- Codex-first usage, while staying compatible with other AI agents

Use this when you want the shortest path from "nothing is set up" to
"the repo is ready and I can start shipping features."

## 1. Prepare your machine

Check the machine first:

```sh
npx agent-sdd-toolkit machine --agents codex,claude
npx agent-sdd-toolkit doctor --agents all --no-run-init
```

Optional but recommended for Codex-heavy workflows:

```sh
npx agent-sdd-toolkit skills install --agents codex
```

What this does:

- prepares machine-global assets such as `~/.agents/...`, `~/.codex/...`, and
  `~/.claude/...`
- does not modify the current repository
- keeps repo-local scaffold separate from machine-global assets

## 2. Create or adopt a repository

For a brand-new repository:

```sh
mkdir my-app
cd my-app
git init -b main
npx agent-sdd-toolkit new . --agents codex,claude
```

For an existing repository:

```sh
cd my-existing-project
git checkout -b chore/adopt-agent-sdd
npx agent-sdd-toolkit adopt --agents codex,claude
```

If the repository is important or unfamiliar, preview first:

```sh
npx agent-sdd-toolkit adopt --agents codex,claude --dry-run
```

## 3. Create and link a GitHub repository

### Option A: with GitHub CLI

If `gh` is installed and authenticated:

```sh
gh auth status
gh repo create my-app --private --source=. --remote=origin --push
```

Use `--public` instead of `--private` if needed.

### Option B: from the GitHub website

1. Create a new empty repository on GitHub.
2. Copy the repository URL.
3. In your local repository, run:

```sh
git remote add origin git@github.com:<user-or-org>/<repo>.git
git branch -M main
git push -u origin main
```

If `origin` already exists, inspect it first:

```sh
git remote -v
```

## 4. Understand what lives in the repo

After `new` or `adopt`, the repository should contain repo-local scaffold such
as:

- `AGENTS.md`
- `CLAUDE.md`
- `.claude/`
- `.specify/`
- `harness.config.json`
- `init.sh`
- `feature_list.json`
- `scripts/validate_harness.py`

It should not keep `.agents/` inside the repository. That directory belongs to
machine-global setup, not to the repo.

## 5. First commands inside a repository

When you open a repository and want to understand its state:

```sh
npx agent-sdd-toolkit doctor --agents all --no-run-init
```

Then read:

- `AGENTS.md`
- `CLAUDE.md` if present
- `feature_list.json`
- `harness.config.json`

This gives you the operating contract, current workflow, and the real commands
used by the project.

## 6. How to work with the agent

You do not need to repeat the full setup every time. In an adopted repo, the
agent should already use:

- `AGENTS.md` as the source of truth
- SDD gates before implementation
- `./init.sh` as the verification gate
- repo-local scaffold before inventing anything

Good prompt patterns:

### Start a new feature

```text
I want to add this feature: [description].
Follow the repo setup. First analyze the context and prepare spec, plan, and
tasks. Do not implement until I approve them.
```

### Implement an approved feature

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

### Improve or refactor carefully

```text
Improve this area: [description].
Use the repo setup, keep scope tight, and do not change unrelated files.
Validate at the end.
```

These prompts can be written in English or Spanish. The important part is being
clear about:

- the goal
- whether you want spec first or implementation directly
- whether the work is a feature, bugfix, review, or refactor
- whether `./init.sh` must be used at the end

## 7. How to think about skills

The skills pack is optional. It is most useful for Codex-first workflows.

Use these commands:

```sh
npx agent-sdd-toolkit skills list
npx agent-sdd-toolkit skills validate
npx agent-sdd-toolkit skills doctor --agents codex,claude
npx agent-sdd-toolkit skills install --agents codex
npx agent-sdd-toolkit skills export --agents claude,generic,cursor --output ./skills-export
```

Practical model:

- `machine` prepares the machine
- `new` or `adopt` prepares the repo
- `skills install` strengthens Codex behavior globally
- `skills export` gives you portable assets for other AI environments

## 8. Normal day-to-day workflow

For each new piece of work:

1. Read the current context.
2. Define the feature or issue clearly.
3. If it is a product change, go through spec, plan, and tasks first.
4. Implement only after approval when the repo follows SDD gates.
5. Run the verification gate:

```sh
./init.sh
```

6. Review the diff.
7. Commit and push.

## 9. Safe habits

- Use `doctor` when entering an unfamiliar repo.
- Use `adopt --dry-run` before changing an important existing project.
- Treat `AGENTS.md` as authoritative.
- Keep `.agents/` out of the repository.
- Use `machine` for global assets and `new` or `adopt` for repo-local assets.
- Run `./init.sh` before closing work.
