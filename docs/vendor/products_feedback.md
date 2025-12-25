# Vendor Products Feedback

## Bugs & Errors
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | Photo upload bucket mismatch | `ProductPhotoUpload.tsx:48` | Uses "product-photos" bucket, may not exist |
| Warning | Promo dates without validation | `Products.tsx:117-119` | Promo end date could be before start date |
| Warning | Delete without dependency check | `Products.tsx:144-148` | Product deleted even if it has orders |
| Info | Stock type conversion | `Products.tsx:116` | parseInt may return NaN if stock is empty string |

## Validations
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Critical | No price validation | `Products.tsx:110` | Price can be negative or zero |
| Warning | No category validation | `Products.tsx:109` | Category can be empty despite being "required" |
| Warning | Missing min_order validation | `Products.tsx:113` | min_order can be zero or negative |
| Warning | Promo price can exceed regular price | `Products.tsx:117` | No validation that promo < regular price |
| Info | Unit not validated | `Products.tsx:111` | Unit field can be any string |

## UX & Flow Pengguna
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | No product preview | `Products.tsx` | Cannot preview how product looks to tenants |
| Warning | No duplicate detection | `Products.tsx` | Can create products with same name |
| Warning | Dialog loses scroll on mobile | `Products.tsx:229` | Long form may be difficult to complete |
| Info | No drag-drop for photos | `ProductPhotoUpload.tsx` | Must use file picker only |
| Info | No photo reordering | `ProductPhotoUpload.tsx` | Cannot change primary photo after upload |
| Info | No bulk product actions | `Products.tsx` | Cannot bulk update availability |

## Performance
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | Photos not optimized | `ProductPhotoUpload.tsx:40` | 5MB limit but no compression |
| Warning | No pagination | `Products.tsx:88-100` | All products fetched at once |
| Info | Eager photo loading | `Products.tsx:420-437` | All product photos loaded immediately |

## Security
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | File upload no virus scan | `ProductPhotoUpload.tsx` | Uploaded files not scanned |
| Warning | No file type strict validation | `ProductPhotoUpload.tsx:36` | MIME type can be spoofed |
| Info | Storage path predictable | `ProductPhotoUpload.tsx:46` | Path uses timestamp + random, could be guessed |

## Consistency & Data Integrity
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | Category list hardcoded | `Products.tsx:20-31` | SERVICE_CATEGORIES not synced with database |
| Warning | Photos not cleaned on delete | `Products.tsx:144-148` | Orphaned photos left in storage |
| Info | No slug/URL for products | `Products.tsx` | Products identified only by ID |

## Error Handling & Observability
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | Generic error messages | `Products.tsx:138-140` | Shows raw error.message |
| Warning | Photo upload errors generic | `ProductPhotoUpload.tsx:59-60` | "Failed to upload photos" without specifics |
| Info | No upload progress | `ProductPhotoUpload.tsx` | No progress indicator for photo uploads |

## Maintainability
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | Large component | `Products.tsx` | 534 lines, should be split |
| Warning | Form state complexity | `Products.tsx:56-70` | Complex form state could use react-hook-form |
| Info | Inline validation | `Products.tsx:202-205` | Validation scattered throughout |
| Info | No product type export | `Products.tsx:33-48` | Product interface not shared |

## Compatibility & Environment
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | Dialog max-h fixed | `Products.tsx:229` | 90vh may be too tall on landscape mobile |
| Info | Image aspect ratio | `Products.tsx:421` | Assumes 16:9, may crop important content |

## Summary
| Severity | Count |
|----------|-------|
| Critical | 1 |
| Warning | 18 |
| Info | 12 |

## Recommended Actions
1. Add comprehensive form validation using zod or yup schema
2. Validate promo price < regular price and promo_end > promo_start
3. Check for active orders before allowing product deletion
4. Add image compression before upload
5. Implement pagination for products list
6. Clean up storage when products are deleted
7. Sync SERVICE_CATEGORIES with database table or config
