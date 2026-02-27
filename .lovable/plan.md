

# Vendor Portal Enhancement + Property Insurance Integration

## Current State Assessment

### Feature 7: Vendor Management & Performance Tracking
- **Merchant side:** COMPLETE -- performance dashboard at `/merchant/vendor-performance` with stats, comparison charts, history, and preferred vendor toggle
- **Vendor portal gaps:** Vendor `Jobs.tsx` already supports accept/start/complete/decline workflow with progress updates and photo uploads. However, missing:
  - Vendor profile page with specialization, service area, rate display (currently only `Profile.tsx` for basic info)
  - Progress notes/updates during in_progress jobs (vendor can only mark complete, no interim updates)

### Feature 8: Property Insurance Integration
- **Already exists:** `insurance_policies` + `insurance_claims` tables, `complianceService.ts` with full CRUD, `InsuranceTab` in `PropertyCompliance.tsx` for policy management with OCR scan
- **Missing:**
  - Renewal reminder system (auto-notify 30/60 days before expiry)
  - Claims management UI (create, track, view claims)
  - Insurance analytics (cost vs. claims ratio, coverage gap analysis)
  - Policy document attachment storage

---

## Implementation Plan

### 7A: Vendor Portal -- Progress Updates

Add progress note submission for in-progress jobs in `src/pages/vendor/Jobs.tsx`:
- When a job is `in_progress`, show a "Tambah Update" button that opens a small form
- Form includes: text note + optional photo upload
- Inserts into `maintenance_timeline` with `actor_role = 'vendor'` and status = 'update'
- This gives merchants visibility into ongoing work without requiring completion

### 7B: Vendor Profile Enhancement

Enhance `src/pages/vendor/Profile.tsx` to display and edit:
- Service categories (already in `vendors` table as `service_categories`)
- Service area / coverage area (text field, store in existing `vendors` columns or add if needed)
- Hourly/job rate (display `agreed_price` average from completed jobs as reference rate)
- Performance stats summary (total jobs, avg rating, completion rate) -- read-only, computed from `vendor_jobs`

### 7C: Update Audit Report for Feature 7

Mark vendor portal enhancements and profile updates as complete. Feature 7 overall remains COMPLETE with portal sub-items now marked.

---

### 8A: Insurance Claims Management UI

Add claims tab/section in `PropertyCompliance.tsx` `InsuranceTab`:
- "Ajukan Klaim" button per active policy
- Claim form: incident date, incident type, description, claim amount, document attachments
- Claims list per policy with status badges (submitted, reviewing, approved, rejected, paid)
- Uses existing `complianceService.fetchClaims()` and `createClaim()`

### 8B: Insurance Renewal Reminders

Create reminder system using existing `lease_renewal_alerts` pattern:
- New service function `checkInsuranceRenewals(merchantId)` that queries policies with `end_date` within 30/60 days
- Display renewal warnings in the InsuranceTab with alert badges
- Add a "Pengingat Asuransi" section on the merchant Dashboard (or as a notification)
- Generate notifications for upcoming expirations via a utility function called on page load

### 8C: Insurance Analytics Card

Create `src/features/compliance/components/InsuranceAnalyticsCard.tsx`:
- Total coverage amount across all active policies
- Total annual premium cost
- Claims ratio: total claimed amount / total premium paid
- Coverage gap warnings (e.g., no fire insurance, no flood insurance for high-risk property)
- Simple bar chart: premiums paid vs claims received by year (using recharts)
- Displayed at top of InsuranceTab or as a separate sub-tab

### 8D: Policy Document Attachment

Enhance InsuranceTab policy form and display:
- Add file upload field for policy document (PDF/image) using existing `verification-documents` bucket
- Store document URL in `coverage_details` JSONB field (add `document_url` key)
- Display download/view link on policy list items

### 8E: Update Audit Report for Feature 8

Mark each sub-item in the audit report with appropriate status.

---

## Files Summary

| Action | File | Description |
|--------|------|-------------|
| MODIFY | `src/pages/vendor/Jobs.tsx` | Add progress note form for in-progress jobs |
| MODIFY | `src/pages/vendor/Profile.tsx` | Show performance stats + service area |
| MODIFY | `src/pages/merchant/PropertyCompliance.tsx` | Add claims UI, renewal warnings, document upload, analytics card |
| CREATE | `src/features/compliance/components/InsuranceAnalyticsCard.tsx` | Premium vs claims analytics with charts |
| CREATE | `src/features/compliance/services/insuranceRenewalService.ts` | Renewal check + notification generation |
| MODIFY | `src/features/compliance/hooks/useCompliance.ts` | Add hooks for claims, renewals |
| MODIFY | `old-docs/PMS_Audit_Report_FULL.md` | Mark Feature 7 portal + Feature 8 status |

## Technical Notes

- No new database tables needed -- `insurance_policies`, `insurance_claims`, and `maintenance_timeline` already exist
- Policy document uploads reuse the existing `verification-documents` storage bucket
- Renewal reminders are client-side computed (query policies where `end_date` between now and now+60 days) since server-side cron scheduling has platform limitations
- Claims UI reuses existing `complianceService.fetchClaims()` and `createClaim()` -- just needs frontend
- Vendor progress updates insert into `maintenance_timeline` which is already displayed in the merchant's maintenance detail view
- Insurance analytics are computed client-side from policies and claims data
