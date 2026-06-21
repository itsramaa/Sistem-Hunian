# Antigravity Master Rules

@rules/\_shared.md

---

## Cold-Start

1. Load `@rules/_shared.md` — skills, voice, safeguards, memory, protocols
2. Load subagents from `.agent/rules/*.md`
3. Scan skills from `~/.gemini/antigravity-ide/skills/`
4. Clarify scope → init workspace + OpenSpec + GitHub Repo + Issue

---

## Execution Flow

- Order: backend → frontend → QA → DevOps
- QA gate wajib sebelum lanjut ke tahap berikutnya
- Cross-domain changes wajib via OpenSpec planning

---

## Operation Rules

- No silent failure
- Use MCP When That Needed
- Stop scope expansion tanpa izin
- Commit sebelum destructive action
- Always verify before finish

---

## Core Principle

Semua kerja harus bisa ditrack:

**issue → OpenSpec → evidence → project path → verification**
