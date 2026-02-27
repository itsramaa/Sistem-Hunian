

# Priority 3: Collections Action Tracker + Priority 4: Payment Verification Dashboard

## Overview

Two enhancements to strengthen financial control:
1. **Collections Action Tracker** -- Add interaction logging (calls, SMS, emails), escalation path visualization, message templates, and resolution tracking to the existing Collections module
2. **Payment Verification Dashboard** -- Enhanced reconciliation page with review workflow, match confidence display, daily/monthly reports, and duplicate/partial payment alerts

---

## Priority 3: Collections Action Tracker & Interaction Log

### 3A: Database -- `collections_interactions` table

New table to log every contact attempt and outcome for a collections case:

```text
collections_interactions
  id                uuid PK DEFAULT gen_random_uuid()
  case_id           uuid FK collections_cases NOT NULL
  merchant_id       uuid FK merchants NOT NULL
  interaction_type  text NOT NULL (call, sms, email, whatsapp, visit, letter)
  direction         text DEFAULT 'outbound' (inbound, outbound)
  outcome           text (answered, no_answer, voicemail, promise_to_pay, refused, escalated)
  notes             text
  contact_person    text
  follow_up_date    timestamptz
  created_by        uuid (auth.uid)
  created_at        timestamptz DEFAULT now()
```

RLS: merchant can CRUD own interactions (via `merchant_id = auth.uid()` through merchant lookup).

### 3B: Enhance Collections Case State Machine

Expand `COLLECTIONS_CASE_TRANSITIONS` to support the full escalation path:

```typescript
export const COLLECTIONS_CASE_TRANSITIONS: Record<string, string[]> = {
  initiated: ['reminder_sent'],
  reminder_sent: ['follow_up', 'in_progress'],
  follow_up: ['in_progress', 'escalated'],
  in_progress: ['escalated', 'resolved'],
  escalated: ['legal', 'resolved'],
  legal: ['resolved'],
  resolved: [],  // terminal -- resolution_type: paid_in_full | payment_plan | write_off | eviction | bad_debt
};
```

### 3C: Collections Interaction Log UI

Create new components in `src/features/collections/components/`:

- **`InteractionLogDialog.tsx`** -- Modal to add a new interaction (type, outcome, notes, follow-up date)
- **`InteractionTimeline.tsx`** -- Chronological timeline of all interactions for a case (styled as vertical timeline with icons per type)
- **`EscalationPathIndicator.tsx`** -- Visual horizontal stepper showing: Reminder (T+3) -> Follow-up (T+7) -> Case (T+15) -> Legal (T+30), highlighting current position

### 3D: Message Templates

Create `src/features/collections/components/templates/`:

- **`CollectionsTemplateSelector.tsx`** -- Dropdown to select template type (SMS reminder, WhatsApp follow-up, Warning letter, Legal notice)
- **`CollectionsTemplatePreview.tsx`** -- Preview with auto-filled placeholders (tenant name, amount, days overdue, invoice number, due date)
- Templates stored as constants in `src/features/collections/constants/messageTemplates.ts` (4 templates: friendly reminder, firm follow-up, warning letter, legal notice)

### 3E: Resolution Tracking Enhancement

Modify `CollectionsCasesList.tsx`:
- Add resolution type options: `paid_in_full`, `payment_plan`, `write_off`, `eviction`, `bad_debt`
- Show resolution dialog when transitioning to `resolved` status
- Add interaction count badge per case row

### 3F: Enhanced Collections Case Detail

Create **`CollectionsCaseDetail.tsx`** -- Expandable detail panel per case showing:
- Case summary (invoice, tenant, amount, days overdue)
- Escalation path indicator
- Interaction timeline
- Quick action buttons: Log Call, Send SMS Template, Send Warning Letter
- Resolution actions

### 3G: Service Layer

Extend `collectionsCaseService.ts`:
- `addInteraction(caseId, data)` -- insert into `collections_interactions`
- `fetchInteractions(caseId)` -- fetch all interactions for a case
- `fetchCaseWithInteractions(caseId)` -- case + interactions + reminder history from `payment_reminders_log`

Create `src/features/collections/hooks/useCollectionsInteractions.ts` with TanStack Query mutations.

---

## Priority 4: Payment Verification Review Dashboard

### 4A: Enhanced Reconciliation Page

Refactor `src/pages/merchant/Reconciliation.tsx` into a tabbed layout:

- **Tab 1: "Perlu Review"** -- Current unmatched payments (existing) + enhanced with match confidence, proof photo preview, duplicate/partial flags
- **Tab 2: "Riwayat Cocok"** -- Match history table (already have `fetchMatchHistory` in service)
- **Tab 3: "Laporan"** -- Daily/monthly reconciliation summary report

### 4B: Enhanced Payment Review Card

Create `src/features/reconciliation/components/PaymentReviewCard.tsx`:
- Side-by-side layout: Payment details (left) | Matched invoice details (right)
- Match confidence bar (color-coded: green >90%, yellow 50-90%, red <50%)
- Proof photo thumbnail (clickable to enlarge) from `proof_photo_url`
- Flags: `duplicate` badge (if another payment with same amount+date+tenant exists), `partial` badge (if amount < invoice total)

### 4C: Reconciliation Report

Create `src/features/reconciliation/components/ReconciliationReport.tsx`:
- Date range picker (daily/weekly/monthly)
- Summary cards: Total received, Total matched, Total unmatched, Match rate %
- Table: All payments in period with match status
- Export-ready layout

### 4D: Duplicate & Partial Payment Detection

Enhance `reconciliationService.ts`:
- `detectDuplicates(merchantId)` -- find payments with same amount, tenant, and paid_at within 24h window
- Add `flags` field to `UnmatchedPayment` type: `duplicate`, `partial`, `overpayment`
- Flag calculation done in `fetchUnmatchedPayments` by comparing payment amount vs suggested invoice amounts

### 4E: Match History with Confidence

Create `src/features/reconciliation/components/MatchHistoryTable.tsx`:
- Table of all matched payments with: payment ref, invoice number, amount, match type (auto/manual), confidence %, date
- Filter by match type, date range
- Uses existing `fetchMatchHistory` service method

### 4F: Reconciliation Hook Enhancement

Extend `useReconciliation.ts`:
- Add `matchHistory` query using `reconciliationService.fetchMatchHistory`
- Add `reconciliationStats` computed from match history (match rate, avg confidence, etc.)

---

## Navigation Updates

No new routes needed -- Priority 3 enhances existing `/merchant/collections` page, Priority 4 enhances existing `/merchant/reconciliation` page.

---

## Files Summary

| Action | File | Description |
|--------|------|-------------|
| CREATE | DB migration | `collections_interactions` table + RLS |
| CREATE | `src/features/collections/components/InteractionLogDialog.tsx` | Log call/SMS/email modal |
| CREATE | `src/features/collections/components/InteractionTimeline.tsx` | Vertical timeline UI |
| CREATE | `src/features/collections/components/EscalationPathIndicator.tsx` | Horizontal stepper |
| CREATE | `src/features/collections/components/templates/CollectionsTemplateSelector.tsx` | Template picker |
| CREATE | `src/features/collections/components/templates/CollectionsTemplatePreview.tsx` | Preview with placeholders |
| CREATE | `src/features/collections/constants/messageTemplates.ts` | 4 message templates |
| CREATE | `src/features/collections/components/cases/CollectionsCaseDetail.tsx` | Expanded case detail |
| CREATE | `src/features/collections/components/cases/ResolutionDialog.tsx` | Resolution type picker |
| CREATE | `src/features/collections/hooks/useCollectionsInteractions.ts` | Interaction CRUD hooks |
| MODIFY | `src/features/collections/services/collectionsCaseService.ts` | Add interaction methods |
| MODIFY | `src/features/collections/components/cases/CollectionsCasesList.tsx` | Add detail expand, interaction count |
| MODIFY | `src/shared/constants/state-machines.ts` | Expand COLLECTIONS_CASE_TRANSITIONS |
| MODIFY | `src/pages/merchant/Collections.tsx` | Enhanced cases tab with detail panel |
| CREATE | `src/features/reconciliation/components/PaymentReviewCard.tsx` | Side-by-side review |
| CREATE | `src/features/reconciliation/components/MatchHistoryTable.tsx` | Match history table |
| CREATE | `src/features/reconciliation/components/ReconciliationReport.tsx` | Daily/monthly report |
| MODIFY | `src/features/reconciliation/services/reconciliationService.ts` | Add duplicate detection, flags |
| MODIFY | `src/features/reconciliation/hooks/useReconciliation.ts` | Add match history query |
| MODIFY | `src/pages/merchant/Reconciliation.tsx` | Tabbed layout with 3 tabs |
| MODIFY | `src/features/reconciliation/components/UnmatchedPaymentsTable.tsx` | Add flags badges, proof preview |
| MODIFY | `old-docs/PMS_Audit_Report_FULL.md` | Mark Priority 3 & 4 as COMPLETE |

---

## Technical Notes

- No new npm packages needed -- all UI built with existing Radix/shadcn components
- `collections_interactions` uses RLS based on `merchant_id` matching merchant ownership
- Message templates are client-side constants (not stored in DB) -- they auto-fill with case data for copy-paste use
- Duplicate detection uses a simple SQL window: same `tenant_user_id` + amount within 24h = flagged
- The expanded escalation path (6 statuses) is backward-compatible -- existing `initiated` and `in_progress` cases remain valid

