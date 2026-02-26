

# Perbaikan merchant_sequence_diagram.md -- Sinkronisasi dengan Sistem Aktual

## Ringkasan

Dokumen secara keseluruhan **sudah akurat** -- 16 sequence diagrams, edge function invocation map, dan cross-diagram references semuanya konsisten dengan kode. Namun ada **4 perbaikan** yang perlu dilakukan.

## Masalah yang Ditemukan

### 1. Diagram 1 (Registration) -- `ensure-user-bootstrap` seharusnya `handle_new_user()` trigger

Diagram menunjukkan `ensure-user-bootstrap` edge function sebagai mekanisme onboarding merchant. Kenyataannya:
- Merchant registration menggunakan **`handle_new_user()` DB trigger** pada `auth.users` INSERT (bukan edge function)
- `ensure-user-bootstrap` hanya digunakan di `TenantProfileForm.tsx` untuk tenant, bukan merchant
- Trigger `handle_new_user()` secara atomik membuat: `profiles`, `user_roles`, `merchants`, `escrow_accounts`, `merchant_subscriptions`

**Perubahan**: Ganti participant `EF` (`ensure-user-bootstrap`) menjadi `TR` (`handle_new_user() DB Trigger`). Ubah arrow dari `Auth--)EF` menjadi `Auth--)TR` (trigger fires on INSERT to auth.users).

### 2. Diagram 2 (Verification) -- Menunjukkan 2 INSERT, seharusnya 1

Diagram menunjukkan dua INSERT ke `merchant_verification_history`:
- Line 98: INSERT umum (merchant_id, action, performed_by, old_status, new_status)
- Line 102-104: INSERT lagi di alt block (approved/rejected)

Kode aktual (`merchantService.verifyMerchant()` line 144-155) hanya melakukan **satu INSERT** dengan semua field (approval_notes, rejection_reason, rejection_details, resubmission_instructions) yang diisi secara kondisional.

**Perubahan**: Hapus INSERT pertama (line 98), pindahkan ke dalam alt block sebagai satu INSERT dengan semua field kondisional.

### 3. Diagram 4 (Property) -- Missing `dataQualityService.createVersion()` pada Update

`propertyService.updateProperty()` memanggil `dataQualityService.createVersion()` untuk auto-versioning sebelum melakukan update. Ini tidak terdokumentasi di sequence diagram.

**Perubahan**: Tambahkan participant `DQ as dataQualityService` dan langkah `PS->>DQ: createVersion('property', id, currentData, summary)` sebelum update, konsisten dengan bagaimana diagram sudah menunjukkan DQ pada flow lainnya.

### 4. Appendix A & C -- Referensi `ensure-user-bootstrap` yang salah

- Appendix A baris pertama: `ensure-user-bootstrap | 1. Registration | Auth hook (automatic)` -- seharusnya `handle_new_user() | 1. Registration | DB Trigger (on auth.users INSERT)`
- Appendix C baris Diagram 1: "1 (bootstrap)" di kolom Edge Functions -- seharusnya "0" karena ini trigger bukan edge function. Dan kolom "DB Writes" seharusnya mencerminkan trigger (5 INSERTs dari trigger + kemungkinan UPDATE dari frontend).

## Yang Sudah Benar (Tidak Perlu Diubah)

- Diagram 3 (Subscription) -- match dengan `subscriptionService.ts`
- Diagram 5 (Contract) -- match dengan `contractService.ts` termasuk dual-signature flow
- Diagram 6 (Tenant Invitation) -- match dengan edge functions
- Diagram 7 (Invoice) -- match dengan `merchantInvoiceService.ts`
- Diagram 8 (Payment/Xendit) -- match dengan `xenditService.ts`
- Diagram 9 (OCR) -- match dengan flow
- Diagram 10 (Escrow) -- match dengan `escrowService.ts` termasuk approve/reject
- Diagram 11 (Maintenance) -- match dengan `maintenanceService.ts` termasuk vendor job + earnings
- Diagram 12-15 -- match dengan edge functions dan flows
- Diagram 16 (Suspend/Bulk) -- match dengan `merchantService.suspendMerchant()` dan `bulkApprove()`
- Semua state machine references -- match dengan `state-machines.ts`
- Cross-Diagram References (Appendix B) -- akurat

## Detail Teknis

### File yang Diubah
| File | Jumlah Perbaikan |
|------|-----------------|
| `old-docs/merchant_sequence_diagram.md` | 4 perbaikan (Diagram 1, 2, 4, Appendix A/C) |

