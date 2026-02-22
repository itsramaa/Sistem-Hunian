

# RLS Denial Alerting + UIUX Doc Continuation

## What This Covers

1. **RLS Denial Alerting System** -- real-time alerts when denial thresholds are exceeded, with configurable settings and admin notifications
2. **UIUX Doc Section 24.4 "In Progress" items** -- the remaining gaps from the implementation checklist

---

## Part 1: RLS Denial Alerting

### 1.1 Database: `rls_alert_settings` table

New table to store admin-configurable alert thresholds:

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| id | uuid PK | gen_random_uuid() | |
| merchant_id | uuid FK nullable | null | null = platform-wide |
| denial_threshold | int | 10 | Denials per window to trigger alert |
| window_minutes | int | 60 | Time window for threshold |
| alert_cooldown_minutes | int | 30 | Min time between alerts |
| last_alert_at | timestamptz | null | Prevents spam |
| is_active | boolean | true | Enable/disable |
| created_at / updated_at | timestamptz | now() | |

RLS: Admin-only CRUD.

### 1.2 Edge Function: Update `log-rls-access`

After inserting a denial, the edge function will:
1. Query `rls_alert_settings` for active configs
2. Count denials in the configured window
3. If threshold exceeded AND cooldown passed:
   - Insert a notification into `notifications` for all admin users
   - Update `last_alert_at`
   - Notification type = `"rls_alert"`, title = "RLS Denial Spike", message includes table name + count + window

### 1.3 Frontend: Alert Settings UI in DSS Health Dashboard

Add a new "Alert Settings" section in the RLS Monitor tab:
- Card with current threshold config
- Edit form (denial threshold, window, cooldown, active toggle)
- Badge showing "Active" / "Paused"
- Last alert timestamp display

### 1.4 Frontend: RLS Alert Type in NotificationsDropdown

Add `rls_alert` case to `getNotificationIcon()` -- renders with `ShieldAlert` icon in red.

---

## Part 2: UIUX Section 24.4 Remaining Items

Per the implementation checklist, these are marked as "In Progress":

### 2.1 OCR Interface Polish (Section 15)

Create `src/features/dss/components/OcrUploadCard.tsx`:
- Drag-and-drop upload zone matching Section 15.1 spec
- Processing state animation (Section 15.2)
- Side-by-side result display using `ExtractedField` + `ConfidenceBadge` (Section 15.3)
- Payment proof match/mismatch indicators (Section 15.5)

### 2.2 Risk Score Dashboard Widgets (Section 16)

Create `src/features/dss/components/RiskDashboardWidgets.tsx`:
- KPI metric cards with trend indicators (Section 16.2) using `TrendingUp`/`TrendingDown`
- Revenue forecast placeholder chart (Section 16.3) -- LineChart with dashed prediction line + confidence area
- Uses `RiskScoreIndicator` component already created

### 2.3 AI Advisor Recommendation List (Section 17)

Create `src/features/dss/components/RecommendationList.tsx`:
- Fetches from `dss_recommendations` table
- Renders `RecommendationCard` for each
- Lifecycle status badges (Section 17.2): generated, viewed, accepted, rejected, measured
- Accept/reject mutations that update status + log via `validateDssStateTransition`
- Advisor type icons (Section 17.3)

### 2.4 Tier-Gated Feature Integration (Section 19)

Create `src/features/dss/hooks/useMerchantTier.ts`:
- Hook that fetches current merchant subscription tier
- Returns `{ tier, canAccess(feature), isLoading }`
- Feature gating matrix from Section 19.4

---

## Implementation Plan (10 Steps)

| # | File | Action |
|---|------|--------|
| 1 | DB Migration | Create `rls_alert_settings` table + RLS + seed default row |
| 2 | `supabase/functions/log-rls-access/index.ts` | Add denial threshold check + admin notification insertion |
| 3 | `src/features/dss/hooks/useRlsAlertSettings.ts` | CRUD hook for alert settings |
| 4 | `src/pages/admin/DssHealth.tsx` | Add Alert Settings section in RLS tab + `rls_alert` icon in notification dropdown |
| 5 | `src/features/notifications/components/NotificationsDropdown.tsx` | Add `rls_alert` icon case |
| 6 | `src/features/dss/components/OcrUploadCard.tsx` | OCR upload + processing + result display component |
| 7 | `src/features/dss/components/RiskDashboardWidgets.tsx` | KPI cards + trend indicators + forecast chart placeholder |
| 8 | `src/features/dss/components/RecommendationList.tsx` | AI recommendations list with accept/reject/defer |
| 9 | `src/features/dss/hooks/useMerchantTier.ts` | Merchant tier check hook + feature gating |
| 10 | `src/features/dss/components/index.ts` | Barrel export for all new DSS components |

## Technical Notes

- The alerting logic runs server-side in the edge function (not client-side) to prevent bypass
- Notifications use the existing `notifications` table + realtime subscription, so alerts appear instantly in the NotificationsDropdown
- All new DSS components follow the exact patterns from the UIUX doc (Sections 15-19)
- No new secrets or external dependencies needed
- The `useMerchantTier` hook queries `merchant_subscriptions` + `subscription_tiers` (already exist)
- OCR components are reusable -- they'll be consumed by future OCR workflow pages
