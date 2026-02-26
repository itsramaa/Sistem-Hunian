

# Membuat merchant_state_machine_diagram.md

## Ringkasan

Membuat file `old-docs/merchant_state_machine_diagram.md` yang berisi **semua 22 state machine** dari `src/shared/constants/state-machines.ts` dalam bentuk Mermaid `stateDiagram-v2` diagrams. Berbeda dengan `merchant_activity_diagram.md` yang fokus pada **alur aktivitas/proses**, dokumen ini fokus pada **transisi status** murni -- setiap state, transisi, dan terminal state terdokumentasi.

## Struktur Dokumen

22 diagram `stateDiagram-v2` Mermaid, masing-masing merepresentasikan satu state machine constant:

| No | State Machine | Constant Name |
|----|--------------|---------------|
| 1 | Merchant Verification | `MERCHANT_VERIFICATION_TRANSITIONS` |
| 2 | Subscription Status | `SUBSCRIPTION_STATUS_TRANSITIONS` |
| 3 | Contract Status | `CONTRACT_STATUS_TRANSITIONS` |
| 4 | Contract Signature | `CONTRACT_SIGNATURE_TRANSITIONS` |
| 5 | Unit Status | `UNIT_STATUS_TRANSITIONS` |
| 6 | Invoice Status | `INVOICE_STATUS_TRANSITIONS` |
| 7 | Payment Status | `PAYMENT_STATUS_TRANSITIONS` |
| 8 | Payment Plan | `PAYMENT_PLAN_STATUS_TRANSITIONS` |
| 9 | Payment Verification | `PAYMENT_VERIFICATION_TRANSITIONS` |
| 10 | Maintenance Request | `MAINTENANCE_STATUS_TRANSITIONS` |
| 11 | Move-Out Notice | `MOVE_OUT_NOTICE_TRANSITIONS` |
| 12 | Move-Out Inspection | `MOVE_OUT_INSPECTION_TRANSITIONS` |
| 13 | Early Termination | `EARLY_TERMINATION_TRANSITIONS` |
| 14 | Deposit Refund | `DEPOSIT_REFUND_TRANSITIONS` |
| 15 | Escrow Transaction | `ESCROW_TRANSACTION_TRANSITIONS` |
| 16 | Disbursement | `DISBURSEMENT_STATUS_TRANSITIONS` |
| 17 | Collections Case | `COLLECTIONS_CASE_TRANSITIONS` |
| 18 | Tenant Invitation | `TENANT_INVITATION_TRANSITIONS` |
| 19 | Referral | `REFERRAL_STATUS_TRANSITIONS` |
| 20 | Document Verification | `VERIFICATION_STATUS_TRANSITIONS` |
| 21 | Vendor Job | `VENDOR_JOB_STATUS_TRANSITIONS` |
| 22 | Vendor Verification | `VENDOR_VERIFICATION_TRANSITIONS` |
| 23 | Order (Marketplace) | `ORDER_STATUS_TRANSITIONS` |
| 24 | Forum Report | `FORUM_REPORT_TRANSITIONS` |
| 25 | OCR Result | `OCR_RESULT_TRANSITIONS` |
| 26 | DSS Recommendation | `DSS_RECOMMENDATION_TRANSITIONS` |
| 27 | Dispute | `DISPUTE_STATUS_TRANSITIONS` |

## Konten per Diagram

Setiap section akan berisi:
1. Judul dan deskripsi singkat (1-2 baris)
2. Tabel transisi `From -> To` (disalin persis dari constant)
3. Mermaid `stateDiagram-v2` diagram dengan:
   - `[*]` sebagai initial state
   - Terminal states ditandai dengan transisi ke `[*]`
   - State names sesuai constant values (e.g., `pending`, `verified`)
   - Catatan pada state yang punya side-effect (e.g., `fully_signed` triggers unit occupied)

## Appendix

- **Tabel ringkasan**: Semua state machines dalam 1 tabel (nama, jumlah states, jumlah terminal states)
- **Cross-domain dependencies**: Diagram yang menunjukkan bagaimana state machine saling terkait (e.g., contract `fully_signed` -> unit `occupied`)
- **Helper functions**: Dokumentasi `isValidTransition`, `getAllowedTransitions`, `isTerminalState`

## File yang Dibuat

| File | Deskripsi |
|------|-----------|
| `old-docs/merchant_state_machine_diagram.md` | Dokumen lengkap berisi 27 Mermaid stateDiagram-v2 |

