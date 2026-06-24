---
alwaysApply: false
description: Handoff and blocker escalation protocol for multi-agent or multi-phase work. Use when completing a phase and passing to another agent or reviewer, or when blocked and need to escalate to the user.
---

# Handoff Protocol

Use this file when work moves from one specialist, phase, or reviewer to another.

## Completion Template

```text
[COMPLETE] Task: <name>
Summary: <what changed>
Files: <paths>
Issue: <issue or tracking reference>
Verification: <commands, URLs, screenshots, or checks>
Known Risks: <gaps, caveats, or none>
Next Action: <owner> <specific next step>
```

## Minimum Handoff Quality

- state exactly what was finished
- include the files or artifacts that matter
- describe how the next person can verify the result
- be explicit about what is not done yet
- give one clear next action

## Blocker Template

```text
[BLOCKER] Owner: <agent or role>
Problem: <what is blocked>
Impact: <what cannot proceed>
Evidence: <error, missing dependency, conflicting requirement>
Options: <safe next choices>
Needed From User: <decision or approval, if required>
```

## Good Example

`POST /auth/login` is ready in `api/auth/`. Verify with `go test ./auth/...` and a manual login request. Known gap: public rate limiting is still missing. Next Action: `frontend-implementer` wire the login form to the endpoint. Issue: `#42`.

## Escalation Path

If a blocker cannot be resolved within the current phase:

1. file it using the Blocker Template above
2. route to the correct owner
3. do not proceed past the blocked step

## Relevant Skills

| Skill                            | When to use                                 |
| -------------------------------- | ------------------------------------------- |
| `finishing-a-development-branch` | completing and integrating development work |
| `requesting-code-review`         | handing off to a reviewer before merge      |

## Anti-Pattern

Do not hand off with vague notes such as `done, please check`.
