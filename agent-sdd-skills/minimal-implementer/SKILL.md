---
name: minimal-implementer
description: Implement the smallest correct code change for an approved task or clearly scoped bugfix. Use when implementation is allowed and the user wants simple, maintainable, low-risk code. Do not use before approval for product features, for broad refactors, or when requirements are still unclear.
---

# Minimal Implementer

## Goal

Deliver the smallest correct implementation that satisfies the approved scope.

## Preconditions

Before editing code:

1. Confirm the task is approved or clearly scoped.
2. Read `AGENTS.md` if present.
3. Identify the minimal files to touch.
4. Identify the verification command.

## Implementation rules

1. Change as few files as possible.
2. Preserve existing architecture.
3. Do not introduce new abstractions unless they remove clear duplication or risk.
4. Do not add dependencies unless necessary and justified.
5. Do not reformat unrelated files.
6. Do not perform opportunistic refactors.
7. Add or update tests for behavior changes.
8. Keep names explicit and boring.
9. Prefer clear control flow over cleverness.
10. Stop once the requirement is satisfied.

## Exit criteria

Return files changed, behavior changed, tests or verification run, and blockers or follow-ups.
