---
name: security-pass
description: Perform a focused security review of code changes, configuration, authentication, authorization, input handling, secrets, logging, dependencies, webhooks, and deployment-sensitive behavior. Use before merge, before release, or when touching auth, payments, APIs, user data, environment variables, or external integrations. Do not use as a replacement for automated security tools.
---

# Security Pass

## Goal

Catch practical security issues before merge or release.

## Review checklist

Inspect for secrets, missing auth or authorization, unsafe input handling, injection, path traversal, insecure uploads, weak webhook validation, overbroad CORS, sensitive logging, token leakage, insecure defaults, supply-chain risks, and error messages exposing internals.

## Rules

1. Focus on exploitable or plausible risks.
2. Do not exaggerate theoretical issues.
3. Mark severity as critical, high, medium, or low.
4. Include file and evidence when possible.
5. Suggest the smallest safe fix.
6. If secrets may be exposed, instruct rotation without printing the secret.

## Exit criteria

The user knows whether the change is safe enough to merge or release.
