
# Merchant Activity Diagram (merchant_activity_diagram.md)

## Ringkasan

Membuat file `old-docs/merchant_activity_diagram.md` yang berisi Mermaid activity/flowchart diagrams yang mendokumentasikan **semua alur aktivitas merchant** secara lengkap. Dokumen ini akan mencakup setiap domain operasional merchant berdasarkan state machines, edge functions, dan page flows yang sudah ada di codebase.

## Struktur Dokumen

Dokumen akan berisi **14 diagram Mermaid** yang dikelompokkan per domain:

### 1. Merchant Onboarding & Verification Flow
- Registrasi user -> profil merchant -> upload dokumen verifikasi -> admin review -> approved/rejected -> resubmission loop
- State machine: `pending -> verified/rejected`, `rejected -> pending` (resubmit), `verified -> suspended -> verified`

### 2. Subscription Lifecycle
- Pilih tier -> trialing -> active -> past_due -> suspended -> cancelled
- Upgrade/downgrade via `subscription_changes`
- Billing cycle: `subscription-billing` -> `subscription-payment` -> `subscription-renewal` -> `subscription-grace-check`
- Cancellation: feedback -> effective date -> cancelled

### 3. Property & Unit Management
- Tambah properti -> set alamat (addresses) -> tambah unit -> kelola guardian -> fasilitas -> compliance docs
- Unit status: `available <-> occupied <-> maintenance`
- Property lifecycle: setup -> listing -> occupancy tracking -> renovations -> insurance

### 4. Contract Lifecycle (Full)
- Draft -> tanda tangan (merchant_signed / tenant_signed -> fully_signed) -> active -> notice -> completed
- Branch: active -> terminated (early termination request flow)
- Branch: active -> expired (auto)
- Trigger: fully_signed -> unit status = occupied

### 5. Tenant Management Flow
- Invite tenant (`tenant_invitations`: pending -> accepted/expired) -> create contract -> link to unit
- Tenant history tracking (`tenant_merchant_history`)
- Unlink tenant -> unit available

### 6. Invoice Lifecycle
- Auto-generate (`auto-generate-invoices`) -> draft -> sent -> paid/overdue
- Overdue branch: late fee records -> payment reminder -> collections case
- Payment plan branch: negotiation -> installments -> completed/defaulted
- Denormalisasi: auto-populate property_id, unit_id, tenant_name, unit_number via trigger

### 7. Payment & Payment Verification Flow
- Invoice sent -> tenant pays -> payment recorded -> escrow
- OCR payment proof: upload -> `ocr-payment-proof` -> `payment_verifications` (pending -> auto_matched/confirmed/rejected)
- Xendit integration: `xendit-create-invoice` -> payment URL -> `xendit-webhook` callback

### 8. Escrow & Disbursement Flow
- Payment masuk -> escrow_transactions (pending -> completed)
- Disbursement: pending -> approved -> processing -> completed/failed
- Scheduled disbursement via edge function
- Bank account management

### 9. Move-Out & Deposit Refund Flow
- Notice: submitted -> acknowledged -> approved -> completed
- Inspection: scheduled -> in_progress -> completed
- Tasks & timeline tracking
- Early termination: pending_approval -> approved/denied/counter_offered
- Deposit refund: pending_processing -> approved -> processing -> completed
- Deposit dispute: open -> resolved

### 10. Maintenance Request Lifecycle
- Tenant submit -> pending -> in_progress -> completed
- SLA deadline (auto via trigger)
- Vendor assignment -> vendor job (pending -> accepted -> in_progress -> completed)
- Expense tracking (OCR receipt)
- Review & rating
- Timeline & updates

### 11. Billing Analytics & Collections
- Overdue escalation (`check-overdue-escalation`): initiated -> in_progress -> resolved
- Collection strategies via DSS
- Tenant payment metrics computation
- Tenant risk scoring

### 12. AI/ML & DSS Advisory Flow
- DSS: pricing advisor, maintenance priority, collection strategy, investment insight
- ML: churn prediction, occupancy forecast, revenue forecast, risk assessment, tenant quality scoring, optimal pricing, price intelligence
- OCR: KTP, payment proof, maintenance receipt, compliance doc, contract doc, business doc, asset label
- Recommendation lifecycle: generated -> viewed -> accepted/rejected -> measured

### 13. Referral System
- Generate referral code -> share -> referee signs up -> pending -> active -> completed
- Commission processing: `process-referral-commissions`, `process-referral-reward`
- Vendor order referral: `process-vendor-order-referral`

### 14. Support, Feedback & Compliance
- Live chat: conversations -> messages
- Merchant feedback: submit -> admin response
- Compliance documents: upload -> tracking expiry
- Insurance: policies -> claims
- Security incidents & disaster risk profiles
- Data quality checks
- Audit logs

## Detail Teknis

### File yang Dibuat
| File | Deskripsi |
|------|-----------|
| `old-docs/merchant_activity_diagram.md` | Dokumen lengkap berisi 14 Mermaid flowchart diagrams |

### Konvensi Diagram
- Menggunakan `flowchart TD` (top-down) untuk clarity
- Warna node: hijau untuk start/success, merah untuk terminal/error, biru untuk proses, kuning untuk decision
- Setiap diagram memiliki penjelasan teks singkat
- Cross-reference antar diagram ditandai dengan label `[See Diagram X]`
- Semua state dari `state-machines.ts` tercakup
- Semua edge functions yang relevan ditandai dengan label `<<edge function>>`
- Semua triggers yang relevan ditandai dengan label `<<trigger>>`
