# Merchant Maintenance Feedback

## Overview
Comprehensive review of Merchant Maintenance Management feature implementation.

## Files Reviewed
- `src/pages/merchant/Maintenance.tsx`
- `src/pages/merchant/MaintenanceDetail.tsx`
- `src/components/maintenance/SLABadge.tsx`
- `src/components/maintenance/UpdateTimeline.tsx`
- `src/components/maintenance/CompletionDialog.tsx`

## Issues & Findings

### Bugs & Errors
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| MNT-B01 | Critical | Vendor job created without checking if vendor accepts category | updateMutation | Validate vendor service_categories match request category | ✅ Fixed |
| MNT-B02 | High | assigned_to stores business_name string, not vendor_id reference | updateMutation | Use assigned_vendor_id FK properly | ✅ Fixed |
| MNT-B03 | High | SLA badge uses type assertion without validation | SLABadge component | Properly type maintenance request | - |
| MNT-B04 | Medium | Duplicate vendor_job created if update called multiple times | updateMutation | Check for existing job before creating | ✅ Fixed |
| MNT-B05 | Medium | Completed status set without completion notes/photos | updateMutation | Require completion details for completed status | ✅ Fixed |

### Validations
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| MNT-V01 | High | Agreed price can be zero or negative | Update dialog | Add min validation for agreed_price | ✅ Fixed |
| MNT-V02 | High | No validation that vendor is verified before assignment | updateMutation | Double-check vendor status server-side | - |
| MNT-V03 | Medium | Status can transition backwards (e.g., completed to pending) | Update dialog | Add status transition rules | ✅ Fixed |

### UX & Flow Pengguna
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| MNT-U01 | High | Update dialog lacks context (photos, history) | Update dialog | Show request details in dialog | ✅ Fixed |
| MNT-U02 | Medium | No priority-based sorting option | Maintenance.tsx | Add sort by priority | - |
| MNT-U03 | Medium | No SLA breach alerts/notifications | Maintenance.tsx | Highlight overdue SLA items | - |
| MNT-U04 | Low | Category displayed but not filterable | Filters | Add category filter | - |

### Performance
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| MNT-P01 | Medium | All verified vendors fetched regardless of category | vendors query | Filter vendors by relevant categories | ✅ Fixed |
| MNT-P02 | Medium | No pagination for request list | requests query | Add pagination | - |
| MNT-P03 | Low | Stats calculated client-side | stats object | Use database aggregation | - |

### Security
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| MNT-S01 | Critical | No merchant ownership verification on updates | updateMutation | Add merchant_id check | - |
| MNT-S02 | High | Any merchant can view verified vendors list | vendors query | Filter to relevant vendors only | - |
| MNT-S03 | Medium | Tenant contact info potentially exposed | Request details | Limit PII visibility | - |

### Consistency & Data Integrity
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| MNT-C01 | High | assigned_to (string) and assigned_vendor_id (FK) not synchronized | updateMutation | Use only FK, derive display name | ✅ Fixed |
| MNT-C02 | High | Vendor job created but request status may not update atomically | updateMutation | Use database transaction | - |
| MNT-C03 | Medium | resolved_at set but completion details not required | updateMutation | Require notes/photos for completion | ✅ Fixed |

### Error Handling & Observability
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| MNT-E01 | High | Vendor job creation failure after request update leaves inconsistent state | updateMutation | Rollback or atomic transaction | - |
| MNT-E02 | Medium | Generic error messages for updates | updateMutation | Provide specific error context | ✅ Fixed |

### Maintainability
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| MNT-M01 | Medium | Status and priority color logic inline | Maintenance.tsx | Extract to shared utility | ✅ Fixed |
| MNT-M02 | Medium | Vendor interface defined locally | Maintenance.tsx | Move to shared types | - |
| MNT-M03 | Low | Magic strings for status values | Multiple | Use enum constants | - |

### Compatibility & Environment
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| MNT-X01 | Low | SLA deadline formatting assumes timezone | SLABadge | Handle timezone properly | - |

## Summary

| Severity | Count | Fixed |
|----------|-------|-------|
| Critical | 2 | 1 |
| High | 10 | 6 |
| Medium | 11 | 5 |
| Low | 4 | 0 |

## Recommended Actions
1. ✅ Fix assigned_vendor_id usage and remove string-based assigned_to
2. Add atomic transaction for request update + vendor job creation
3. ✅ Implement proper status transition validation
4. Add merchant ownership verification via RLS
5. ✅ Require completion details before marking completed
6. ✅ Add category filtering for vendor selection
