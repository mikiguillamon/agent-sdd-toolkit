---
name: repo-cartographer
description: Create and maintain compact repository maps that help agents understand structure, commands, architecture, conventions, and tests without reading the whole codebase. Use during project onboarding, after major restructuring, before adopting SDD, or when context is repeatedly being wasted. Do not use for one-off tiny edits.
---

# Repo Cartographer

## Goal

Create compact documentation that reduces future context usage.

## Files to create or update

Prefer `docs/repo-map.md`, `docs/architecture.md`, `docs/commands.md`, `docs/testing.md`, and `docs/conventions.md` when they add value.

## Inspection strategy

1. Read `AGENTS.md` first if present.
2. Inspect README and package/config files.
3. Identify source directories, test directories, scripts, CI, entrypoints, and generated folders.
4. Use targeted search instead of reading everything.
5. Exclude dependencies, build artifacts, caches, and coverage unless directly relevant.

## Output rules

Keep each document compact and distinguish confirmed facts from assumptions.

## Exit criteria

The repository can be understood by another agent in under two minutes without opening many files.
