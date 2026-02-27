
# Revision Plan: UX Assessment Forensic Audit & Corrections

## Audit Methodology

Verified every claim in the current document (v3.0, 1518 lines) against actual source files: `navigation-config.ts`, `state-machines.ts`, 57 merchant page files, `financialControlService.ts`, `permissions.ts`, `merchantDashboardService.ts`, and 62 edge functions.

## Findings Summary

| Category | Status | Count |
|----------|--------|-------|
| Verified claims (correct) | Pass | ~95% |
| Factual errors (wrong numbers) | Fix needed | 3 |
| Missing features (pages exist, not assessed) | Add needed | 5-9 |
| Unverified assumptions | Flag needed | 4 |
| Missing required sections (per task instructions) | Add needed | 2 |

---

## CORRECTIONS REQUIRED

### 1. Edge Function Count: 65 is Wrong

**Claimed**: "65 edge functions"
**Actual**: 62 edge function directories (excluding `_shared/`)

Verified by listing `supabase/functions/`: 62 function directories + 1 shared helper directory.

**Fix**: Change all instances of "65" to "62".

### 2. "21 Applicable State Machines" is Overstated

**Claimed**: "21 state machines applicable to merchant flows"
**Actual**: 19 explicitly referenced in feature sections. Two additional machines (`SUBSCRIPTION_STATUS_TRANSITIONS`, `PAYMENT_PLAN_STATUS_TRANSITIONS`) are plausible but NOT assessed in any feature section.

**Fix**: Either change to "19" or add Feature sections for Subscription and Payment Plans to justify "21".

### 3. Missing Merchant Features (Pages Exist But Not Assessed)

These merchant pages exist in `src/pages/merchant/` but have no Feature section:

| Page File | What It Does | In Nav? |
|-----------|-------------|---------|
| `Billing.tsx` | Subscription billing dashboard + disbursement settings | No sidebar item, linked from Support/Settings |
| `Profile.tsx` | Business profile management | bottomNav only (line 169) |
| `Settings.tsx` | Account settings | No sidebar item |
| `Support.tsx` | FAQ + help links | No sidebar item |
| `Feedback.tsx` | User feedback submission | No sidebar item |
| `Alerts.tsx` | Notification center | bottomNav only (line 168) |
| `DisputeResolution.tsx` | Dispute handling | No sidebar item |
| `OcrTutorial.tsx` | OCR usage guide | No sidebar item |
| `PropertyCompliance.tsx` | Compliance management | Via PropertyDetail tab |

The document's Section 0 mentions "Account: Profile, billing, settings, support, feedback, referrals" but none have individual Feature assessments. The task requires every feature to be traced.

**Fix**: Add Feature sections (33-37 minimum) for at least: Billing/Subscription, Profile, Alerts, DisputeResolution, and PropertyCompliance. Others (Settings, Support, Feedback, OcrTutorial) can be grouped as "Account & Support Utilities" with a single assessment.

### 4. Referral System: Claimed But No Page Exists

Section 0 lists "referrals" under Account features. Database tables exist (`referrals`, `referral_rewards`, `referral_commissions`). However, NO merchant page file for referrals exists in `src/pages/merchant/`.

**Fix**: Remove "referrals" from merchant CAN DO scope, or flag as:
> Not Defined in Current System Documentation -- database tables exist but no merchant UI page found

### 5. Unverified Assumptions to Flag

These claims in the document cannot be verified from the explored code and should be marked with assumption labels:

| Claim | Location | Issue |
|-------|----------|-------|
| "auto-generate-invoices per contract billing_day" (F14) | Flow table | Trigger mechanism assumed from function name |
| "15+ day overdue to escalated" (F14) | State machine note | Threshold not verified in edge function code |
| "Snapshot-based, stale up to cron interval" (F4) | UX Friction | Cron interval not verified |
| "ensure-user-bootstrap creates profiles, user_roles, merchants, merchant_subscriptions" (F1) | Flow table | Bootstrap output assumed, function code not read |

**Fix**: Add assumption markers per Non-Hallucination Protocol:
> Assumption (Low Confidence): {reason}

### 6. Missing Edge Functions Not Referenced

Several merchant-relevant edge functions are not mentioned in any Feature section:

- `queue-payment-reminders`, `send-payment-reminder` -- related to F14/F15 but not mentioned
- `subscription-billing`, `subscription-grace-check`, `subscription-payment`, `subscription-renewal` -- subscription lifecycle, no Feature section
- `merchant-ai-assistant` -- AI chatbot for merchants, not assessed
- `whatsapp-notification` -- notification channel, not mentioned
- `check-payment-plan` -- payment plan validation, not mentioned
- OCR functions (`ocr-business-document`, `ocr-compliance-document`, `ocr-contract-document`, `ocr-ktp-extract`, `ocr-maintenance-receipt`) -- 5 OCR functions not linked to any feature

**Fix**: Add cross-references in relevant Feature sections or create new sections.

---

## SECTIONS TO ADD (Per Task Requirements)

### 7. Add: Source Traceability Matrix (Step 1 requirement)

The current document has a Feature Ground Truth table but lacks the required format with "Evidence Snippet" and "UX Section Reference" columns.

**Fix**: Add a proper Traceability Matrix after Section 0 with columns:
`| # | Feature Name | Found In (Document + Section) | Evidence Snippet | UX Section Reference |`

### 8. Add: Hallucination Risk Self-Check (Step 3 requirement)

The current Section 6 "System Alignment Verification" partially covers this but doesn't match the required format.

**Fix**: Add or restructure to include:
- Total Features Identified from Documentation: X
- Total Features Analyzed: X  
- Features Without Source Reference: (must be 0)
- Assumptions Used: (list all 4+ flagged assumptions)

---

## VERIFIED CORRECT (No Changes Needed)

- All 31 state machines: transitions match `state-machines.ts` exactly
- All state machine line numbers: verified correct
- All navigation config line numbers: verified correct (lines 111-163)
- `balance: 0` at line 207: verified correct
- `financialControlService.ts` 8 parallel queries: verified correct
- Staff permissions: 16 permissions, 3 roles, 4 groups all match `permissions.ts`
- Default permissions per role: all match actual code
- 57 merchant page files: count verified
- All referenced edge functions exist in `supabase/functions/`
- Escrow exclusion: confirmed correct, 0 merchant escrow references
- Direct Payment Model description: matches `merchantDashboardService.ts`
- InsightsHub 9 sub-pages: verified against page file listing

---

## Implementation Steps

1. Fix edge function count (65 to 62) throughout document
2. Add Source Traceability Matrix with Evidence Snippet column
3. Add Feature sections for uncovered pages (Billing/Subscription, Profile, Alerts, DisputeResolution, PropertyCompliance, Account Utilities)
4. Fix "21 state machines" claim (change to 19 or add missing feature sections)
5. Remove or flag "referrals" in merchant scope
6. Add assumption markers on 4 unverified claims
7. Add missing edge function cross-references
8. Add Hallucination Risk Self-Check section in required format
9. Update feature count from 32 to final number (estimated 37-38)
10. Update Section 7 Final Verdict to reflect corrected counts and new findings
