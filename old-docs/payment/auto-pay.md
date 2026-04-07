# Auto-Pay

## Overview
Fitur pembayaran otomatis untuk tenant.

## File Location
- `supabase/functions/auto-pay-execute/index.ts` - Execute auto-pay

## Database Tables
- `auto_pay_settings` - Pengaturan auto-pay
- `invoices` - Invoice to pay
- `payments` - Payment records

## Features
- ✅ Enable/disable auto-pay
- ✅ Set payment method
- ✅ Auto payment on due date
- ✅ Failed payment notification
- ✅ Retry logic

## Implementation Status
| Feature | Status |
|---------|--------|
| Enable/Disable | ✅ Complete |
| Payment Method | ✅ Complete |
| Auto Execute | ✅ Complete |
| Notification | ✅ Complete |
| Retry | ✅ Complete |

## Auto-Pay Flow
1. Tenant enables auto-pay
2. Tenant sets payment method
3. On invoice due date, system triggers payment
4. If success, mark invoice paid
5. If failed, notify tenant

## Related Components
- Tenant settings
- Payment system
