---
alwaysApply: false
description: Conventional commit message format and rules. Use when writing commit messages, squashing commits, preparing PR titles, staging changes, or any time git commit is invoked.
scene: git_message
---

# Commit Conventions

Use the `conventional-commits` skill for full format reference.

## Quick Reference

`<type>[scope]: <description> (#<issue-number>)`

Types: `feat | fix | docs | style | refactor | perf | test | build | ci | chore`

## Project-Specific Scopes

- `auth` `api` `db` `ui` `docker` `ci` `steering` `migrations`

## Hard Rules

- imperative mood — `add` not `added`
- subject line under 72 characters
- reference issue when one exists
- breaking change: add `!` and `BREAKING CHANGE:` footer
- no period at end of subject line
