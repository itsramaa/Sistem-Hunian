

# Perbaikan merchant_activity_diagram.md — Sinkronisasi dengan Sistem Aktual

## Ringkasan

Dokumen secara keseluruhan **sudah akurat** — semua 27 state machine transition tables dan 59 edge functions cocok dengan kode. Namun ada **6 perbaikan** yang perlu dilakukan agar 100% match.

## Perbaikan yang Diperlukan

### 1. Diagram 1 (Onboarding) — Tambahkan trigger `handle_new_user()`

Trigger `handle_new_user()` adalah trigger paling kritis pada onboarding: ia secara atomik membuat `profiles`, `user_roles`, `merchants`, `escrow_accounts`, dan `merchant_subscriptions` (free tier). Saat ini diagram hanya menunjukkan `ensure-user-bootstrap` edge function, tapi trigger database ini yang sebenarnya melakukan heavy lifting.

**Perubahan**: Tambahkan node `handle_new_user()` sebagai `<<trigger>>` setelah registrasi, sebelum profil merchant.

### 2. Diagram 2 (Subscription) — Label trigger `set_cancellation_effective_date()`

Alur cancellation sudah benar secara flow, tapi node "Set Effective Date" tidak ditandai sebagai database trigger. Trigger `set_cancellation_effective_date()` otomatis mengisi `cancellation_effective_date` berdasarkan `current_period_end`.

**Perubahan**: Tambahkan label `<<trigger>>` pada node effective date.

### 3. Diagram 3 (Property) — Tambahkan trigger `update_property_unit_counts()` dan `update_property_renovation_total()`

Dua trigger yang secara otomatis menyinkronkan data properti tidak terdokumentasi:
- `update_property_unit_counts()` — auto-update `total_units` dan `occupied_units` saat unit ditambah/diubah/dihapus
- `update_property_renovation_total()` — auto-update `renovation_cost` saat renovation record berubah

**Perubahan**: Tambahkan subgraph "Auto-Sync Triggers" di Diagram 3.

### 4. Diagram 6 (Invoice) — Tambahkan trigger `track_invoice_status_change()`

Trigger `track_invoice_status_change()` otomatis mencatat setiap perubahan status invoice ke `invoice_status_history`. Ini tidak ada di diagram saat ini.

**Perubahan**: Tambahkan node trigger pada setiap transisi status invoice.

### 5. Diagram 10 (Maintenance) — Tambahkan trigger `update_vendor_maintenance_rating()`

Setelah tenant memberikan review, trigger `update_vendor_maintenance_rating()` otomatis menghitung ulang rata-rata rating vendor. Ini belum terdokumentasi.

**Perubahan**: Tambahkan node trigger setelah "maintenance_reviews" node.

### 6. State Machines Summary (Appendix) — Perbaiki mapping yang salah

| Masalah | Perbaikan |
|---------|-----------|
| `TENANT_INVITATION_TRANSITIONS` tidak ada | Tambahkan, map ke Diagram 5 |
| `VENDOR_VERIFICATION_TRANSITIONS` mapped ke Diagram 10 | Ubah ke "Vendor Domain (non-merchant)" |
| `VERIFICATION_STATUS_TRANSITIONS` mapped ke Diagram 1 | Ubah ke "Generic (used internally)" |
| `order-auto-reject` mapped ke "11 (Order)" | Ubah ke "Marketplace (non-merchant)" |

## Detail Teknis

### File yang Diubah
| File | Perubahan |
|------|-----------|
| `old-docs/merchant_activity_diagram.md` | 6 perbaikan di diagram 1, 2, 3, 6, 10, dan appendix |

### Tidak Perlu Diubah
- Semua 27 state machine transition tables — sudah cocok 100%
- Semua 59 edge function references — sudah lengkap
- Semua flowchart logic dan branching — sudah akurat
- Cross-Reference Matrix — sudah benar

