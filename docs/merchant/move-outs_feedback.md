# Merchant Move-Outs Feedback

## Overview
Comprehensive review of Merchant Move-Outs Management feature implementation.

## Files Reviewed
- `src/pages/merchant/MoveOuts.tsx`
- `src/components/merchant/MoveOutInspectionForm.tsx`
- `src/components/merchant/ScheduleInspectionDialog.tsx`
- `src/components/merchant/RelistUnitDialog.tsx`
- `src/components/merchant/EarlyTerminationReviewDialog.tsx`
- `src/components/merchant/VacancyDashboard.tsx`

## Issues & Findings

### Bugs & Errors
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| MVO-B01 | Critical | Unit not automatically relisted after move-out completion | MoveOuts.tsx | Trigger unit status update on completion |
| MVO-B02 | High | View Report button has no implementation | upcomingMoveOuts | Implement inspection report view |
| MVO-B03 | High | Inspection query depends on moveOutNotices but can return stale data | inspections query | Add proper query dependency |
| MVO-B04 | Medium | Early termination penalty_amount may be null when displayed | Early term card | Handle null penalty display |
| MVO-B05 | Medium | Tenant profiles query runs even when no notices exist | tenantProfiles query | Improve query enablement logic |

### Validations
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| MVO-V01 | High | No validation that inspection date is before move-out date | ScheduleInspectionDialog | Add date range validation |
| MVO-V02 | High | Early termination approval without deposit refund calculation | EarlyTerminationReviewDialog | Require refund calculation before approval |
| MVO-V03 | Medium | Deduction details can exceed deposit amount | MoveOutInspectionForm | Validate total deductions <= deposit |

### UX & Flow Pengguna
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| MVO-U01 | High | No progress tracker for move-out workflow stages | MoveOuts.tsx | Add visual progress indicator |
| MVO-U02 | Medium | Vacancy tab content not visible in review | VacancyDashboard | Ensure vacancy data is properly loaded |
| MVO-U03 | Medium | No confirmation before completing move-out | MoveOuts.tsx | Add confirmation dialog |
| MVO-U04 | Low | Urgent move-outs (≤7 days) only highlighted by color | getStatusBadge | Add notification/alert for urgent items |

### Performance
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| MVO-P01 | Medium | Multiple sequential queries for related data | MoveOuts.tsx | Combine into fewer queries |
| MVO-P02 | Medium | Inspections fetched separately after notices | inspections query | Join in main query |
| MVO-P03 | Low | No lazy loading for tab content | Tabs | Lazy load inactive tabs |

### Security
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| MVO-S01 | Critical | No merchant ownership verification via RLS | All queries | Add merchant_id filter via RLS |
| MVO-S02 | High | Early termination approval not audited | EarlyTerminationReviewDialog | Add audit log entry |
| MVO-S03 | Medium | Inspector signature stored without verification | MoveOutInspectionForm | Add inspector identity verification |

### Consistency & Data Integrity
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| MVO-C01 | Critical | Move-out completion doesn't update contract status | MoveOuts.tsx | Update contract to terminated/completed |
| MVO-C02 | Critical | Deposit refund not automatically created after inspection | MoveOutInspectionForm | Auto-create deposit_refund record |
| MVO-C03 | High | Early termination approval doesn't trigger deposit refund flow | EarlyTerminationReviewDialog | Initiate deposit processing |
| MVO-C04 | Medium | Notice status updates fragmented across components | Multiple | Centralize status management |

### Error Handling & Observability
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| MVO-E01 | High | Dialog close on error may lose user input | Dialogs | Preserve state on error |
| MVO-E02 | Medium | No loading states in dialogs | ScheduleInspectionDialog | Add loading indicators |

### Maintainability
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| MVO-M01 | High | Complex move-out flow logic spread across components | Multiple | Create centralized move-out service |
| MVO-M02 | Medium | Any type usage for notice and request | MoveOuts.tsx | Define proper TypeScript interfaces |
| MVO-M03 | Low | Days calculation duplicated | Multiple | Extract to utility function |

### Compatibility & Environment
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| MVO-X01 | Low | Date difference calculation doesn't handle timezone | differenceInDays | Use proper timezone handling |

## Summary

| Severity | Count |
|----------|-------|
| Critical | 4 |
| High | 9 |
| Medium | 10 |
| Low | 4 |

## Recommended Actions
1. Implement proper status cascade: move-out → contract → unit
2. Auto-create deposit refund record after inspection completion
3. Add merchant ownership verification via RLS policies
4. Create centralized move-out workflow service
5. Implement inspection report view functionality
6. Add audit logging for approval actions
7. Define proper TypeScript interfaces for all entities
