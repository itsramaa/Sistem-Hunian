

# Implement Remaining 2.1.5 & 2.1.6 Items

## What We're Building

5 items previously marked as SKIP, now implementing:

1. **"+N Penyewa" clickable label** on PropertyCard and PropertyTable
2. **Revenue mini-indicator** on PropertyCard and PropertyTable
3. **100+ server-side search** for properties
4. **Automation readiness** column in table view
5. **Occupancy badge** — already complete, no changes needed

## Approach

### Database: Enhanced View with Tenant Count & Revenue

Create a new migration to update `v_properties_with_addresses` view, adding two computed columns via lateral joins:
- `active_tenant_count` — COUNT(DISTINCT tenant_user_id) from active contracts via units
- `monthly_revenue` — SUM(payments.amount) for current month where status='paid', joined via contracts → units

This avoids N+1 queries — all data comes in one fetch.

### Server-Side Search (RPC function)

Create a database function `search_properties_server` that accepts:
- `p_merchant_id uuid`
- `p_search text` (ILIKE on name, city, property_code)
- `p_type text` (filter)
- `p_status text` (filter)
- `p_sort text` (sort option)
- `p_limit int`, `p_offset int`

Returns properties with tenant_count and monthly_revenue. Only used when property count >= 100 (detected client-side). For <100 properties, keep current client-side filtering.

### UI Changes

**PropertyCard**:
- Add "+N Penyewa" label below occupancy bar (clickable → navigates to property detail Penyewa tab)
- Add revenue mini-indicator (compact format like "Rp 1.2M/bln") at bottom-right

**PropertyTable**:
- Add "Penyewa" column showing tenant count
- Add "Pendapatan" column showing monthly revenue (compact)
- Add "Otomasi" column showing placeholder "—" with tooltip "Segera hadir" (automation readiness)

**Property type**:
- Add optional `active_tenant_count?: number` and `monthly_revenue?: number` fields

**propertyService.fetchProperties**:
- Update to read `active_tenant_count` and `monthly_revenue` from the enhanced view

**Properties.tsx**:
- When `properties.length >= 100`, switch to server-side search mode using the RPC function
- Debounced search triggers server call instead of client filter

### AUDIT_MENU.md
- Mark all 5 items with appropriate status

## Files

| File | Action |
|------|--------|
| **Migration** | Update `v_properties_with_addresses` view with tenant_count & monthly_revenue; Create `search_properties_server` RPC |
| `src/features/properties/types/index.ts` | Add `active_tenant_count?` and `monthly_revenue?` to Property type |
| `src/features/properties/services/propertyService.ts` | Map new view fields; add `searchPropertiesServer` method |
| `src/features/properties/components/PropertyCard.tsx` | Add tenant label + revenue indicator |
| `src/features/properties/components/PropertyTable.tsx` | Add Penyewa, Pendapatan, Otomasi columns |
| `src/pages/merchant/Properties.tsx` | Add server-side search fallback for 100+ properties |
| `old-docs/AUDIT_MENU.md` | Update 2.1.5 and 2.1.6 statuses |

