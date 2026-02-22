

# Maximalisasi Testing Strategy Document v3.0 (DSS Edition)

## Ringkasan Masalah

Dokumen `testing-strategy.md` v1.0 (218 baris) **sepenuhnya merujuk stack lama** yang sudah tidak digunakan. Ini adalah dokumen terakhir yang belum di-update ke v3.0.

| Aspek | v1.0 (Sekarang) | Implementasi Aktual (v3.0) |
|-------|-----------------|---------------------------|
| Backend Testing | Pytest (Python) | Deno test runner (edge functions) / Vitest (frontend) |
| Backend Stack | FastAPI + SQLAlchemy | Deno Edge Functions (43 functions) on Lovable Cloud |
| Database Test | Ephemeral DB + SQLite | Lovable Cloud PostgreSQL (Test environment) |
| Mocking Backend | `unittest.mock` + S3/OCR | Supabase SDK mock, Lovable AI mock |
| Mocking Frontend | MSW (Mock Service Worker) | Vitest mocks + potential MSW |
| CI/CD | GitHub Actions + Docker + SonarQube | Lovable Cloud auto-deploy (no CI pipeline) |
| Test Environments | Local/CI/Staging/Prod (Docker Compose) | Test (preview) / Production (published) — 2 environments only |
| Load Testing | k6 on API endpoints | Edge function latency testing via browser tools / curl |
| Security Testing | OWASP ZAP + Snyk | Lovable security scan + RLS policy testing |
| E2E Tool | Playwright (3 browsers) | Browser tools (manual) / Playwright (aspirational) |
| CUJs | 4 journeys (Owner-centric) | 12+ journeys across 4 personas (Merchant, Tenant, Vendor, Admin) |
| OCR Testing | Tesseract/PaddleOCR accuracy | Gemini Vision accuracy via edge function testing |
| ML Testing | Scikit-learn k-fold validation | Gemini Reasoning structured output validation |
| DSS Testing | Not mentioned | 12 DSS edge functions, 6 DSS tables, confidence thresholds |
| Linting | ESLint + Black (Python) | ESLint + TypeScript strict (no Python) |

## Rencana Rewrite

Rewrite total menjadi **v3.0 (DSS Edition)** (~700-850 baris) yang 100% aligned dengan implementasi aktual dan semua dokumen v3.0.

### Struktur Baru (14 Sections)

1. **Introduction** -- Update scope: React SPA + 43 Deno Edge Functions + Lovable Cloud, no Python/FastAPI
2. **Quality Goals & KPIs** -- Align with PRD v3.0 business outcomes, add DSS accuracy targets
3. **Test Architecture (Pyramid)** -- Rewrite: Vitest (unit/integration), Browser Tools (E2E manual), Edge Function Tests (Deno)
4. **Layer 1: Unit Testing** -- Rewrite: Vitest + React Testing Library, target 70% coverage on business logic, hooks, utils; follow `testing-library` skill patterns (getByRole, userEvent.setup(), queryBy for negation)
5. **Layer 2: Integration Testing** -- Rewrite: Vitest + RTL for component interactions, Supabase SDK mocking patterns, TanStack Query wrapper
6. **Layer 3: E2E Testing** -- Rewrite: Browser tools for manual E2E, Playwright as aspirational; reference `e2e-testing-patterns` and `webapp-testing` skills
7. **Edge Function Testing** -- BARU: Testing via `curl_edge_functions` tool, Deno test runner, auth/unauth scenarios, webhook HMAC verification
8. **DSS & AI Testing** -- BARU: OCR accuracy validation (Gemini Vision), ML output validation (structured JSON parsing), confidence threshold testing (>=0.85 auto, 0.60-0.84 review, <0.60 reject), `ml_model_runs` audit trail verification, tier gating tests
9. **Security Testing** -- Rewrite: Lovable security scan tool, RLS policy testing via SQL queries, RBAC role testing, edge function JWT verification, webhook HMAC
10. **Accessibility Testing** -- Update: axe-core patterns, WCAG 2.1 AA, keyboard nav, semantic HTML checks aligned with `accessibility-compliance` skill and UI/UX doc
11. **Performance Testing** -- Rewrite: Lighthouse for CWV (LCP <2s target from system-architecture v3.0), edge function cold start monitoring, database query EXPLAIN
12. **Test Environment & Data** -- Rewrite: 2-environment model (Test/Production) from Lovable Cloud, test data seeding via Supabase SQL, PII masking for NIK/KTP
13. **Critical User Journeys (CUJs)** -- Expand from 4 to 12+ journeys covering all 4 personas and DSS features
14. **Defect Management & Tools Summary** -- Update tools to actual stack, remove Pytest/k6/SonarQube/Docker

### Detail Perubahan Kunci

**Section 3: Test Architecture (Rewrite)**
- Remove Pytest entirely (no Python in project)
- Frontend unit/integration: Vitest + React Testing Library + jsdom
- Edge function testing: Deno test runner + `curl_edge_functions` tool
- E2E: Browser tools (manual, current reality) + Playwright (aspirational/future)
- No CI/CD pipeline -- Lovable Cloud handles build/deploy; tests run on-demand

**Section 4: Unit Testing (Rewrite)**
- Configuration: `vitest.config.ts` with jsdom, `src/test/setup.ts` with `@testing-library/jest-dom`
- Follow `testing-library` skill patterns:
  - Query priority: `getByRole` > `getByLabelText` > `getByText` > `getByTestId`
  - `userEvent.setup()` before interactions (not `fireEvent`)
  - `queryBy` for absence checks, `findBy` for async
  - `waitFor` only for assertions, not side effects
- Target modules: utilities (`formatCurrency`, `passwordStrength`), hooks (`useAuth`, `useTenants`), Zustand stores
- Coverage target: 70% (aligned with development-standards.md section 19)

**Section 7: Edge Function Testing (BARU)**
- Use `curl_edge_functions` tool for live testing
- Deno test runner for unit tests within edge functions
- Test matrix per function:
  - Authenticated vs unauthenticated (JWT)
  - Valid vs invalid payloads (Zod validation)
  - Role-based access (merchant-only, admin-only, etc.)
  - CORS headers in response
- Webhook functions: HMAC signature verification with valid/invalid tokens
- DSS functions: tier gating (403 for insufficient tier), AI response parsing

**Section 8: DSS & AI Testing (BARU)**
- OCR Testing (4 edge functions):
  - Input: sample KTP/receipt images (JPEG/PNG, <10MB)
  - Output: structured JSON with confidence scores
  - Validation: field extraction accuracy (name, NIK, address from KTP)
  - Edge cases: blurry images, rotated documents, partial occlusion
  - Metric: Field Extraction Accuracy >85% (from PRD)
- ML Testing (5 edge functions):
  - Revenue forecasting: MAPE <10%
  - Risk scoring: validate HIGH/MEDIUM/LOW classification
  - Price prediction: compare against historical data
  - Structured output parsing: verify Gemini returns valid JSON
- AI Advisor Testing (4 edge functions):
  - Recommendation quality: human review checklist
  - Prompt injection prevention: test with adversarial inputs
  - Graceful degradation: verify fallback when AI unavailable
- Audit trail: every DSS call creates `ml_model_runs` row (immutable)
- Confidence thresholds: test boundary values (0.59, 0.60, 0.84, 0.85)

**Section 9: Security Testing (Rewrite)**
- Lovable security scan tool (`security--run_security_scan`)
- RLS policy testing:
  - Test each role can only access own data
  - Test admin can access all data
  - Test public tables are readable without auth
  - Test immutable tables (audit_logs, ml_model_runs) reject UPDATE/DELETE
- Auth testing:
  - Email verification required
  - 2FA (TOTP) for admin roles
  - Session expiration
  - Role escalation prevention (user_roles table, not profiles)
- Edge function security:
  - `verify_jwt = true` enforcement
  - CORS headers present
  - Service role key not exposed

**Section 13: CUJs Expanded (12+ journeys)**
- Merchant: Onboarding, Property Setup, Billing Cycle, OCR Digitization, DSS Dashboard
- Tenant: Registration via Invitation, Payment, Maintenance Request, Move-Out
- Vendor: Registration, Product Listing, Order Fulfillment
- Admin: User Management, Dispute Resolution, Platform Config

### Skills yang Diterapkan

| Skill | Penerapan |
|-------|-----------|
| `testing-library` | Query priority, userEvent patterns, async testing, cleanup, MSW |
| `e2e-testing-patterns` | E2E test structure, CUJ mapping, page object patterns |
| `webapp-testing` | Playwright patterns, browser testing, screenshot verification |
| `security-auditor` | RLS testing, auth flow testing, role escalation prevention |
| `api-security-best-practices` | Edge function auth testing, HMAC verification, CORS |
| `accessibility-compliance` | axe-core integration, WCAG 2.1 AA checklist, keyboard nav |
| `performance-engineer` | CWV targets, Lighthouse integration, query optimization |
| `supabase-postgres-best-practices` | RLS policy testing, query EXPLAIN, data seeding |
| `prompt-engineering-patterns` | AI adversarial testing, prompt injection prevention |
| `security-scanning-security-dependencies` | Dependency audit patterns |
| `broken-authentication-testing` | Auth flow security validation |

### Cross-References

- `development-standards.md` v3.0 -- Section 19 (Testing Strategy, test pyramid, naming conventions, DSS testing patterns)
- `backend-architecture.md` v3.0 -- 43 edge functions to test, DSS layer specs
- `database-schema.md` v3.0 -- 72 tables, RLS policies to validate
- `security-architecture.md` v3.0 -- Security testing requirements, RLS deep-dive, RBAC
- `deployment-infrastructure.md` v3.0 -- 2-environment model, no CI/CD pipeline
- `PRD_DSS_Manajemen_Kosan_v2_Professional.md` v3.0 -- Quality targets, CUJs, DSS accuracy metrics
- `UIUX_Design_Documentation_SiHuni.md` v3.0 -- Accessibility standards, responsive design targets

### Estimasi

Testing Strategy v3.0: ~700-850 baris (vs 218 saat ini), dengan konten 100% aligned dengan implementasi aktual (Lovable Cloud, Vitest, Deno, no Python), mencakup DSS/AI testing yang sebelumnya tidak ada, dan CUJs diperluas ke 12+ journeys untuk semua 4 persona.

