# Contracts Management

## Overview
Manajemen kontrak sewa antara merchant dan tenant.

## File Location
- `src/pages/merchant/Contracts.tsx` - Halaman contracts
- `src/components/merchant/ContractDocumentUpload.tsx` - Upload dokumen
- `src/components/merchant/ContractNoticePeriod.tsx` - Notice period

## Database Tables
- `contracts` - Data kontrak
- `tenants` - Tenant
- `units` - Unit

## Features
- ✅ List contracts
- ✅ Create contract
- ✅ Edit contract
- ✅ Contract status filter
- ✅ Upload contract document
- ✅ Digital signature
- ✅ Set billing day
- ✅ Set deposit amount
- ✅ Late fee configuration
- ✅ Notice period settings
- ✅ Early termination settings

## Implementation Status
| Feature | Status |
|---------|--------|
| List | ✅ Complete |
| Create | ✅ Complete |
| Edit | ✅ Complete |
| Filter | ✅ Complete |
| Document | ✅ Complete |
| Signature | ✅ Complete |

## Contract Fields
- `tenant_user_id` - Tenant
- `unit_id` - Unit
- `start_date` - Tanggal mulai
- `end_date` - Tanggal berakhir
- `rent_amount` - Harga sewa
- `deposit_amount` - Deposit
- `billing_day` - Tanggal tagihan
- `status` - Status kontrak
- `signature_status` - Status tanda tangan

## Contract Status
- `draft` - Draft
- `pending_signature` - Menunggu tanda tangan
- `active` - Aktif
- `expired` - Berakhir
- `terminated` - Dibatalkan

## Related Components
- `ContractDocumentUpload`
- `ContractNoticePeriod`
- `SignaturePad`
