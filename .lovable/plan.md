

# Priority 7: Lease Renewal Automation + Priority 8: Preventive Maintenance Scheduler

## Overview

1. **Lease Renewal Automation** -- Enhance the existing `/merchant/lease-renewals` page with price recommendations, auto-generated amendment drafts, tenant negotiation (offer/counter-offer), and e-signature integration
2. **Preventive Maintenance Scheduler** -- New calendar-based scheduler for recurring tasks (AC service, water tank, etc.) with auto-creation of maintenance requests and cost tracking

---

## Priority 7: Lease Renewal Automation

### Existing Foundation
- `lease_renewal_alerts` table + `RenewalAlertsList` component already shows expiring contracts
- `contract_amendments` table with `draft -> sent -> signed` state machine exists
- `renewalService.ts` has `createAmendment`, `signAmendment` methods
- `SignaturePad` component exists in `src/features/signature/`
- `ml-price-intelligence` edge function returns per-unit price recommendations

### 7A: Database -- Add Negotiation Fields to `contract_amendments`

Add columns to `contract_amendments` to support offer/counter-offer:

```text
ALTER TABLE contract_amendments ADD COLUMN
  tenant_user_id       uuid,           -- tenant involved
  merchant_offer       jsonb,          -- merchant's proposed terms
  tenant_counter_offer jsonb,          -- tenant's counter
  negotiation_status   text DEFAULT 'pending',  -- pending, merchant_proposed, tenant_countered, agreed, rejected
  merchant_signature   text,           -- base64 signature data
  tenant_signature     text,           -- base64 signature data
  tenant_signed_at     timestamptz
```

Update `AMENDMENT_STATUS_TRANSITIONS` to include negotiation states:
```typescript
draft -> sent -> tenant_reviewing -> negotiating -> agreed -> signing -> signed
```

### 7B: Enhanced Renewal Page

Refactor `src/pages/merchant/LeaseRenewals.tsx` into a full-featured page:
- **Stats strip**: Total expiring (30d, 60d, 90d), renewal rate, avg rent increase
- **Renewal list with actions**: Each row gets "Buat Penawaran" button
- **Price recommendation column**: Fetch from `ml-price-intelligence` and show suggested price + % increase per unit
- **Amendment status column**: Show current negotiation state per contract

### 7C: Renewal Offer Dialog

Create `src/features/contracts/components/renewal/RenewalOfferDialog.tsx`:
- Pre-filled with current contract terms
- AI-suggested price shown as recommendation badge
- Merchant can set: new rent, new duration, effective date, terms
- On submit: creates amendment with `status = 'sent'` and `negotiation_status = 'merchant_proposed'`
- Sends notification to tenant

### 7D: Tenant Renewal Response (Tenant Side)

Create `src/features/contracts/components/renewal/TenantRenewalResponse.tsx`:
- Tenant sees merchant's offer with current vs proposed terms
- Three actions: **Accept**, **Counter-Offer**, **Decline**
- Counter-offer allows tenant to propose different rent/terms
- Updates `tenant_counter_offer` and `negotiation_status = 'tenant_countered'`

Create tenant-facing page or section in existing tenant contracts page to show pending renewal offers.

### 7E: Negotiation Timeline

Create `src/features/contracts/components/renewal/NegotiationTimeline.tsx`:
- Shows back-and-forth history: merchant offer -> tenant counter -> merchant revised -> agreed
- Each entry shows proposed terms and timestamp
- Stored in `new_values`/`old_values` JSON fields as history array

### 7F: Amendment E-Signature Flow

Create `src/features/contracts/components/renewal/AmendmentSignatureDialog.tsx`:
- When both parties agree (`negotiation_status = 'agreed'`), enable signing
- Merchant signs first -> `merchant_signature` saved, status -> `signing`
- Tenant signs -> `tenant_signature` saved, `signed_at` set, status -> `signed`
- On `signed`: auto-update contract's `rent_amount`, `end_date` based on amendment `new_values`
- Reuses existing `SignaturePad` component

### 7G: Service Layer Enhancement

Extend `renewalService.ts`:
- `sendOffer(contractId, offer)` -- create amendment with merchant terms
- `submitCounterOffer(amendmentId, counterOffer)` -- tenant counter
- `acceptOffer(amendmentId)` -- set `negotiation_status = 'agreed'`
- `signAsMerchant(amendmentId, signatureData)` -- save merchant signature
- `signAsTenant(amendmentId, signatureData)` -- save tenant signature + apply to contract
- `fetchPriceRecommendation(contractId)` -- get AI suggestion for renewal price

Add hooks in `useLeaseRenewal.ts` for all new mutations.

---

## Priority 8: Preventive Maintenance Scheduler

### 8A: Database -- `preventive_maintenance_schedules` table

```text
preventive_maintenance_schedules
  id                  uuid PK
  merchant_id         uuid FK merchants NOT NULL
  property_id         uuid FK properties
  unit_id             uuid FK units (nullable -- property-wide vs unit-specific)
  title               text NOT NULL
  description         text
  category            text (electrical, plumbing, hvac, cleaning, general)
  frequency           text NOT NULL (weekly, monthly, quarterly, biannual, annual, custom)
  custom_interval_days integer (for custom frequency)
  preferred_vendor_id uuid FK vendors (nullable)
  estimated_cost      numeric
  priority            text DEFAULT 'medium'
  next_scheduled_date date NOT NULL
  last_executed_date  date
  is_active           boolean DEFAULT true
  created_at          timestamptz DEFAULT now()
  updated_at          timestamptz DEFAULT now()
```

RLS: merchant owns their schedules.

### 8B: Scheduler Calendar Page

Create `src/pages/merchant/PreventiveMaintenance.tsx`:
- **Calendar view**: Monthly calendar showing scheduled maintenance events as colored dots/badges
- **List view toggle**: Table of all schedules with next date, frequency, vendor, estimated cost
- **Stats**: Total scheduled, overdue, completed this month, estimated monthly cost
- Add to merchant nav under "Operasional" group with CalendarClock icon

### 8C: Schedule Management Components

Create `src/features/maintenance/components/preventive/`:

- **`PreventiveScheduleForm.tsx`** -- Create/edit form:
  - Title, category, description
  - Property + Unit selector (optional unit for property-wide tasks)
  - Frequency picker (weekly/monthly/quarterly/biannual/annual/custom)
  - Preferred vendor dropdown (from verified vendors)
  - Estimated cost
  - Start date
  - Priority

- **`PreventiveCalendar.tsx`** -- Monthly calendar grid:
  - Days with scheduled tasks show colored dots by category
  - Click day to see/add tasks
  - Navigate months
  - Color legend by category

- **`PreventiveScheduleList.tsx`** -- Table view:
  - Columns: Task, Property/Unit, Frequency, Next Date, Vendor, Est. Cost, Status
  - Overdue items highlighted in red
  - Toggle active/inactive

- **`CostComparisonCard.tsx`** -- Compare preventive vs emergency costs:
  - Preventive: sum of estimated_cost for all active schedules (annualized)
  - Emergency: sum of completed maintenance_requests costs (from vendor_jobs.agreed_price)
  - Show savings estimate

### 8D: Auto-Create Maintenance Request

Create `src/features/maintenance/services/preventiveMaintenanceService.ts`:
- `fetchSchedules(merchantId)` -- all schedules with property/unit/vendor info
- `createSchedule(data)` -- insert new schedule
- `updateSchedule(id, data)` -- edit
- `deleteSchedule(id)` -- soft delete (is_active = false)
- `executeSchedule(scheduleId)` -- creates a `maintenance_request` from the schedule:
  - Copies title, description, category, priority
  - Sets unit_id, merchant_id
  - If preferred_vendor_id set, auto-assigns vendor and sets status to `in_progress`
  - Updates `last_executed_date` to today
  - Calculates and sets `next_scheduled_date` based on frequency
- `getOverdueSchedules(merchantId)` -- schedules where `next_scheduled_date < today` and `is_active = true`
- `getCostComparison(merchantId)` -- aggregate preventive vs emergency costs

### 8E: Hooks

Create `src/features/maintenance/hooks/usePreventiveMaintenance.ts`:
- `usePreventiveSchedules(merchantId)` -- fetch all
- `useCreateSchedule()` -- mutation
- `useUpdateSchedule()` -- mutation
- `useExecuteSchedule()` -- mutation that creates maintenance request
- `useOverdueSchedules(merchantId)` -- query overdue items
- `useCostComparison(merchantId)` -- query cost data

### 8F: Overdue Alert Integration

Add overdue preventive maintenance to the existing `/merchant/alerts` page:
- Query `preventive_maintenance_schedules` where `next_scheduled_date < today`
- Show as alert cards with "Execute Now" button

---

## Navigation & Routes

| Route | Page | Nav Group |
|-------|------|-----------|
| `/merchant/lease-renewals` | Enhanced (existing) | Kontrak (existing) |
| `/merchant/preventive-maintenance` | New | Operasional |

### State Machine Updates

Update `AMENDMENT_STATUS_TRANSITIONS` in `state-machines.ts`:
```typescript
export const AMENDMENT_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['sent', 'cancelled'],
  sent: ['tenant_reviewing', 'rejected', 'cancelled'],
  tenant_reviewing: ['negotiating', 'agreed', 'rejected'],
  negotiating: ['agreed', 'rejected', 'cancelled'],
  agreed: ['signing'],
  signing: ['signed'],
  signed: [],      // terminal
  rejected: [],    // terminal
  cancelled: [],   // terminal
};
```

---

## Files Summary

| Action | File | Description |
|--------|------|-------------|
| CREATE | DB migration | `preventive_maintenance_schedules` table + amendment columns |
| CREATE | `src/features/contracts/components/renewal/RenewalOfferDialog.tsx` | Merchant offer form with AI price suggestion |
| CREATE | `src/features/contracts/components/renewal/TenantRenewalResponse.tsx` | Tenant accept/counter/decline |
| CREATE | `src/features/contracts/components/renewal/NegotiationTimeline.tsx` | Offer history display |
| CREATE | `src/features/contracts/components/renewal/AmendmentSignatureDialog.tsx` | Dual e-signature flow |
| MODIFY | `src/features/contracts/services/renewalService.ts` | Add negotiation + signature methods |
| MODIFY | `src/features/contracts/hooks/useLeaseRenewal.ts` | Add new mutations |
| MODIFY | `src/pages/merchant/LeaseRenewals.tsx` | Full page with stats, recommendations, actions |
| MODIFY | `src/features/contracts/components/renewal/RenewalAlertsList.tsx` | Add action buttons + price column |
| CREATE | `src/features/maintenance/services/preventiveMaintenanceService.ts` | Schedule CRUD + auto-create |
| CREATE | `src/features/maintenance/hooks/usePreventiveMaintenance.ts` | TanStack Query hooks |
| CREATE | `src/features/maintenance/components/preventive/PreventiveScheduleForm.tsx` | Create/edit schedule |
| CREATE | `src/features/maintenance/components/preventive/PreventiveCalendar.tsx` | Calendar view |
| CREATE | `src/features/maintenance/components/preventive/PreventiveScheduleList.tsx` | Table view |
| CREATE | `src/features/maintenance/components/preventive/CostComparisonCard.tsx` | Preventive vs emergency |
| CREATE | `src/pages/merchant/PreventiveMaintenance.tsx` | Scheduler page |
| MODIFY | `src/shared/constants/state-machines.ts` | Expand AMENDMENT_STATUS_TRANSITIONS |
| MODIFY | `src/shared/components/layouts/navigation-config.ts` | Add preventive maintenance nav |
| MODIFY | `src/App.tsx` | Add route |
| MODIFY | `src/pages/merchant/Alerts.tsx` | Add overdue schedule alerts |
| MODIFY | `old-docs/PMS_Audit_Report_FULL.md` | Mark Priority 7 & 8 status |

---

## Technical Notes

- No new npm packages -- calendar built with CSS grid + date-fns
- Negotiation uses existing `contract_amendments` table with new JSON columns for offer/counter-offer
- Price recommendations reuse existing `ml-price-intelligence` edge function
- E-signature reuses existing `SignaturePad` component
- Auto-create from schedule reuses `maintenanceService.createMerchantRequest`
- Frequency calculation: weekly (+7d), monthly (+1mo), quarterly (+3mo), biannual (+6mo), annual (+1yr)
- Cost comparison queries `vendor_jobs.agreed_price` for emergency costs vs `estimated_cost` for preventive

