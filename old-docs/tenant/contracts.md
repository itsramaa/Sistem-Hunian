# Tenant Contracts

## Overview
View dan tanda tangan kontrak untuk tenant.

## File Location
- `src/pages/tenant/Contracts.tsx` - List contracts
- `src/pages/tenant/SignContract.tsx` - Sign contract
- `src/components/signature/SignaturePad.tsx` - Signature

## Database Tables
- `contracts` - Data kontrak
- `units` - Unit info
- `properties` - Property info

## Features
- ✅ View contracts
- ✅ View contract details
- ✅ Digital signature
- ✅ Download contract PDF
- ✅ Move-out notice
- ✅ Early termination request

## Implementation Status
| Feature | Status |
|---------|--------|
| View | ✅ Complete |
| Details | ✅ Complete |
| Signature | ✅ Complete |
| PDF | ✅ Complete |
| Move-out | ✅ Complete |

## Contract View
- Contract period
- Rent amount
- Deposit
- Terms & conditions
- Signature status

## Related Components
- `SignaturePad`
- `MoveOutNoticeDialog`
