# Disputes Management

## Overview
Manajemen dispute antara tenant dan merchant.

## File Location
- `src/pages/admin/Disputes.tsx` - Halaman disputes

## Database Tables
- `disputes` - Data dispute
- `deposit_disputes` - Dispute deposit refund

## Features
- ✅ List semua disputes
- ✅ Filter by status/priority
- ✅ View dispute detail
- ✅ Assign dispute handler
- ✅ Resolve dispute
- ✅ Add resolution notes

## Implementation Status
| Feature | Status |
|---------|--------|
| List Disputes | ✅ Complete |
| Filter | ✅ Complete |
| View Detail | ✅ Complete |
| Resolution | ✅ Complete |

## Dispute Status
- `open` - Dispute baru
- `in_progress` - Sedang ditangani
- `resolved` - Sudah selesai
- `closed` - Ditutup

## Dispute Priority
- `low` - Prioritas rendah
- `medium` - Prioritas sedang
- `high` - Prioritas tinggi
- `urgent` - Urgent

## Related Components
- Deposit disputes
- Contract disputes
