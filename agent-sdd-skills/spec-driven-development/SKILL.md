---
name: spec-driven-development
description: Guide product features through Spec Driven Development using AGENTS.md, Spec Kit, specs, tasks, approval gates, and executable verification. Use before implementing product features, when defining requirements, planning tasks, reviewing scope, or enforcing one feature at a time. Do not use for tiny bugfixes unless requirements are unclear.
---

# Spec Driven Development

## Goal

Ensure product changes are specified, reviewed, implemented, tested, and verified in a controlled sequence.

## Source of truth

1. Read `AGENTS.md` first if it exists.
2. Use `.specify/` and `specs/` if present.
3. Use `harness.config.json` and `./init.sh` for verification.
4. Do not invent project commands.

## Required flow

Use this sequence for product features:

```text
idea -> specify -> clarify -> plan -> tasks -> human approval -> implementation -> review -> verification -> merge
```

## Rules

1. Do not implement product code before the spec, plan, and tasks are approved.
2. Keep one feature in progress at a time.
3. Work on a branch named `feature/<feature-id>` unless the user instructs otherwise.
4. Requirements must be testable.
5. Tasks must reference requirements.
6. Designs must state likely files to change, risks, tradeoffs, and verification.
7. Reject scope creep.
8. Run or request `./init.sh` before completion.

## Exit criteria

The feature is ready for implementation only when requirements, design, tasks, risks, and verification are explicit.
