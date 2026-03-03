

# Phase: State Simplification (1.4) + UI Hierarchy (1.5) + Scalability (1.6) + Optimization (H)

## Assessment of What's Already Done vs Remaining

Most items from these sections are already implemented from P0/P1. Here's what's **actually remaining**:

### Remaining Work

**1. Property scope filtering for ALL dashboard queries (H.4 — the big one)**

Currently `merchantDashboardService.fetchStats()` only filters the `properties` query by `propertyId`. When a property is scoped, financial, tenant, alert, and other data still shows portfolio-wide numbers — misleading.

The DB schema allows scoping via:
- `invoices` → has `property_id` directly
- `contracts` → has `unit_id` → `units.property_id`
- `maintenance_requests` → has `unit_id` → `units.property_id`  
- `payments` → has `contract_id` → `contracts.unit_id` → `units.property_id`
- `payment_transfers` → no property link (portfolio-level only, skip scoping)

**Implementation**: Update `merchantDashboardService.ts` to add property filtering on all queries when `propertyId` is provided. For tables without direct `property_id`, use subqueries via unit_id lookup.

**2. Explicit `dashboardScope` derived state (1.4)**

Add a `dashboardScope` type and derive it from `selectedPropertyId` in `Dashboard.tsx`. This is mostly for code clarity — the actual behavior already works.

**3. Update AUDIT_MENU.md status markers**

Mark sections 1.4, 1.5, 1.6, H with correct status indicators.

---

## Implementation Plan

### Task 1: Scope ALL dashboard queries by property (merchantDashboardService.ts)

When `propertyId` is provided:

```text
Query changes:
- properties: already filtered ✅
- invoices (overdue, unpaid): add .eq('property_id', propertyId)
- contracts (active tenants, expiring, upcoming): add .in('unit_id', subquery units where property_id)
- maintenance_requests (stale): add .in('unit_id', subquery units where property_id)  
- payments (monthly, last month): filter via contract_id → need RPC or join
- payment_transfers: skip scoping (portfolio-level)
```

Since Supabase JS client doesn't support subqueries easily, we'll:
1. First fetch unit IDs for the selected property
2. Then use `.in('unit_id', unitIds)` for contracts and maintenance
3. For payments, use `.in('contract_id', contractIds)` after getting scoped contracts
4. For invoices, use `.eq('property_id', propertyId)` directly

This means when scoped, we do a 2-step fetch: first get unit IDs, then run the main queries. Small latency increase but correct data.

### Task 2: Add dashboardScope derived state (Dashboard.tsx)

Add type and derive from existing state:
```typescript
type DashboardScope = 'ALL_PROPERTIES' | 'SINGLE_PROPERTY';
const dashboardScope: DashboardScope = selectedPropertyId ? 'SINGLE_PROPERTY' : 'ALL_PROPERTIES';
```

Use in scope indicator for cleaner conditional rendering.

### Task 3: Update AUDIT_MENU.md

Update status markers for sections 1.4, 1.5, 1.6, and H with:
- 1.4 items → ✅ COMPLETE (most already done, dashboardScope added)
- 1.5 items → ✅ COMPLETE (header, scope indicator, sidebar relationship all done)
- 1.6 items → ✅ COMPLETE for implemented items, ⏭️ SKIP for bulk/automation (future)
- H.1 → ✅ COMPLETE, H.2 → ✅ COMPLETE, H.3 → ⏭️ SKIP (needs analytics infra), H.4 → ✅ COMPLETE

---

## Files Summary

| File | Action |
|------|--------|
| `src/features/dashboard/services/merchantDashboardService.ts` | EDIT — add property scoping to all queries |
| `src/pages/merchant/Dashboard.tsx` | EDIT — add dashboardScope type, minor cleanup |
| `old-docs/AUDIT_MENU.md` | EDIT — update status markers for 1.4, 1.5, 1.6, H |

No database changes needed. All filtering uses existing columns and relationships.

