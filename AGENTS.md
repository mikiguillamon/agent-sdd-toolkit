<!-- SPECKIT START -->

For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan

<!-- SPECKIT END -->

<!-- agent-sdd:agents-contract:start -->

# AGENTS.md

## Source of truth

This file is the source of truth for all AI coding agents working in this
repository.

Agent-specific files such as `CLAUDE.md`,
`.github/copilot-instructions.md`, `.cursor/rules`, `.codex` files, or
other assistant-specific configuration files must point back to this file
and must not contradict it.

## Purpose

This repository uses Spec Driven Development. Agents must inspect before
changing files, preserve existing work, and keep implementation tied to
approved specifications.

## Setup

Use the commands documented in `harness.config.json`. If a command is
Unknown, do not invent it.

## Verification

Run:

```bash
./init.sh
```

before completing implementation work. If it fails, document the exact
blocker.

## SDD workflow

Use this workflow for product features:

```text
idea -> specify -> clarify -> plan -> tasks -> human approval -> implementation -> review -> merge
```

## Human approval gate

Do not implement product code until the spec, plan, and tasks have been
reviewed and approved by the human.

## Git workflow

Use:

```text
main -> feature/<feature-id> -> verification -> review -> merge
```

Never implement product features directly on main.

## Scope control

Do not change unrelated files. Do not refactor opportunistically. Do not
add dependencies without documenting why. Do not invent commands,
architecture, features, or conventions.

## Testing

Every product requirement must map to at least one test, check, or explicit
manual verification step.

## Security

Do not print secrets. Do not commit `.env` files. Do not weaken
authentication, permissions, validation, or logging without explicit
approval.

<!-- agent-sdd:agents-contract:end -->
