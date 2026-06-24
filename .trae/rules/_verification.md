---
alwaysApply: false
description: Verification checklist before declaring work done. Use before saying "complete", "fixed", "done", or "passing" — must run verification commands and confirm output first.
---

# Verification Protocol

Use the `verification-before-completion` skill for the full gate process.

## Iron Law

No completion claims without fresh verification evidence. Run the command, confirm the output, then claim done.

## Universal Checks

- [ ] change behaves as intended
- [ ] relevant tests or validations were run
- [ ] known regressions were checked
- [ ] blockers and skipped checks are stated explicitly

## Domain Checks

**Backend** — endpoint verified, failure cases handled, auth confirmed, no hardcoded secrets, safe query patterns

**Frontend** — visually checked in browser, responsive reviewed, no console errors, keyboard/ARIA basics covered, no secrets in client bundle

**DevOps** — services start, health checks pass, logs clean, env config correct, rollback documented

**QA** — acceptance criteria mapped to evidence, security checked, no unresolved P0/P1, QA summary written
