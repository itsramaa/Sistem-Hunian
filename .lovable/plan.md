

# 2.1.5 & 2.1.6 — Remaining Implementation

## Analysis

### 2.1.5 UI Hierarchy & Navigation Update
| Item | Status | Action |
|------|--------|--------|
| Sidebar "Properti" as primary link | ✅ COMPLETE | No change |
| Breadcrumb on detail page | ✅ COMPLETE | No change |
| **Occupancy status badge (BAIK/PERHATIAN/KRITIS)** | 🟡 PARTIAL | **Implement** — add badge at top-right of PropertyCard |
| "+N Penyewa" clickable label | ⏭️ SKIP | Property type lacks tenant count data; would require extra query per card. Defer. |
| Revenue mini-indicator | ⏭️ SKIP | Property type has no revenue field; would need join with payments table. Defer. |
| Filter bar redesign | ✅ COMPLETE | No change |

### 2.1.6 Scalability Upgrade
| Item | Status | Action |
|------|--------|--------|
| 5/20/50 properties | ✅ COMPLETE | No change |
| 100+ (server-side search) | ⏭️ SKIP | P2 future work |
| Bulk actions | ✅ COMPLETE | No change |
| Automation readiness | ⏭️ SKIP | Future feature |

## What We're Building

**One change**: Add occupancy status badge (BAIK / PERHATIAN / KRITIS) to the top-right corner of `PropertyCard`, matching the Dashboard design language.

- **≥80%** → green badge "BAIK"
- **50-79%** → yellow badge "PERHATIAN"  
- **<50%** → red badge "KRITIS"

Also add the same badge to `PropertyTable` rows (next to the existing occupancy percentage).

Then update `AUDIT_MENU.md` section 2.1.5 to mark occupancy badge as COMPLETE.

## Files

| File | Action |
|------|--------|
| `src/features/properties/components/PropertyCard.tsx` | Add occupancy status badge at top-right corner |
| `src/features/properties/components/PropertyTable.tsx` | Add occupancy status badge next to occupancy cell |
| `old-docs/AUDIT_MENU.md` | Update 2.1.5 status |

