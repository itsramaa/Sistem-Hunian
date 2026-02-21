# Disbursement

## Overview
Pencairan dana dari escrow ke rekening bank merchant/vendor.

## File Location
- `supabase/functions/xendit-disbursement/index.ts` - Disbursement
- `supabase/functions/xendit-disbursement-webhook/index.ts` - Webhook
- `supabase/functions/scheduled-disbursement/index.ts` - Scheduled

## Database Tables
- `disbursements` - Data disbursement
- `escrow_accounts` - Source
- `bank_accounts` - Destination

## Features
- ✅ Manual disbursement request
- ✅ Scheduled disbursement
- ✅ Minimum amount check
- ✅ Bank validation
- ✅ Status tracking
- ✅ Failure handling

## Implementation Status
| Feature | Status |
|---------|--------|
| Manual | ✅ Complete |
| Scheduled | ✅ Complete |
| Minimum | ✅ Complete |
| Validation | ✅ Complete |
| Tracking | ✅ Complete |

## Disbursement Flow
1. Check available balance
2. Check minimum amount
3. Create disbursement request
4. Call Xendit disbursement API
5. Wait for webhook
6. Update status

## Schedule Options
- Daily
- Weekly
- Bi-weekly
- Monthly

## Related Components
- `DisbursementScheduleSettings`
- `BankAccountManager`
