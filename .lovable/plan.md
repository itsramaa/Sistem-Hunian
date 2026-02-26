
# Membuat merchant_sequence_diagram.md

## Ringkasan

Membuat file `old-docs/merchant_sequence_diagram.md` yang berisi **Mermaid `sequenceDiagram`** yang mendokumentasikan interaksi antar aktor (Merchant, Tenant, Admin, System/Trigger, Edge Function, Xendit, Database) untuk setiap domain operasional merchant. Berbeda dengan activity diagram (alur proses) dan state machine diagram (transisi status), sequence diagram ini fokus pada **siapa berkomunikasi dengan siapa dan kapan**.

## Struktur Dokumen

Dokumen akan berisi **16 sequence diagrams** yang dikelompokkan per domain:

| No | Diagram | Aktor Utama |
|----|---------|-------------|
| 1 | Merchant Registration & Onboarding | User, Frontend, Database, Auth |
| 2 | Merchant Verification (Admin Review) | Admin, merchantService, Database, Edge Function (send-notification), Merchant |
| 3 | Subscription Lifecycle | Merchant, subscriptionService, Database, Edge Functions (subscription-billing, subscription-payment, subscription-renewal, subscription-grace-check) |
| 4 | Property & Unit Management | Merchant, propertyService, unitService, Database, nearbyFacilitiesService |
| 5 | Contract Creation & Signature Flow | Merchant, contractService, Database, Tenant, Trigger (unit status sync) |
| 6 | Tenant Invitation Flow | Merchant, Edge Function (create-tenant-account, get-tenant-invitation, accept-tenant-invitation), Database, Tenant |
| 7 | Invoice Lifecycle (Create -> Send -> Pay) | Merchant, merchantInvoiceService, Database, Edge Function (send-notification, auto-generate-invoices), Tenant |
| 8 | Payment & Xendit Integration | Tenant, xenditService, Edge Function (xendit-create-invoice, xendit-webhook), Xendit API, Database |
| 9 | Payment Verification (OCR) | Tenant, Edge Function (ocr-payment-proof), Database, Merchant |
| 10 | Escrow & Disbursement | System, escrowService, Edge Function (scheduled-disbursement, xendit-disbursement, xendit-disbursement-webhook), Xendit, Database, Admin |
| 11 | Maintenance Request Full Cycle | Tenant, maintenanceService, Database, Merchant, Vendor, Edge Function (dss-maintenance-priority) |
| 12 | Move-Out & Deposit Refund | Tenant, Database, Merchant, Edge Function (process-deposit-refund), Trigger |
| 13 | Overdue Escalation & Collections | System (cron), Edge Function (check-overdue-escalation, send-payment-reminder, dss-collection-strategy), Database, Merchant |
| 14 | AI/DSS Advisory | Merchant, Edge Functions (dss-pricing-advisor, dss-investment-insight, ml-churn-prediction, ml-occupancy-forecast, ml-revenue-forecast, ml-optimal-pricing), Database |
| 15 | Referral System | Merchant, Database, Edge Functions (process-referral-commissions, process-referral-reward), Referee |
| 16 | Merchant Suspend/Reactivate (Admin) | Admin, merchantService, Database, Edge Function (send-notification), Merchant |

## Konten per Diagram

Setiap section berisi:
1. Judul dan deskripsi singkat
2. Daftar aktor (participants)
3. Mermaid `sequenceDiagram` dengan:
   - `participant` declarations
   - Arrows: `->>` (request), `-->>` (response), `--)` (async/notification)
   - `alt`/`opt`/`loop`/`note` blocks untuk branching logic
   - Label yang menunjukkan method/function yang dipanggil (e.g., `merchantService.verifyMerchant()`)
   - Database operations (INSERT, UPDATE, SELECT)
   - Edge function invocations
   - Error paths dalam `alt` blocks

## Sumber Data

Diagram dibangun berdasarkan kode aktual dari:
- `src/features/users/services/merchantService.ts` -- verify, suspend, bulkApprove
- `src/features/contracts/services/contractService.ts` -- create, sign, status update, delete
- `src/features/payments/services/merchantInvoiceService.ts` -- create, send, markAsPaid
- `src/features/payments/services/xenditService.ts` -- createInvoice (Xendit)
- `src/features/payments/services/paymentPlanService.ts` -- payment plan lifecycle
- `src/features/escrow/services/escrowService.ts` -- disbursement approve/reject
- `src/features/subscriptions/services/subscriptionService.ts` -- tier CRUD, subscription update
- `src/features/maintenance/services/maintenanceService.ts` -- create, updateStatus, vendor assignment, completion
- `src/features/properties/services/propertyService.ts` -- property CRUD
- `supabase/functions/` -- 60+ edge functions
- `src/shared/constants/state-machines.ts` -- transition validation
- `src/shared/utils/auditLog.ts` -- audit logging

## Appendix

- **Edge Function Invocation Map**: Tabel yang menunjukkan sequence mana yang memanggil edge function mana
- **Cross-Diagram References**: Bagaimana sequence saling terkait (e.g., Invoice Send triggers Payment flow)

## File yang Dibuat

| File | Deskripsi |
|------|-----------|
| `old-docs/merchant_sequence_diagram.md` | Dokumen lengkap berisi 16 Mermaid sequenceDiagram |
