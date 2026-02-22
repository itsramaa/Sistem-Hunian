

# Deep Dive: DSS Layer Implementation (Database + Edge Functions)

## Audit Summary

Cross-referencing `business-process.md` (Sections 3.22-3.24), `api-specification.md` (Sections 4.10-4.12), `database-schema.md` (Section 12), and `system-architecture.md` (Section 9) against the codebase reveals a **complete absence of the DSS layer**:

- **0 of 6 DSS database tables** exist
- **0 of 12 DSS edge functions** exist
- **0 of 2 DSS cron jobs** exist
- Frontend DSS UI components were created in the previous round but have no backend to connect to

This is too large for a single implementation. This plan covers the **foundational layer**: all 6 database tables + the 4 OCR edge functions (the most critical P0 functions per the PRD).

---

## Phase A: Database Tables (6 tables, 24 RLS policies, 15 indexes)

All 6 DSS tables from `database-schema.md` Section 12 will be created in a single migration.

### Table 1: `ocr_results`
Stores all OCR extraction results (KTP, payment proof, business docs, maintenance receipts).
- 16 columns per schema spec
- Indexes: user_id, document_type, status
- RLS: Users view own; Merchants view via merchant_id; Admins full; System insert/update

### Table 2: `payment_verifications`
OCR-matched payment proofs linked to invoices.
- 16 columns, FK to ocr_results + invoices
- Indexes: invoice_id, status
- RLS: Merchants manage (via merchant_id); Tenants view own; Admins full

### Table 3: `maintenance_expenses`
Cost tracking from receipt OCR, linked to maintenance requests.
- 14 columns, FK to maintenance_requests + ocr_results
- Indexes: request_id, merchant_id
- RLS: Merchants manage (via merchant_id); Admins full

### Table 4: `tenant_risk_scores`
Cached risk scores per tenant, updated daily via cron or on-demand.
- 14 columns, unique constraint on (tenant_user_id, merchant_id)
- Indexes: merchant_id, risk_level, valid_until
- RLS: Merchants view own; Admins full; System insert/update

### Table 5: `dss_recommendations`
AI recommendations with lifecycle tracking (generated, accepted, rejected, measured).
- 16 columns, FK to merchants + ml_model_runs
- Indexes: merchant_id, type, status
- RLS: Merchants manage own; Admins full

### Table 6: `ml_model_runs`
Immutable audit log for all ML/AI predictions. Insert + read only, no updates/deletes.
- 13 columns
- Indexes: function_name, merchant_id, created_at DESC
- RLS: System insert (service role); Merchants view own; Admins full. No update/delete.

---

## Phase B: OCR Edge Functions (4 functions)

These are the highest-impact DSS functions -- they enable document digitization (PRD BG-1: "OCR <3s/document").

### Function 1: `ocr-ktp-extract`
- Downloads KTP image from Supabase Storage `verification-documents` bucket
- Converts to base64, sends to Gemini 2.5 Pro Vision via Lovable AI Gateway
- Uses tool calling for structured output extraction (NIK, name, DOB, gender, address, etc.)
- Stores result in `ocr_results` table
- If confidence >= 80%: auto-populates tenant fields
- If confidence < 80%: flags `requires_review = true`
- Creates `ml_model_runs` audit record
- Tier gate: Professional (10/month), Enterprise (unlimited)

### Function 2: `ocr-payment-proof`
- Downloads payment proof image from Storage
- Gemini extracts: amount, bank name, sender, recipient, date, reference number
- Auto-matches with pending/overdue invoices (amount tolerance +/- Rp 1,000, date within 7 days)
- Creates `ocr_results` + `payment_verifications` records
- If confidence >= 90%: auto-suggest confirmation to merchant
- Tier gate: Basic (5/month), Professional (50/month), Enterprise (unlimited)

### Function 3: `ocr-business-document`
- Supports 4 document types: NIB, SIUP, Akta Pendirian, NPWP
- Downloads from `verification-documents` bucket
- Extracts type-specific fields via Gemini Vision
- Stores in `ocr_results`, auto-populates `merchant_verifications`
- If confidence >= 85%: updates merchant business_name if different
- Tier gate: Professional, Enterprise

### Function 4: `ocr-maintenance-receipt`
- Downloads receipt/nota image from `maintenance-photos` bucket
- Extracts: vendor name, line items, totals, receipt date, receipt number
- Creates `maintenance_expenses` record linked to maintenance_request_id
- Updates maintenance request with actual_cost
- Tier gate: Professional, Enterprise

### Common Pattern (all 4 functions)
```text
1. CORS handling
2. JWT auth -> get user
3. Tier check (query merchant subscription)
4. Download image from Storage -> base64
5. Call Lovable AI Gateway (Gemini 2.5 Pro Vision, tool calling)
6. Parse structured output
7. Insert ocr_results record
8. Insert ml_model_runs audit record
9. Domain-specific side effects (auto-fill, create verification, etc.)
10. Return structured response per API spec
```

---

## Implementation Plan (7 steps)

| # | Action | Type | Details |
|---|--------|------|---------|
| 1 | Create DSS tables migration | DB Migration | 6 tables, 24 RLS policies, 15 indexes, updated_at triggers |
| 2 | Create shared DSS utilities | New file | `supabase/functions/_shared/dss-utils.ts` -- tier checking, ml_model_runs logging, ocr_results creation, Lovable AI call helper |
| 3 | Create `ocr-ktp-extract` | New edge function | Per api-specification.md Section 4.10 |
| 4 | Create `ocr-payment-proof` | New edge function | Per api-specification.md Section 4.10 |
| 5 | Create `ocr-business-document` | New edge function | Per api-specification.md Section 4.10 |
| 6 | Create `ocr-maintenance-receipt` | New edge function | Per api-specification.md Section 4.10 |
| 7 | Add DSS state machine constants | Edit existing | Add `OCR_RESULT_TRANSITIONS`, `PAYMENT_VERIFICATION_TRANSITIONS`, `DSS_RECOMMENDATION_TRANSITIONS` to `state-machines.ts` |

---

## What This Does NOT Cover (Next Rounds)

- ML edge functions (4): `ml-revenue-forecast`, `ml-tenant-risk-score`, `ml-churn-prediction`, `ml-optimal-pricing`
- AI Advisor edge functions (4): `dss-pricing-advisor`, `dss-collection-strategy`, `dss-maintenance-priority`, `dss-investment-insight`
- DSS cron jobs (2): `ml-daily-risk-scoring`, `ml-weekly-forecast`
- Frontend DSS pages and service integration

These will be implemented in subsequent rounds after the database + OCR foundation is in place.

## Technical Notes

- `LOVABLE_API_KEY` is already configured (confirmed via secrets check)
- All edge functions use the same Lovable AI Gateway pattern already proven in `merchant-ai-assistant`
- Gemini 2.5 Pro (multimodal vision) supports image+text input with tool calling for structured extraction
- No new secrets needed
- Database migration creates all 6 tables even though only OCR functions are built now -- ML/AI advisor functions will use these tables when built in the next round
- RLS policies use `has_role()` function already present in the database

