# Vendor Products Feedback

## Bugs & Errors
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| Warning | Photo upload bucket mismatch | `ProductPhotoUpload.tsx:48` | Uses "product-photos" bucket, may not exist | Open |
| ✅ Warning | Promo dates without validation | `Products.tsx:117-119` | Promo end date could be before start date | Fixed |
| ✅ Warning | Delete without dependency check | `Products.tsx:144-148` | Product deleted even if it has orders | Fixed |
| Info | Stock type conversion | `Products.tsx:116` | parseInt may return NaN if stock is empty string | Open |

## Validations
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| ✅ Critical | No price validation | `Products.tsx:110` | Price can be negative or zero | Fixed |
| ✅ Warning | No category validation | `Products.tsx:109` | Category can be empty despite being "required" | Fixed |
| Warning | Missing min_order validation | `Products.tsx:113` | min_order can be zero or negative | Open |
| ✅ Warning | Promo price can exceed regular price | `Products.tsx:117` | No validation that promo < regular price | Fixed |
| Info | Unit not validated | `Products.tsx:111` | Unit field can be any string | Open |

## UX & Flow Pengguna
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| Warning | No product preview | `Products.tsx` | Cannot preview how product looks to tenants | Open |
| Warning | No duplicate detection | `Products.tsx` | Can create products with same name | Open |
| Warning | Dialog loses scroll on mobile | `Products.tsx:229` | Long form may be difficult to complete | Open |
| Info | No drag-drop for photos | `ProductPhotoUpload.tsx` | Must use file picker only | Open |
| Info | No photo reordering | `ProductPhotoUpload.tsx` | Cannot change primary photo after upload | Open |
| Info | No bulk product actions | `Products.tsx` | Cannot bulk update availability | Open |

## Performance
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| Warning | Photos not optimized | `ProductPhotoUpload.tsx:40` | 5MB limit but no compression | Open |
| Warning | No pagination | `Products.tsx:88-100` | All products fetched at once | Open |
| Info | Eager photo loading | `Products.tsx:420-437` | All product photos loaded immediately | Open |

## Security
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| Warning | File upload no virus scan | `ProductPhotoUpload.tsx` | Uploaded files not scanned | Open |
| Warning | No file type strict validation | `ProductPhotoUpload.tsx:36` | MIME type can be spoofed | Open |
| Info | Storage path predictable | `ProductPhotoUpload.tsx:46` | Path uses timestamp + random, could be guessed | Open |

## Consistency & Data Integrity
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| Warning | Category list hardcoded | `Products.tsx:20-31` | SERVICE_CATEGORIES not synced with database | Open |
| ✅ Warning | Photos not cleaned on delete | `Products.tsx:144-148` | Orphaned photos left in storage | Fixed |
| Info | No slug/URL for products | `Products.tsx` | Products identified only by ID | Open |

## Error Handling & Observability
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| ✅ Warning | Generic error messages | `Products.tsx:138-140` | Shows raw error.message | Fixed |
| Warning | Photo upload errors generic | `ProductPhotoUpload.tsx:59-60` | "Failed to upload photos" without specifics | Open |
| Info | No upload progress | `ProductPhotoUpload.tsx` | No progress indicator for photo uploads | Open |

## Maintainability
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| Warning | Large component | `Products.tsx` | 534 lines, should be split | Open |
| Warning | Form state complexity | `Products.tsx:56-70` | Complex form state could use react-hook-form | Open |
| ✅ Info | Inline validation | `Products.tsx:202-205` | Validation scattered throughout | Fixed |
| Info | No product type export | `Products.tsx:33-48` | Product interface not shared | Open |

## Compatibility & Environment
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| Warning | Dialog max-h fixed | `Products.tsx:229` | 90vh may be too tall on landscape mobile | Open |
| Info | Image aspect ratio | `Products.tsx:421` | Assumes 16:9, may crop important content | Open |

## Summary
| Severity | Count | Fixed |
|----------|-------|-------|
| Critical | 1 | 1 |
| Warning | 18 | 7 |
| Info | 12 | 1 |

## Recommended Actions (Completed)
1. ✅ Add comprehensive form validation (price > 0, category required)
2. ✅ Validate promo price < regular price and promo_end > promo_start
3. ✅ Check for active orders before allowing product deletion
4. ✅ Clean up storage when products are deleted
5. ✅ Improved error display with field-level validation messages
6. ✅ Add refresh button

## Remaining Actions
1. Add image compression before upload
2. Implement pagination for products list
3. Sync SERVICE_CATEGORIES with database table or config
