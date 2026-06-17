---
name: token-discipline
description: Enforce token-efficient behavior for coding and repository work. Use when the user asks to save tokens, reduce verbosity, inspect code efficiently, avoid unnecessary output, summarize findings, or make narrow changes. Do not use when the user explicitly asks for a long explanation, tutorial, full document, or exhaustive reasoning.
---

# Token Discipline

## Goal

Reduce unnecessary input and output tokens while preserving correctness.

## Operating rules

1. Read narrowly before reading broadly.
2. Prefer filenames, search results, and targeted snippets over full-file reads.
3. Do not paste full files unless explicitly requested or necessary for correctness.
4. Return file paths, line references, diffs, or concise summaries instead of long explanations.
5. Do not repeat context already present in `AGENTS.md`, specs, or previous messages.
6. When multiple files may be relevant, inspect filenames and search results first.
7. Ask at most one clarifying question. If the task is clear enough, proceed.
8. Prefer compact checklists only when they reduce text.
9. Avoid restating obvious setup, imports, or boilerplate.
10. Stop when the answer is actionable.

## Input discipline

Before opening a large file, try targeted search and folder maps first. Avoid dependency and build directories unless they are the subject.

## Output discipline

For implementation tasks, answer with changed files, what changed, verification result, and blockers.

For investigation tasks, answer with likely cause, evidence, and the minimal next step.

## Exit criteria

The response is complete when it gives the smallest useful answer that lets the user act.
