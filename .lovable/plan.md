

# Merchant Navigation Audit Report: Depth, Monotony, and Simplification

---

## 1. Current Structure Assessment

### 1.1 Actual Sidebar (from `navigation-config.ts`)

The merchant sidebar currently has **7 clickable items** organized into **6 groups**:

```text
Utama
  Dashboard                    --> standalone page
Manajemen Aset
  Manajemen Aset               --> AssetsHub (3 tabs: Properti, Unit, Staf)
  Penyewa & Okupansi           --> OccupancyHub (3 tabs: Penyewa, Pindah Keluar, Analitik)
Keuangan
  Keuangan                     --> FinanceHub (3 tabs: Tagihan, Pembayaran, Kontrak)
Operasional
  Operasional                  --> OperationsHub (3 tabs: Maintenance, Kepatuhan, Validasi Data)
Wawasan Bisnis
  Wawasan & Data               --> InsightsHub (2-tier: 4 + 5 = 9 tabs)
Bantuan
  Pusat Bantuan                --> HelpHub (3 tabs: Dokumen, OCR, Dukungan)
```

Hidden in user menu (NavUser dropdown): Profile, Billing, Settings.

### 1.2 Documentation vs Reality

The `docs/navigation.md` is **outdated**. It still references:
- `TransactionsHub` (replaced by `FinanceHub` with Contracts merged in)
- `LegalHub` (replaced by `OperationsHub`)
- `AnalyticsHub` and `AiInsightsHub` (replaced by `InsightsHub`)
- Old sidebar structure with 10 items and separate Kontrak/Maintenance/Legal entries

The actual codebase has 7 sidebar items, not 10.

---

## 2. Identified Problems

### Problem 1: "Label Echo" -- Groups with single items

4 out of 6 groups contain only 1 item. The group label and item label are nearly identical:

| Group Label | Item Label | Redundancy |
|---|---|---|
| Keuangan | Keuangan | Exact duplicate |
| Operasional | Operasional | Exact duplicate |
| Wawasan Bisnis | Wawasan & Data | Near duplicate |
| Bantuan | Pusat Bantuan | Near duplicate |

This wastes vertical space and creates visual noise without adding information.

### Problem 2: Tab monotony

Every hub page uses the exact same pattern: `PageHeader` + `TabsList` + `TabsContent`. Six hubs, six identical layouts. The user correctly identifies this as "monoton dan memusingkan" (monotonous and confusing).

When a user clicks any sidebar item, they always land on "yet another tab page." There is no variety in how information is presented, which makes it harder to orient.

### Problem 3: InsightsHub cognitive overload

InsightsHub has 9 tabs split across 2 tiers. The user must:
1. Choose a group (Performa vs Intelijen AI)
2. Choose a tab within the group
3. Interact with the content

This is 3 levels deep from the sidebar click. The two-tier segmented control adds a non-standard interaction that users must learn.

### Problem 4: Unrelated items forced into hubs

Some hubs group things that are not naturally related:
- **HelpHub**: Document Center (file management tool) + OCR Tutorial (one-time learning) + Support (contact). These serve different purposes and audiences.
- **OperationsHub**: Maintenance (reactive, daily workflow) + Compliance (periodic checks) + Data Quality (system validation). Maintenance is high-frequency; the others are low-frequency.

### Problem 5: Orphaned important pages

**Escrow** and **Referrals** exist as standalone routes but are absent from the sidebar. Users can only discover them through direct URLs or Dashboard quick actions.

### Problem 6: Dashboard quick actions point to old routes

`Dashboard.tsx` quick actions still use legacy paths:
- `/merchant/invoices` (redirected to `/merchant/finance#invoices`)
- `/merchant/contracts` (redirected to `/merchant/finance#contracts`)
- `/merchant/reports` (standalone, not redirected)

These work via redirects but add unnecessary HTTP hops.

---

## 3. Proposed New Navigation Structure

The core principle: **direct sidebar links for high-frequency features, contextual discovery for low-frequency features**. Not every module needs a hub. Not every hub needs tabs.

### Proposed Sidebar (flat, no redundant groups)

```text
Dashboard
---
Properti                  --> Properties list page (standalone)
Penyewa                   --> Tenants list page (standalone)
---
Tagihan                   --> Invoices list page (standalone)
Pembayaran                --> Payments list page (standalone)
Kontrak                   --> Contracts list page (standalone)
---
Maintenance               --> Maintenance list page (standalone)
---
Analitik                  --> InsightsHub (kept, but simplified)
```

**What changes:**
- **Flatten high-frequency items**: Properties, Tenants, Invoices, Payments, Contracts, Maintenance each get their own sidebar link. No tabs needed for these -- they are distinct workflows.
- **Remove single-item groups**: Use simple separators instead of named groups.
- **Consolidate AssetsHub**: Units are accessed from within a Property detail page (they always belong to a property). Guardians/Staf become a section within Property detail or a tab on the Properties page only.
- **Dissolve OccupancyHub**: Tenants is standalone. Move-Outs is accessed contextually from Tenant detail or Contract detail. Tenant Analytics moves into the Insights hub.
- **Dissolve FinanceHub**: Each financial entity (Invoices, Payments, Contracts) gets a direct sidebar link. These are distinct enough to warrant their own entry.
- **Dissolve OperationsHub**: Maintenance is standalone (high-frequency). Compliance and Data Quality become cards/sections within the Property detail page (they are property-scoped anyway).
- **Simplify InsightsHub**: Reduce from 9 tabs to a card-based landing page where each analytical tool is a clickable card that navigates to its own page. No tabs.
- **Dissolve HelpHub**: Support goes to the footer/secondary nav (already there via NavSecondary). Documents go into relevant feature pages. OCR Tutorial becomes an in-context tooltip or onboarding guide.

### Where do the dissolved features go?

| Feature | Current Location | Proposed Location |
|---|---|---|
| Units | AssetsHub tab | Property Detail page (tab or section) |
| Guardians/Staf | AssetsHub tab | Property Detail page or Properties page tab |
| Move-Outs | OccupancyHub tab | Accessible from Tenant/Contract detail pages |
| Tenant Analytics | OccupancyHub tab | InsightsHub card |
| Compliance | OperationsHub tab | Property Detail page section |
| Data Quality | OperationsHub tab | Property Detail page section |
| Documents | HelpHub tab | Standalone page linked from navbar or secondary nav |
| OCR Tutorial | HelpHub tab | In-context help within Document Center |
| Support | HelpHub tab | Secondary nav (already exists) |
| Escrow | Hidden route | Accessible from Payments page or Dashboard |
| Referrals | Hidden route | Add to sidebar bottom or user menu |
| Billing | User menu only | Keep in user menu (appropriate) |

---

## 4. UX and Interaction Improvements

### 4.1 Replace tab monotony with diverse patterns

Instead of every page being "tabs", use the right pattern for the right content:

- **List pages** (Properties, Tenants, Invoices, Payments, Contracts, Maintenance): Standard table/card list with filters. Direct sidebar link. No wrapping hub.
- **Detail pages** (Property Detail): Use tabs here -- it makes sense because you are viewing multiple facets of ONE entity (units, compliance, guardians, analytics for that property).
- **InsightsHub landing**: Use a **card grid** layout instead of tabs. Each card shows a preview metric and links to the full analytical page. This creates visual variety and lets users scan at a glance.
- **Contextual actions**: Move-out workflows launch from tenant or contract detail pages as dialogs or side panels, not as standalone tab destinations.

### 4.2 Progressive disclosure

- **Properties page** shows the property list. Clicking a property reveals its units, compliance status, and staff -- all in context.
- **Tenants page** shows the tenant list. From a tenant row, you can see their contracts, payments, and move-out status.
- **InsightsHub** shows KPI summary cards. Only when a user clicks a card do they enter the detailed analytical view.

### 4.3 Improve InsightsHub specifically

Current: 2-tier segmented control with 9 tabs.

Proposed: **Card-based dashboard** with 2 sections:

```text
Performa
  [Revenue Overview card]  [Reports card]  [Portfolio card]

Intelijen AI
  [Predictions card]  [Strategy card]  [Market card]  [Risk card]  [Tenant Score card]
```

Each card shows a headline metric and a "View Details" link to the full page. No tabs. Users see everything at a glance and choose what to drill into.

---

## 5. Risk Analysis

| Change | Risk | Mitigation |
|---|---|---|
| Dissolving hubs | Users who learned the tab pattern must re-learn | Redirects from old paths; announcement banner |
| Moving Units into Property Detail | Users who manage units across properties lose the cross-property view | Keep `/merchant/units` as a standalone fallback route |
| Moving Compliance/Data Quality into Property Detail | Less visible for periodic checks | Dashboard can surface compliance alerts |
| Removing HelpHub | Users lose a centralized help location | Support is already in secondary nav; documents get their own route |
| Flattening sidebar to ~9 items | Slightly more sidebar items than current 7 | Still under the 10-item cognitive limit; each item is now immediately understandable |

---

## 6. Documentation Update Required

The `docs/navigation.md` must be rewritten to reflect the actual codebase. Current discrepancies:
- References `TransactionsHub`, `LegalHub`, `AnalyticsHub`, `AiInsightsHub` -- all deleted
- Shows 10 sidebar items across 6 groups -- actual is 7 items
- Missing `FinanceHub`, `OperationsHub`, `InsightsHub`
- Missing redirect routes in App.tsx
- Missing secondary nav items (Support, Feedback in NavSecondary)
- Missing user menu items (Profile, Billing, Settings in NavUser)

---

## 7. Implementation Summary

### Phase A: Flatten the sidebar (low risk, high impact)
- Remove redundant single-item groups
- Promote Properti, Penyewa, Tagihan, Pembayaran, Kontrak, Maintenance to direct sidebar items
- Keep InsightsHub but redesign as card-based landing

### Phase B: Dissolve low-value hubs (medium risk)
- Move Units and Guardians into Property Detail as tabs
- Move Move-Outs and Tenant Analytics into contextual locations
- Move Compliance and Data Quality into Property Detail
- Dissolve HelpHub; relocate its contents

### Phase C: Redesign InsightsHub (medium effort)
- Replace 9-tab 2-tier system with card grid landing page
- Each card links to a standalone analytical page
- Remove segmented control

### Phase D: Update documentation
- Rewrite `docs/navigation.md` to match actual structure

### Priority order: A then D then C then B.

Phase A alone would dramatically reduce the "everything is tabs" monotony and make the sidebar immediately understandable. Phase D ensures documentation stays useful. Phase C addresses the worst offender (9 tabs). Phase B is the most invasive and can be done incrementally.

