---
alwaysApply: false
description: GitHub issue, branch, PR, and merge workflow. Use when creating issues, branching for features or fixes, opening or reviewing PRs, linking work to issues, or merging changes.
---

# GitHub Workflow

Use the `github` skill for `gh` CLI commands and advanced queries.

## Core Principle

Every meaningful change traceable to an issue, branch, and reviewable PR.

## Branch Naming

- `feature/<issue-number>-short-description`
- `bugfix/<issue-number>-short-description`
- `refactor/<issue-number>-short-description`
- `docs/<issue-number>-short-description`

## PR Rules

- link related issue
- summarize what changed and why
- list verification performed
- never push directly to `main` / `master`
- no force-push shared branches without explicit approval

## Close Issue Only When

- acceptance criteria met
- change merged or accepted
- evidence of completion exists
