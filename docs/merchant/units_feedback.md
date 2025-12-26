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
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| UNT-B01 | Critical | Unit deletion doesn't check for active contracts | deleteMutation | Prevent deletion if contract exists |
| UNT-B02 | High | Uses DashboardLayout instead of MerchantLayout | Units.tsx | Use MerchantLayout for consistency |
| UNT-B03 | High | Merchant fetched separately instead of using useAuth | merchant query | Use merchant from useAuth |
| UNT-B04 | Medium | Unit status can be manually set to 'occupied' without contract | Status select | Restrict or warn on manual status change |
| UNT-B05 | Medium | Photos not cleaned from storage on unit deletion | deleteMutation | Clean up storage files |

### Validations
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| UNT-V01 | High | No subscription limit check for units | saveMutation | Add unit limit validation |
| UNT-V02 | High | Rent amount validation only prevents empty, not negative | Form validation | Add min(0) validation |
| UNT-V03 | Medium | Unit number uniqueness not validated per property | saveMutation | Check for duplicate unit numbers |
| UNT-V04 | Medium | Floor number can be negative | Form | Add non-negative validation |
| UNT-V05 | Low | Size can be unrealistically large | Form | Add reasonable max limit |

### UX & Flow Pengguna
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| UNT-U01 | High | No subscription limit warning like Properties page | Units.tsx | Add SubscriptionLimitWarning |
| UNT-U02 | Medium | Dialog form has scroll but long content can be awkward | Add/Edit dialog | Consider expandable sections |
| UNT-U03 | Medium | No bulk unit creation option | Units.tsx | Add bulk add feature |
| UNT-U04 | Low | Unit type dynamically changes based on property | getUnitTypesForProperty | May confuse if switching property |

### Performance
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| UNT-P01 | Medium | Properties fetched first, then units in separate query | Queries | Could combine with proper join |
| UNT-P02 | Medium | No pagination for units table | units query | Add pagination |
| UNT-P03 | Low | Stats calculated on each render | Stats section | Memoize calculations |

### Security
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| UNT-S01 | Critical | No server-side subscription limit validation | saveMutation | Add RLS policy or trigger |
| UNT-S02 | High | Unit ownership only verified via property lookup | Queries | Add direct merchant_id RLS |
| UNT-S03 | Medium | Photos uploaded without content validation | UnitPhotoUpload | Validate image content |

### Consistency & Data Integrity
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| UNT-C01 | Critical | Unit deletion may leave orphan contracts | deleteMutation | Check/cascade contracts |
| UNT-C02 | High | Unit status should sync with contracts | Status management | Auto-update based on contract status |
| UNT-C03 | Medium | Amenities stored as unvalidated array | Form | Use predefined amenity options |
| UNT-C04 | Medium | Unit types hardcoded per property type | getUnitTypesForProperty | Move to configuration |

### Error Handling & Observability
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| UNT-E01 | High | Console.error without user-facing message | saveMutation | Show specific error to user |
| UNT-E02 | Medium | Generic error messages | Error handlers | Provide actionable messages |
| UNT-E03 | Low | No logging for unit operations | Mutations | Add audit logging |

### Maintainability
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| UNT-M01 | High | Large file (653 lines) with mixed concerns | Units.tsx | Split into components |
| UNT-M02 | Medium | Unit interface defined locally | Units.tsx | Move to shared types |
| UNT-M03 | Medium | Form state management using useState (not form library) | Form handling | Use react-hook-form like other pages |
| UNT-M04 | Low | Status colors duplicated from other pages | statusColors | Share across components |

### Compatibility & Environment
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| UNT-X01 | Low | Currency formatting locale hardcoded | formatCurrency | Make configurable |

## Summary

| Severity | Count |
|----------|-------|
| Critical | 3 |
| High | 9 |
| Medium | 13 |
| Low | 6 |

## Recommended Actions
1. Add subscription limit validation (both client and server-side)
2. Prevent unit deletion when active contracts exist
3. Use MerchantLayout instead of DashboardLayout
4. Use merchant from useAuth instead of separate query
5. Implement unit status synchronization with contracts
6. Refactor large component into smaller files
7. Add proper form validation using react-hook-form
8. Clean up storage files on deletion
