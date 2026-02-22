
# Maximalisasi Security Architecture Documentation v3.0 (DSS Edition)

## Ringkasan Masalah

Dokumen `security-architecture.md` v1.0 (266 baris) **sepenuhnya tidak sinkron** dengan arsitektur aktual. Ini adalah gap paling kritis dibanding dokumen lainnya karena menyangkut keamanan.

| Aspek | v1.0 (Sekarang) | Implementasi Aktual |
|-------|-----------------|---------------------|
| Auth | Dual JWT (RS256) + Argon2 + Redis | Supabase Auth (JWT + bcrypt) + managed sessions |
| RBAC | 5 roles (Super Admin, Owner, Manager, Surveyor, Tenant) | 7 roles via `app_role` enum (super_admin, admin, moderator, support, merchant, tenant, vendor) |
| Role Storage | Implied inline (no detail) | Separate `user_roles` table + `has_role()` SECURITY DEFINER function |
| Authorization | Middleware route checks | 215+ Row Level Security policies (database-enforced) |
| Infra | AWS VPC + ALB + NestJS + Redis + S3 + WAF | Lovable Cloud (serverless, managed TLS, CDN, no VPC) |
| Password | Argon2id | Supabase Auth managed (bcrypt) |
| ORM | Prisma (parameterized) | Supabase SDK (parameterized) + direct RLS |
| Encryption Keys | AWS KMS / HashiCorp Vault | Lovable Cloud Secrets (encrypted env vars) |
| Document Storage | AWS S3 private bucket | Supabase Storage (5 buckets, 2 private) |
| Admin 2FA | Not mentioned | TOTP via `otpauth` library + `validate-admin-secret` edge function |
| Monitoring | Sentry + Prometheus | Edge function logs + `audit_logs` + `ml_model_runs` tables |
| DSS Security | Not mentioned | 6 DSS tables with 24 RLS policies + immutable `ml_model_runs` audit |

## Rencana Rewrite

Rewrite total menjadi **v3.0** (target ~800-900 baris) yang 100% aligned dengan implementasi aktual dan dokumen v3.0 lainnya.

### Struktur Baru (12 Sections)

1. **Security Principles & Compliance** -- Update compliance mapping ke UU PDP + OWASP + PCI-DSS (Xendit-delegated)
2. **Authentication Architecture** -- Rewrite: Supabase Auth, JWT managed sessions, `onAuthStateChange`, email verification required
3. **Admin 2FA (TOTP)** -- Baru: `validate-admin-secret` edge function, `otpauth` library, recovery codes
4. **Authorization: RBAC + RLS** -- Rewrite total: 7 roles, `user_roles` table, `has_role()` function, 215+ RLS policies with pattern taxonomy
5. **Row Level Security Deep-Dive** -- Baru: 8 access patterns, public/immutable tables, DSS-specific RLS (24 policies), performance optimizations (`(select auth.uid())`)
6. **Data Classification & Protection** -- Update: 4 tiers, Supabase Storage (private/public buckets), Lovable Cloud encryption
7. **Application Security (OWASP)** -- Update: Supabase SDK (no ORM), Zod validation, DOMPurify, CORS edge function headers, prompt injection sanitization for AI
8. **Edge Function Security** -- Baru: CORS headers, JWT verification patterns, webhook HMAC (Xendit), service role isolation, `verify_jwt` config
9. **DSS & AI Security** -- Baru: OCR document handling, ML model audit trail (`ml_model_runs`), prompt injection prevention, confidence score validation, PII in OCR data
10. **Payment Security (PCI)** -- Baru: Xendit delegation, webhook verification (timing-safe HMAC), escrow isolation, no card data stored
11. **Audit Logging & Monitoring** -- Rewrite: `audit_logs` table schema, `ml_model_runs` immutable trail, `chatbot_analytics`, edge function logs, alerting
12. **Incident Response** -- Update: Lovable Cloud context (token revocation via Supabase Auth, edge function re-deploy, secret rotation)

### Detail Perubahan Kunci

**Section 2: Authentication Architecture**
- Auth flow diagram: `Client -> Supabase Auth -> JWT -> onAuthStateChange -> fetchUserData`
- Session management: Supabase-managed refresh tokens (not Redis)
- Signup flow: email verification required, `handle_new_user` trigger auto-creates profile + role + merchant/tenant/vendor
- No password policy control (Supabase Auth managed)
- Rate limiting: platform-managed

**Section 4: RBAC + RLS**
- Role hierarchy diagram with 7 actual roles
- Permission matrix: Admin (full), Merchant (own data via merchant_id JOIN), Tenant (own data via user_id), Vendor (own data via vendor_id JOIN), Public (11 tables)
- `has_role()` function: `SECURITY DEFINER`, `STABLE`, `search_path = 'public'` -- prevents recursive RLS
- `get_user_role()` function for quick role lookup
- Role stored in separate `user_roles` table (NOT on profiles -- prevents privilege escalation)

**Section 5: RLS Deep-Dive**
- 8 access patterns from actual database-schema.md:
  - Admin full access (45+ tables)
  - Merchant own-data (25+ tables via JOIN)
  - Tenant own-data (15+ tables direct)
  - Vendor own-data (8 tables via JOIN)
  - Public read (11 tables)
  - System insert (7 tables, service role)
  - Author-based (4 forum tables)
  - DSS owner-data (6 tables)
- Performance optimization: `(select auth.uid())` cached call pattern
- Immutable tables: `audit_logs`, `ml_model_runs`, `chatbot_analytics`, `cancellation_feedback`
- Policy examples from actual implementation

**Section 8: Edge Function Security**
- CORS headers template (actual headers used)
- `verify_jwt = false` functions and why (4 functions: invitations, bootstrap, subscription-payment)
- Webhook HMAC verification pattern (Xendit)
- Service role key usage (`SUPABASE_SERVICE_ROLE_KEY`)
- No raw SQL execution policy
- Secret management: 9 secrets configured

**Section 9: DSS & AI Security**
- OCR: PII extraction from KTP (NIK, name, address) -- stored in `ocr_results.extracted_data` JSONB
- Document lifecycle: uploaded to private `verification-documents` bucket, RLS-scoped access
- ML audit: `ml_model_runs` immutable table (INSERT + read only, no UPDATE/DELETE)
- Prompt injection: sanitization filter before Gemini API calls
- Confidence validation: High >= 0.85 auto-accepted, Medium 0.60-0.84 manual review, Low < 0.60 rejected
- DSS data isolation: all 6 DSS tables scoped via `merchant_id` RLS

**Section 10: Payment Security**
- Xendit PCI DSS Level 1 delegation
- HMAC webhook verification with `XENDIT_WEBHOOK_TOKEN`
- Idempotency via `xendit_external_id`
- Escrow account isolation per merchant
- No card data stored anywhere in system

### Skills yang Diterapkan

| Skill | Penerapan |
|-------|-----------|
| `security-auditor` | Overall security posture assessment, threat model |
| `api-security-best-practices` | Edge function auth, CORS, input validation |
| `supabase-postgres-best-practices` | RLS patterns, performance optimization, `has_role()` |
| `pci-compliance` | Payment security delegation to Xendit |
| `gdpr-data-handling` | UU PDP compliance, data classification, PII handling |
| `frontend-security-coder` | XSS prevention (DOMPurify), CSP headers |
| `auth-implementation-patterns` | Supabase Auth flow, session management, 2FA |
| `top-100-web-vulnerabilities-reference` | OWASP Top 10 mitigation mapping |
| `broken-authentication-testing` | Auth flow security validation |
| `html-injection-testing` | XSS and injection prevention |
| `security-scanning-security-dependencies` | Dependency audit patterns |
| `security-compliance-compliance-check` | UU PDP + OWASP ASVS compliance |
| `security-requirement-extraction` | NFR security extraction from PRD |
| `prompt-engineering-patterns` | Prompt injection sanitization for DSS |
| `database-design` | UUID PKs, immutable audit tables, JSONB PII |
| `clean-architecture` | Security layer separation in 5-layer model |

### Cross-References

Dokumen ini akan cross-reference ke:
- `database-schema.md` v3.0 -- RLS policies, table definitions, DSS tables
- `backend-architecture.md` v3.0 -- Security architecture section 19, edge functions
- `deployment-infrastructure.md` v3.0 -- Security infrastructure section 11
- `api-specification.md` v3.0 -- Edge function endpoints
- `PRD_DSS_Manajemen_Kosan_v2_Professional.md` v3.0 -- NFR security requirements
- `development-standards.md` v3.0 -- Coding security standards

### Estimasi

Security Architecture v3.0: ~800-900 baris (vs 266 saat ini), dengan konten 100% aligned dengan implementasi aktual, mencakup seluruh aspek keamanan DSS yang sebelumnya tidak ada.
