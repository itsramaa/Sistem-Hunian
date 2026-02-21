# Invoices Management

## Overview
Manajemen invoice/tagihan untuk tenant.

## File Location
- `src/pages/merchant/Invoices.tsx` - Halaman invoices

## Database Tables
- `invoices` - Data invoice
- `contracts` - Kontrak terkait
- `late_fee_records` - Record denda

## API/Edge Functions
- `supabase/functions/auto-generate-invoices/index.ts` - Auto generate
- `supabase/functions/generate-invoice-pdf/index.ts` - Generate PDF

## Features
- ✅ List invoices
- ✅ Create manual invoice
- ✅ Auto-generate invoices
- ✅ View invoice detail
- ✅ Download PDF
- ✅ Send reminder
- ✅ Apply late fee
- ✅ Filter by status
- ✅ Line items support

## Implementation Status
| Feature | Status |
|---------|--------|
| List | ✅ Complete |
| Create | ✅ Complete |
| Auto-generate | ✅ Complete |
| PDF | ✅ Complete |
| Reminder | ✅ Complete |
| Late Fee | ✅ Complete |

## Invoice Fields
- `invoice_number` - Nomor invoice
- `tenant_user_id` - Tenant
- `contract_id` - Kontrak
- `amount` - Jumlah
- `due_date` - Jatuh tempo
- `status` - Status
- `late_fee` - Denda
- `line_items` - Item detail

## Invoice Status
- `draft` - Draft
- `issued` - Diterbitkan
- `paid` - Lunas
- `overdue` - Lewat jatuh tempo
- `cancelled` - Dibatalkan

## Related Components
- PDF generation
- Payment tracking
