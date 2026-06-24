---
alwaysApply: false
description: Language-agnostic testing guidance covering TDD, test pyramid, unit, integration, and E2E patterns. Use when writing tests, setting up test infrastructure, debugging flaky tests, or reviewing test coverage across any stack.
---

# Testing

Use these skills for full pattern reference:

| Goal | Skill |
| ---- | ----- |
| TDD red-green-refactor | `test-driven-development` |
| Unit + integration patterns | `testing-patterns` |
| Playwright / Cypress E2E | `e2e-testing-patterns` |
| JS/TS-specific patterns | `javascript-testing-patterns` |
| Python pytest patterns | `python-testing-patterns` (in python.md) |
| Vue component testing | `vue-testing-best-practices` (in vue.md) |

## Project Rules

- test pyramid: unit majority, integration for boundaries, E2E for critical journeys only
- 80%+ coverage on business logic; 100% on auth/payment paths
- flaky tests = P1 bugs — fix or delete, never skip
- mock only external I/O, never the unit under test
- tests must be deterministic — no random data, no uninjected clock

## Stack Defaults

| Stack | Unit | Integration | E2E |
| ----- | ---- | ----------- | --- |
| Go | `testing` + `testify` | `testcontainers-go` | Playwright |
| Python | `pytest` + `pytest-asyncio` | `pytest` + real DB | Playwright |
| Vue / React | `Vitest` + Vue Test Utils / RTL | `Vitest` + MSW | Playwright |
