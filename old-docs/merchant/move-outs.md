# Move-Outs Management

## Overview
Manajemen proses pindah keluar tenant.

## File Location
- `src/pages/merchant/MoveOuts.tsx` - Halaman move-outs
- `src/components/merchant/MoveOutInspectionForm.tsx` - Form inspeksi
- `src/components/merchant/ScheduleInspectionDialog.tsx` - Schedule
- `src/components/merchant/RelistUnitDialog.tsx` - Relist unit
- `src/components/merchant/EarlyTerminationReviewDialog.tsx` - Early termination

## Database Tables
- `move_out_notices` - Notice pindah
- `move_out_inspections` - Inspeksi
- `move_out_tasks` - Checklist tasks
- `deposit_refunds` - Refund deposit
- `early_termination_requests` - Request terminasi dini

## Features
- ✅ View move-out notices
- ✅ Schedule inspection
- ✅ Conduct inspection
- ✅ Calculate deposit refund
- ✅ Process refund
- ✅ Relist unit
- ✅ Early termination review
- ✅ Checklist tasks

## Implementation Status
| Feature | Status |
|---------|--------|
| View Notices | ✅ Complete |
| Schedule | ✅ Complete |
| Inspection | ✅ Complete |
| Deposit Refund | ✅ Complete |
| Relist | ✅ Complete |
| Early Termination | ✅ Complete |

## Move-Out Flow
1. Tenant submit notice
2. Merchant acknowledge
3. Schedule inspection
4. Conduct inspection
5. Calculate deductions
6. Process deposit refund
7. Relist unit

## Related Components
- `MoveOutInspectionForm`
- `ScheduleInspectionDialog`
- `RelistUnitDialog`
- `EarlyTerminationReviewDialog`
