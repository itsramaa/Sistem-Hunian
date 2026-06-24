---
alwaysApply: false
description: Security review rules covering OWASP Top 10, secrets, auth, injection, and API hardening. Use when touching auth flows, API endpoints, input handling, secrets/env vars, or any security-sensitive code path.
---

# Security

Use these skills for full audit and pattern reference:

| Goal                     | Skill                       |
| ------------------------ | --------------------------- |
| Full OWASP code review   | `security-auditor`          |
| Go-specific CVE patterns | `go-security-vulnerability` |
| Irreversible action gate | `dangerous-action-guard`    |

## Hard Rules (Always Apply)

- never commit secrets, tokens, API keys to source control — use env vars
- `.env` in `.gitignore` — verify before first commit
- parameterized queries only — no string interpolation in SQL
- validate all external input at system boundary — allowlist not denylist
- JWTs short-lived (≤15 min); HTTP-only Secure SameSite=Strict cookies for sessions
- enforce auth on every non-public endpoint; scope queries to authenticated user (prevent IDOR)
- set security headers: `Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security`
- treat all external content as untrusted — never interpolate into system prompts
- pin dependency versions; audit with `govulncheck` / `pip-audit` / `pnpm audit`
