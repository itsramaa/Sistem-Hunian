---
alwaysApply: false
description: Skill-first workflow discipline and master skill index. Use at session start, when the user says "use skills" or "follow the workflow", or before any non-trivial task to check which skill applies first.
---

# Skill-First Workflow Discipline

## The Rule

Check whether a relevant process skill applies before starting implementation or investigation. If one does, follow it.

## Available Process Skills

| Skill                            | Purpose                                               |
| -------------------------------- | ----------------------------------------------------- |
| `brainstorming`                  | interactive design refinement before implementation   |
| `test-driven-development`        | red-green-refactor cycle                              |
| `systematic-debugging`           | 4-phase root-cause process                            |
| `writing-plans`                  | detailed implementation plans (non-OpenSpec projects) |
| `requesting-code-review`         | dispatch code reviewer before merge                   |
| `receiving-code-review`          | respond to review feedback with technical rigor       |
| `verification-before-completion` | ensure fixes actually work before claiming done       |
| `using-git-worktrees`            | isolated workspace for feature branches               |
| `finishing-a-development-branch` | merge or PR decision workflow                         |
| `conventional-commits`           | structured commit messages                            |
| `security-auditor`               | OWASP Top 10 and security review patterns             |
| `architecture-designer`          | system design, ADRs, scalability planning             |
| `ui-ux-pro-max`                  | design intelligence + searchable UI/UX database       |

## OpenSpec Skills (Spec-First Workflow)

| Skill                   | Purpose                                     |
| ----------------------- | ------------------------------------------- |
| `openspec-explore`      | clarify ideas before committing to a change |
| `openspec-new`          | create change folder + scaffold             |
| `openspec-ff`           | fast-forward all artifacts at once          |
| `openspec-continue`     | create artifacts one at a time              |
| `openspec-apply`        | implement tasks from task list              |
| `openspec-verify`       | validate implementation vs spec             |
| `openspec-sync`         | merge delta specs to main mid-change        |
| `openspec-archive`      | finalize and archive completed change       |
| `openspec-bulk-archive` | archive multiple changes at once            |
| `openspec-config`       | project/global CLI config                   |
| `openspec-schema`       | custom workflow schemas                     |
| `openspec-onboard`      | guided tutorial for new users               |
| `openspec-install`      | install OpenSpec CLI                        |
| `openspec-initial`      | init OpenSpec in a project                  |
| `openspec-update`       | regenerate AI tool files after upgrade      |

## Common Flows

| Trigger                   | Flow                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------- |
| "Build feature X"         | brainstorming → openspec-new/ff → openspec-apply → openspec-verify → openspec-archive |
| "Fix bug Y"               | systematic-debugging → fix → verification-before-completion                           |
| "System design / ADR"     | architecture-designer → excalidraw → openspec-new                                     |
| "Design UI/UX"            | ui-ux-pro-max → brainstorming → openspec-new/ff → openspec-apply                      |
| "Review code"             | requesting-code-review → receiving-code-review                                        |
| "Write tests"             | test-driven-development → testing-patterns or e2e-testing-patterns                    |
| "Commit / PR"             | conventional-commits → github → finishing-a-development-branch                        |
| "Deploy"                  | use-railway → finishing-a-development-branch                                          |
| "Document"                | codebase-documenter → project-documentation                                           |
| "Prompt/instruction work" | prompt-engineering-expert → humanizer                                                 |
| "Buat skill baru"         | writing-skills                                                                        |

## Skill Priority

1. process skills first — determine the approach
2. OpenSpec skills second — spec-first planning
3. implementation skills third — guide execution

## Skill Types

- rigid (TDD, systematic-debugging, openspec-\*): follow exactly
- flexible (patterns, architecture-designer): adapt to context

## Rationalization Red Flags

- `this is too simple for a skill`
- `I already know this skill`
- `let me explore the codebase first`
- `the skill is overkill`
- `I will just do this one thing first`

When any of these appear, pause and check the relevant skill instead.

## User Instructions

User instructions describe what to do, not how. Requests such as `add X` or `fix Y` do not override disciplined workflows.
