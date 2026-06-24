---
alwaysApply: false
description: Root-cause debugging protocol. Use when encountering any error, exception, test failure, unexpected behavior, broken build, or flaky integration — before proposing any fix.
---

# Debugging Protocol

Use the `systematic-debugging` skill for the full root-cause process.

## Iron Law

No fixes without root cause investigation first. If you haven't completed Phase 1, you cannot propose fixes.

## Four-Phase Flow

1. **Understand** — capture exact error, trigger, environment, failing file/endpoint
2. **Hypothesize** — list at least two plausible causes backed by evidence
3. **Test** — run the smallest experiment that confirms or rejects a hypothesis
4. **Fix and Verify** — apply fix, confirm original failure is gone, check regressions

## Circuit Breaker

Stop after three failed attempts on the same path. Summarize evidence and safest next step instead of retrying.

## Plan Format (Major Work)

1. Goal, 2. Approach, 3. Steps, 4. Risks, 5. Definition of Done
For infra/deployment: add 6. Rollback Plan
