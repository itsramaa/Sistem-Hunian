# Merchant Properties Feedback

## Overview
Comprehensive review of Merchant Properties Management feature implementation.

## Files Reviewed
- `src/pages/merchant/Properties.tsx`
- `src/components/merchant/LocationPicker.tsx`
- `src/components/merchant/ProvincesCitiesSelect.tsx`
- `src/components/merchant/CustomAmenities.tsx`
- `src/components/merchant/UnitPhotoUpload.tsx`

## Issues & Findings

### Bugs & Errors
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| PRP-B01 | High | Property deletion doesn't check for active contracts | handleDelete | Verify no active contracts before delete |
| PRP-B02 | High | Property deletion uses confirm() which can be blocked | handleDelete | Use custom confirmation dialog |
| PRP-B03 | Medium | Images not cleaned up from storage on property deletion | handleDelete | Delete associated storage files |
| PRP-B04 | Medium | useEffect fetches on merchant change but may cause stale state | useEffect | Use React Query instead |
| PRP-B05 | Low | Province/city selection resets city when province changes | ProvincesCitiesSelect | Preserve if valid for new province |

### Validations
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| PRP-V01 | High | Postal code validation too loose (max 10 chars only) | propertySchema | Add format validation |
| PRP-V02 | Medium | Address minimum length too short (5 chars) | propertySchema | Consider more meaningful minimum |
| PRP-V03 | Medium | No validation for image file types in form | UnitPhotoUpload | Validate image formats |
| PRP-V04 | Low | Description has max 1000 chars but UI doesn't show counter | Form | Add character counter |

### UX & Flow Pengguna
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| PRP-U01 | High | Subscription limit check only on button, not in form | Add Property button | Show limit warning before opening form |
| PRP-U02 | Medium | Large form in dialog (many fields) | Add/Edit dialog | Consider multi-step wizard |
| PRP-U03 | Medium | No property duplication feature | Properties.tsx | Add duplicate property option |
| PRP-U04 | Low | View mode grid/list not persisted | viewMode state | Persist preference |

### Performance
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| PRP-P01 | Medium | All properties fetched without pagination | fetchProperties | Add pagination for large lists |
| PRP-P02 | Medium | Re-fetches all properties after any update | fetchProperties | Use optimistic updates |
| PRP-P03 | Low | Stats calculated from local state on each render | Stats section | Memoize calculations |

### Security
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| PRP-S01 | Critical | No server-side validation of subscription limits | handleSubmit | Add RLS policy or trigger |
| PRP-S02 | High | Images uploaded to public bucket without validation | UnitPhotoUpload | Validate image content |
| PRP-S03 | Medium | Property ownership only checked client-side | All mutations | Enforce via RLS |

### Consistency & Data Integrity
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| PRP-C01 | High | Property deletion may leave orphan units | handleDelete | Cascade delete or prevent |
| PRP-C02 | High | Amenities stored as unvalidated string array | handleSubmit | Use predefined amenity list |
| PRP-C03 | Medium | Province/city stored as strings, not FK | Property interface | Consider reference tables |

### Error Handling & Observability
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| PRP-E01 | High | Image upload failures not handled gracefully | UnitPhotoUpload | Show specific upload errors |
| PRP-E02 | Medium | Console.error for fetch failures not user-visible | fetchProperties | Add user-facing error state |
| PRP-E03 | Low | No retry mechanism for failed operations | Mutations | Add retry option |

### Maintainability
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| PRP-M01 | High | Large file (740 lines) with multiple concerns | Properties.tsx | Split into components |
| PRP-M02 | Medium | Property interface defined locally | Properties.tsx | Move to shared types |
| PRP-M03 | Medium | Status colors defined as inline object | statusColors | Move to theme/constants |
| PRP-M04 | Low | Property types hardcoded | propertyTypes array | Move to database or constants |

### Compatibility & Environment
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| PRP-X01 | Low | Location picker may not work offline | LocationPicker | Add offline fallback |

## Summary

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High | 9 |
| Medium | 12 |
| Low | 6 |

## Recommended Actions
1. Add server-side subscription limit validation via RLS or trigger
2. Implement proper cascade behavior for property deletion
3. Replace confirm() with custom confirmation dialog
4. Refactor large component into smaller focused files
5. Add pagination for property list
6. Clean up storage files when property is deleted
7. Validate image uploads for security
