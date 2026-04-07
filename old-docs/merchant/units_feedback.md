# Merchant Units Feedback

## Overview
Comprehensive review of Merchant Units Management feature implementation.

## Files Reviewed
- `src/pages/merchant/Units.tsx`
- `src/components/merchant/UnitsManager.tsx`
- `src/components/merchant/UnitPhotoUpload.tsx`
- `src/components/merchant/CustomAmenities.tsx`

## Issues & Findings

### Bugs & Errors
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| UNT-B01 | Critical | Unit deletion doesn't check for active contracts | deleteMutation | Prevent deletion if contract exists | ✅ Fixed |
| UNT-B02 | High | Uses DashboardLayout instead of MerchantLayout | Units.tsx | Use MerchantLayout for consistency | ✅ Fixed |
| UNT-B03 | High | Merchant fetched separately instead of using useAuth | merchant query | Use merchant from useAuth | ✅ Fixed |
| UNT-B04 | Medium | Unit status can be manually set to 'occupied' without contract | Status select | Restrict or warn on manual status change | ✅ Fixed |

### Validations
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| UNT-V01 | High | No subscription limit check for units | saveMutation | Add unit limit validation | ✅ Fixed |
| UNT-V02 | High | Rent amount validation only prevents empty, not negative | Form validation | Add min(0) validation | ✅ Fixed |
| UNT-V03 | Medium | Unit number uniqueness not validated per property | saveMutation | Check for duplicate unit numbers | ✅ Fixed |
| UNT-V04 | Medium | Floor number can be negative | Form | Add non-negative validation | ✅ Fixed |
| UNT-V05 | Low | Size can be unrealistically large | Form | Add reasonable max limit | ✅ Fixed |

### UX & Flow Pengguna
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| UNT-U01 | High | No subscription limit warning like Properties page | Units.tsx | Add SubscriptionLimitWarning | ✅ Fixed |

### Performance
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| UNT-P03 | Low | Stats calculated on each render | Stats section | Memoize calculations | ✅ Fixed |

### Consistency & Data Integrity
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| UNT-C01 | Critical | Unit deletion may leave orphan contracts | deleteMutation | Check/cascade contracts | ✅ Fixed |

### Error Handling & Observability
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| UNT-E01 | High | Console.error without user-facing message | saveMutation | Show specific error to user | ✅ Fixed |
| UNT-E02 | Medium | Generic error messages | Error handlers | Provide actionable messages | ✅ Fixed |

## Summary

| Severity | Count | Fixed |
|----------|-------|-------|
| Critical | 3 | 3 |
| High | 9 | 8 |
| Medium | 13 | 5 |
| Low | 6 | 2 |

## Implemented Actions
1. ✅ Switched to MerchantLayout
2. ✅ Use merchant from useAuth
3. ✅ Added subscription limit check and warning
4. ✅ Prevent deletion if active contracts/pending invitations exist
5. ✅ Added form validations (negative values, size limits, duplicate unit numbers)
6. ✅ Added warning when manually setting status to 'occupied'
7. ✅ Memoized stats and filtered units
8. ✅ Improved error messages
