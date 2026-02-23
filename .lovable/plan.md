
# Security Requirements Verification (SR-101 to SR-1004)

## Current Status Summary

| Req | Description | Status | Detail |
|-----|-------------|--------|--------|
| **SR-101** | Password policy (8+ chars, complexity, hashing) | Partial | Registration uses 12-char minimum (`strongPasswordSchema`), but some internal forms (AdminSetup, tenant Profile, merchant Settings) use 6-8 char minimums. Hashing handled by Supabase Auth (bcrypt). |
| **SR-102** | Session timeout 30 min | Implemented | `useInactivityLogout` with 30-min timeout and 29-min warning. |
| **SR-103** | 2FA optional but available | Implemented | TOTP-based 2FA via `adminSecurityService` with recovery codes. |
| **SR-104** | Max 5 failed attempts, 15-min lockout | Partial | Client-side lockout exists but uses 3 attempts / 30 seconds instead of 5 attempts / 15 minutes. Client-side only (easily bypassed). |
| **SR-201** | RBAC | Implemented | `user_roles` table, `has_role()` function, `ProtectedRoute` component with 4 roles. |
| **SR-202** | Data-level access (merchant sees own kosan) | Implemented | RLS policies scope data to merchant via `auth.uid()`. |
| **SR-203** | API endpoint protection | Implemented | JWT verification on most edge functions; `verify_jwt = true` default. |
| **SR-204** | JWT token expiry 24h | Platform-managed | Handled by Supabase Auth defaults (1 hour access token + refresh token). |
| **SR-301** | AES-256 at-rest encryption | Platform-managed | Supabase infrastructure encrypts data at rest. |
| **SR-302** | HTTPS/TLS 1.2+ | Platform-managed | All Supabase endpoints enforce HTTPS/TLS. |
| **SR-303** | Column-level encryption | Not implemented | No column-level encryption for PII fields. |
| **SR-304** | API keys in env vars | Implemented | All secrets stored via Supabase secrets (RESEND_API_KEY, XENDIT_SECRET_KEY, etc.). |
| **SR-401** | PII encryption | Partial | UI masking (`maskEmail`, `maskKtpNumber`) exists but no database-level encryption. |
| **SR-402** | PII access logged/audited | Implemented | `audit_logs` table with `createAuditLog()` used across 38+ files. |
| **SR-403** | Anonymization on export | Not implemented | No option to anonymize PII during data export. |
| **SR-404** | GDPR right to access/delete | Not implemented | No self-service data deletion or data download feature. |
| **SR-501-503** | Backup security | Platform-managed | Supabase infrastructure handles encrypted backups. |
| **SR-601** | Rate limiting 1000 req/hr | Not implemented | No server-side rate limiting on edge functions. |
| **SR-602** | CORS whitelist | Not implemented | All functions use `Access-Control-Allow-Origin: '*'`. |
| **SR-603** | API key validation | Implemented | Supabase anon key required on all requests. |
| **SR-604** | Input validation | Implemented | Zod schemas on forms; edge functions validate payloads. |
| **SR-701-703** | DDoS / WAF | Platform-managed | Infrastructure-level concern. |
| **SR-801-803** | GDPR / Indonesia regs / PCI DSS | Partial | Payment references only (no card storage). No formal GDPR or OJK compliance module. |
| **SR-901** | Comprehensive audit log | Implemented | Login, CRUD, report generation, user management all logged via `createAuditLog()`. |
| **SR-902** | Log retention 1 year | Not enforced | No retention policy or cleanup job configured. |
| **SR-903** | Log immutability | Partial | `audit_logs` table exists but no policies preventing DELETE/UPDATE on it. |
| **SR-904** | Restricted log access | Implemented | Admin-only access via `ProtectedRoute allowedRoles={['admin']}`. |
| **SR-1001-1004** | Vulnerability mgmt | Not implemented | Operational processes, outside application scope. |

## Implementation Plan (Actionable Gaps Only)

### Task 1: Standardize Password Policy to Spec (SR-101, SR-104)

**Files to modify:**
- `src/pages/AdminSetup.tsx` - Change `.min(6)` to use `strongPasswordSchema`
- `src/pages/tenant/Profile.tsx` - Change `.min(8)` to use `strongPasswordSchema`
- `src/pages/merchant/Settings.tsx` - Change `.min(8)` / `.min(6)` to use `strongPasswordSchema`
- `src/features/users/utils/vendor-validations.ts` - Change `.min(8)` to `.min(12)` and align with `strongPasswordSchema`

**Login lockout fix (SR-104):**
- `src/features/auth/components/AuthForm.tsx` - Change from 3 attempts / 30 seconds to 5 attempts / 15 minutes (900,000ms)

### Task 2: Export Anonymization Option (SR-403)

**Files to modify:**
- `src/shared/utils/exportUtils.ts` - Add an `anonymize?: boolean` option to `exportToCSV` and `exportToExcel` that replaces PII fields (name, email, phone, KTP) with hashed/masked values before export

### Task 3: Audit Log Immutability (SR-903)

**Database migration:**
- Add RLS policy on `audit_logs` table that blocks DELETE and UPDATE for all roles (including authenticated users)
- Only service_role can insert

```sql
-- Revoke direct delete/update from authenticated users
CREATE POLICY "audit_logs_no_delete" ON public.audit_logs
  FOR DELETE TO authenticated USING (false);

CREATE POLICY "audit_logs_no_update" ON public.audit_logs
  FOR UPDATE TO authenticated USING (false);
```

### Task 4: CORS Whitelist (SR-602)

**Files to modify:**
- Create a shared CORS utility `supabase/functions/_shared/cors.ts` that restricts `Access-Control-Allow-Origin` to approved domains (the preview URL, published URL, and any custom domain)
- Update edge functions to import from the shared utility instead of using `'*'`

### Task 5: GDPR Data Access/Deletion Endpoint (SR-404)

**New edge function:** `supabase/functions/gdpr-data-request/index.ts`
- `GET` - Returns all personal data for the authenticated user (profile, contracts, payments references)
- `DELETE` - Anonymizes/deletes user data and marks account for deletion
- Requires JWT authentication
- Logs the request in `audit_logs`

### Summary of Changes

| File | Action |
|------|--------|
| `src/pages/AdminSetup.tsx` | Modify - use `strongPasswordSchema` |
| `src/pages/tenant/Profile.tsx` | Modify - use `strongPasswordSchema` |
| `src/pages/merchant/Settings.tsx` | Modify - use `strongPasswordSchema` |
| `src/features/users/utils/vendor-validations.ts` | Modify - align password min to 12 chars |
| `src/features/auth/components/AuthForm.tsx` | Modify - 5 attempts / 15-min lockout |
| `src/shared/utils/exportUtils.ts` | Modify - add anonymization option |
| Database migration | Add immutability policies on `audit_logs` |
| `supabase/functions/_shared/cors.ts` | Create - shared CORS whitelist utility |
| Multiple edge functions (54 files) | Modify - import shared CORS (can be done incrementally) |
| `supabase/functions/gdpr-data-request/index.ts` | Create - data access/deletion endpoint |

### Out of Scope (Platform/Operational)

The following are handled by infrastructure or are operational processes, not application code:
- SR-204 (JWT expiry) - Supabase Auth default
- SR-301/302 (encryption at rest / TLS) - Supabase infrastructure
- SR-303 (column-level encryption) - Requires `pgcrypto` extension, skipped per user's previous decision to skip deep DB changes
- SR-501-503 (backup security) - Supabase infrastructure
- SR-701-703 (DDoS/WAF) - CDN/infrastructure level
- SR-902 (log retention) - Requires scheduled cleanup job
- SR-1001-1004 (vulnerability management) - Operational processes
