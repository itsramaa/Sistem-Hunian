# Merchant Invoices Feedback

## Overview
Comprehensive review of Merchant Invoices Management feature implementation.

## Files Reviewed
- `src/pages/merchant/Invoices.tsx`
- `supabase/functions/auto-generate-invoices/index.ts`
- `supabase/functions/generate-invoice-pdf/index.ts`

## Issues & Findings

### Bugs & Errors
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| INV-B01 | Critical | Invoice status transitions not validated (e.g., can mark cancelled invoice as paid) | markPaidMutation | Add status transition validation | ✅ Fixed |
| INV-B02 | High | Email notification failure silently logged, user not informed | sendMutation | Inform user if email fails | - |
| INV-B03 | High | PDF generation returns HTML for printing, not actual PDF | downloadInvoicePdf | Generate proper PDF file | - |
| INV-B04 | Medium | Tax amount can be negative | createMutation | Validate non-negative tax | ✅ Fixed |
| INV-B05 | Medium | Due date can be in past | Create Invoice form | Validate due_date >= today | ✅ Fixed |

### Validations
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| INV-V01 | High | No validation for duplicate invoices (same contract, same period) | createMutation | Check for existing invoice for period | ✅ Fixed |
| INV-V02 | High | Amount field allows zero or negative values | Create Invoice form | Add min validation | ✅ Fixed |
| INV-V03 | Medium | Description has no length limit | Create Invoice form | Add max length validation | ✅ Fixed |
| INV-V04 | Medium | No validation that contract is still active | createMutation | Check contract status before creating invoice | - |

### UX & Flow Pengguna
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| INV-U01 | High | No inline invoice editing (must view then update) | Invoices table | Add quick edit capability | - |
| INV-U02 | Medium | No bulk operations (send all, mark all paid) | Invoices.tsx | Add bulk action buttons | - |
| INV-U03 | Medium | View dialog lacks full invoice details (tenant info, line items) | viewInvoice dialog | Expand invoice detail view | - |
| INV-U04 | Low | Invoice number not visible until after creation | Create Invoice form | Show preview of invoice number | - |

### Performance
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| INV-P01 | Medium | No pagination for large invoice lists | invoices query | Add pagination | - |
| INV-P02 | Medium | Stats calculated client-side on all invoices | stats calculation | Use database aggregation | - |
| INV-P03 | Low | Contract data fetched separately | contracts query | Join in single query if needed frequently | - |

### Security
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| INV-S01 | Critical | No merchant ownership verification on invoice operations | Mutations | Add merchant_id check | - |
| INV-S02 | High | SUPABASE_URL exposed in frontend code | SUPABASE_URL constant | URL is public but edge function should verify auth | - |
| INV-S03 | High | send-payment-reminder called without authentication header | sendReminderMutation | Add auth token to request | - |
| INV-S04 | High | generate-invoice-pdf called without authentication | downloadInvoicePdf | Add auth verification | - |

### Consistency & Data Integrity
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| INV-C01 | High | Invoice marked as sent but email may fail | sendMutation | Only mark sent after email success | - |
| INV-C02 | High | paid_at can be updated without payment record | markPaidMutation | Create associated payment record | - |
| INV-C03 | Medium | issued_at only set when sending, not when created | createMutation | Consider setting on creation | - |

### Error Handling & Observability
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| INV-E01 | High | PDF generation errors show generic message | downloadInvoicePdf | Show specific error from response | - |
| INV-E02 | Medium | Reminder sending errors don't show in table row | sendReminderMutation | Add error indicator per invoice | - |
| INV-E03 | Low | Console.error for email failures without reporting | sendMutation | Add error tracking/alerting | - |

### Maintainability
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| INV-M01 | High | Large component file (644 lines) | Invoices.tsx | Split into InvoiceList, InvoiceForm, InvoiceDetail | - |
| INV-M02 | Medium | Invoice type defined locally | Invoices.tsx | Move to shared types | - |
| INV-M03 | Medium | Status color logic duplicated | getStatusColor | Create reusable status component | - |

### Compatibility & Environment
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| INV-X01 | Low | Print-based PDF generation may not work on all browsers | downloadInvoicePdf | Use proper PDF generation library | - |

## Summary

| Severity | Count | Fixed |
|----------|-------|-------|
| Critical | 2 | 1 |
| High | 12 | 3 |
| Medium | 11 | 4 |
| Low | 4 | 0 |

## Recommended Actions
1. Add proper authentication to edge function calls
2. ✅ Implement invoice status transition validation
3. Generate actual PDF files instead of print-based HTML
4. Add merchant ownership verification via RLS
5. Refactor large component into smaller focused files
6. ✅ Implement duplicate invoice prevention
7. Add bulk operations for common actions
