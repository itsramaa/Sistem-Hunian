# Merchant Activity Diagrams

> Dokumentasi lengkap semua alur aktivitas merchant dalam bentuk Mermaid flowchart diagrams.
> Setiap diagram merepresentasikan satu domain operasional merchant.
>
> **Sumber data**: `state-machines.ts`, edge functions, database triggers, dan page flows.
>
> **Konvensi**:
> - 🟢 Hijau: Start / Success / Terminal positif
> - 🔴 Merah: Terminal negatif / Error
> - 🔵 Biru: Proses utama
> - 🟡 Kuning: Decision / Branch
> - `<<edge function>>` = Supabase Edge Function
> - `<<trigger>>` = Database Trigger
> - `[See Diagram X]` = Cross-reference ke diagram lain

---

## Daftar Isi

1. [Merchant Onboarding & Verification](#1-merchant-onboarding--verification-flow)
2. [Subscription Lifecycle](#2-subscription-lifecycle)
3. [Property & Unit Management](#3-property--unit-management)
4. [Contract Lifecycle](#4-contract-lifecycle)
5. [Tenant Management](#5-tenant-management-flow)
6. [Invoice Lifecycle](#6-invoice-lifecycle)
7. [Payment & Payment Verification](#7-payment--payment-verification-flow)
8. [Escrow & Disbursement](#8-escrow--disbursement-flow)
9. [Move-Out & Deposit Refund](#9-move-out--deposit-refund-flow)
10. [Maintenance Request Lifecycle](#10-maintenance-request-lifecycle)
11. [Billing Analytics & Collections](#11-billing-analytics--collections)
12. [AI/ML & DSS Advisory](#12-aiml--dss-advisory-flow)
13. [Referral System](#13-referral-system)
14. [Support, Feedback & Compliance](#14-support-feedback--compliance)
15. [Payment Reconciliation (Auto-Match)](#15-payment-reconciliation-auto-match)
16. [Automated Payment Reminders & Escalation](#16-automated-payment-reminders--escalation)
17. [Expense Tracking](#17-expense-tracking)
18. [Waiting List & Applicant Management](#18-waiting-list--applicant-management)
19. [Lease Renewal & Amendment](#19-lease-renewal--amendment)
20. [Collections Case Management (Extended)](#20-collections-case-management-extended)
21. [Dynamic Pricing Rules](#21-dynamic-pricing-rules)
22. [Financial Reports (P&L)](#22-financial-reports-pl)
23. [Admin Launch Readiness](#23-admin-launch-readiness)

---

## 1. Merchant Onboarding & Verification Flow

Alur registrasi merchant baru hingga verifikasi oleh admin. State machine: `MERCHANT_VERIFICATION_TRANSITIONS`.

```mermaid
flowchart TD
    START([User Sign Up]) --> REG[Registrasi Akun<br/>email + password]
    REG --> TRIGGER_NEW["handle_new_user()<br/><<trigger>><br/>Creates: profiles, user_roles,<br/>merchants, escrow_accounts,<br/>merchant_subscriptions (free)"]
    TRIGGER_NEW --> PROFILE[Lengkapi Profil Merchant<br/>business_name, business_type]
    PROFILE --> ADDR[Set Alamat<br/>headquarters_address_id<br/>billing_address_id]
    ADDR --> UPLOAD[Upload Dokumen Verifikasi<br/>KTP, SIUP, NPWP]
    UPLOAD --> OCR_KTP["OCR KTP Extract<br/><<edge function>><br/>ocr-ktp-extract"]
    OCR_KTP --> OCR_BIZ["OCR Business Document<br/><<edge function>><br/>ocr-business-document"]
    OCR_BIZ --> PENDING([Status: PENDING])

    PENDING --> ADMIN_REVIEW{Admin Review}
    ADMIN_REVIEW -->|Approve| VERIFIED([Status: VERIFIED])
    ADMIN_REVIEW -->|Reject| REJECTED([Status: REJECTED])

    REJECTED --> RESUBMIT{Merchant Resubmit?}
    RESUBMIT -->|Yes| UPLOAD
    RESUBMIT -->|No| REJECTED_END([Tetap Rejected])

    VERIFIED --> SUSPEND_CHECK{Admin Suspend?}
    SUSPEND_CHECK -->|Yes| SUSPENDED([Status: SUSPENDED])
    SUSPEND_CHECK -->|No| ACTIVE_MERCHANT([Merchant Aktif<br/>See Diagram 2])
    SUSPENDED --> REINSTATE{Reinstate?}
    REINSTATE -->|Yes| VERIFIED
    REINSTATE -->|No| SUSPENDED

    PROFILE --> BOOTSTRAP["ensure-user-bootstrap<br/><<edge function>>"]
    BOOTSTRAP --> PROFILE

    style START fill:#2ecc71,color:#fff
    style VERIFIED fill:#2ecc71,color:#fff
    style ACTIVE_MERCHANT fill:#2ecc71,color:#fff
    style REJECTED fill:#e74c3c,color:#fff
    style REJECTED_END fill:#e74c3c,color:#fff
    style SUSPENDED fill:#e67e22,color:#fff
    style PENDING fill:#3498db,color:#fff
    style ADMIN_REVIEW fill:#f1c40f,color:#333
    style RESUBMIT fill:#f1c40f,color:#333
    style SUSPEND_CHECK fill:#f1c40f,color:#333
    style REINSTATE fill:#f1c40f,color:#333
```

**State Machine** (`MERCHANT_VERIFICATION_TRANSITIONS`):
| From | To |
|------|-----|
| `pending` | `verified`, `rejected` |
| `rejected` | `pending` (resubmit) |
| `verified` | `suspended` |
| `suspended` | `verified` |

---

## 2. Subscription Lifecycle

Alur langganan merchant dari pemilihan tier hingga cancellation. State machine: `SUBSCRIPTION_STATUS_TRANSITIONS`.

```mermaid
flowchart TD
    START([Merchant Verified]) --> CHOOSE[Pilih Subscription Tier<br/>subscription_tiers table]
    CHOOSE --> TRIALING([Status: TRIALING<br/>trial_ends_at])

    TRIALING --> TRIAL_END{Trial Berakhir?}
    TRIAL_END -->|Bayar| ACTIVE([Status: ACTIVE])
    TRIAL_END -->|Tidak Bayar| CANCELLED_T([Status: CANCELLED])

    ACTIVE --> BILLING["subscription-billing<br/><<edge function>>"]
    BILLING --> PAYMENT["subscription-payment<br/><<edge function>>"]
    PAYMENT --> PAY_OK{Pembayaran Berhasil?}
    PAY_OK -->|Yes| RENEWAL["subscription-renewal<br/><<edge function>>"]
    PAY_OK -->|No| PAST_DUE([Status: PAST_DUE])

    RENEWAL --> ACTIVE

    PAST_DUE --> GRACE["subscription-grace-check<br/><<edge function>>"]
    GRACE --> GRACE_OK{Bayar dalam Grace Period?}
    GRACE_OK -->|Yes| ACTIVE
    GRACE_OK -->|No| SUSPENDED([Status: SUSPENDED])

    SUSPENDED --> REACTIVATE{Reactivate?}
    REACTIVATE -->|Yes, Bayar| ACTIVE
    REACTIVATE -->|No| CANCELLED([Status: CANCELLED])

    ACTIVE --> UPGRADE{Upgrade / Downgrade?}
    UPGRADE -->|Yes| SUB_CHANGE[subscription_changes<br/>from_tier_id -> to_tier_id]
    SUB_CHANGE --> ACTIVE

    ACTIVE --> CANCEL_REQ{Cancel Request?}
    CANCEL_REQ -->|Yes| FEEDBACK[cancellation_feedback<br/>reason, feedback]
    FEEDBACK --> EFFECTIVE["set_cancellation_effective_date()<br/><<trigger>><br/>cancellation_effective_date =<br/>current_period_end"]
    EFFECTIVE --> CANCELLED

    style START fill:#2ecc71,color:#fff
    style ACTIVE fill:#2ecc71,color:#fff
    style TRIALING fill:#3498db,color:#fff
    style PAST_DUE fill:#e67e22,color:#fff
    style SUSPENDED fill:#e67e22,color:#fff
    style CANCELLED fill:#e74c3c,color:#fff
    style CANCELLED_T fill:#e74c3c,color:#fff
    style TRIAL_END fill:#f1c40f,color:#333
    style PAY_OK fill:#f1c40f,color:#333
    style GRACE_OK fill:#f1c40f,color:#333
    style REACTIVATE fill:#f1c40f,color:#333
    style UPGRADE fill:#f1c40f,color:#333
    style CANCEL_REQ fill:#f1c40f,color:#333
```

**State Machine** (`SUBSCRIPTION_STATUS_TRANSITIONS`):
| From | To |
|------|-----|
| `trialing` | `active`, `cancelled` |
| `active` | `past_due`, `cancelled` |
| `past_due` | `active`, `suspended` |
| `suspended` | `active`, `cancelled` |
| `cancelled` | _(terminal)_ |

**Edge Functions**:
- `subscription-billing` — Generate tagihan berkala
- `subscription-payment` — Proses pembayaran
- `subscription-renewal` — Perpanjang langganan
- `subscription-grace-check` — Cek grace period

---

## 3. Property & Unit Management

Alur pengelolaan properti, unit, fasilitas, dan compliance documents.

```mermaid
flowchart TD
    START([Merchant Aktif]) --> ADD_PROP[Tambah Properti<br/>properties table]
    ADD_PROP --> SET_ADDR[Set Alamat Properti<br/>addresses table<br/>address_id FK]
    SET_ADDR --> NEARBY[Set Nearby Facilities<br/>nearby_facilities JSONB]
    NEARBY --> ADD_UNIT[Tambah Unit<br/>units table]

    ADD_UNIT --> UNIT_AVAIL([Unit Status: AVAILABLE])

    UNIT_AVAIL --> ASSIGN_FAC{Assign Fasilitas?}
    ASSIGN_FAC -->|Yes| FAC_TYPE[Pilih Facility Type<br/>facility_types table]
    FAC_TYPE --> FAC_ASSIGN[facility_assignments<br/>property_id / unit_id]
    FAC_ASSIGN --> UNIT_AVAIL
    ASSIGN_FAC -->|No| GUARDIAN_CHECK

    UNIT_AVAIL --> GUARDIAN_CHECK{Assign Guardian?}
    GUARDIAN_CHECK -->|Yes| GUARDIAN[Tambah Guardian<br/>guardians table]
    GUARDIAN --> UNIT_AVAIL
    GUARDIAN_CHECK -->|No| COMPLIANCE_CHECK

    UNIT_AVAIL --> COMPLIANCE_CHECK{Compliance Docs?}
    COMPLIANCE_CHECK -->|Yes| COMP_UPLOAD[Upload Dokumen<br/>compliance_documents]
    COMP_UPLOAD --> OCR_COMP["ocr-compliance-document<br/><<edge function>>"]
    OCR_COMP --> COMP_TRACK[Track Expiry Date]
    COMP_TRACK --> UNIT_AVAIL
    COMPLIANCE_CHECK -->|No| INSURANCE_CHECK

    UNIT_AVAIL --> INSURANCE_CHECK{Insurance?}
    INSURANCE_CHECK -->|Yes| INS_POLICY[Tambah Insurance Policy<br/>insurance_policies table]
    INS_POLICY --> UNIT_AVAIL
    INSURANCE_CHECK -->|No| RISK_CHECK

    UNIT_AVAIL --> RISK_CHECK{Disaster Risk?}
    RISK_CHECK -->|Yes| RISK_PROFILE[Set Risk Profile<br/>disaster_risk_profiles]
    RISK_PROFILE --> UNIT_AVAIL
    RISK_CHECK -->|No| READY

    UNIT_AVAIL --> READY([Properti Siap<br/>See Diagram 4, 5])

    subgraph UNIT_STATES [Unit Status Transitions]
        U_AVAIL([available]) -->|Contract Active| U_OCC([occupied])
        U_OCC -->|Contract End| U_AVAIL
        U_AVAIL -->|Maintenance| U_MAINT([maintenance])
        U_OCC -->|Maintenance| U_MAINT
        U_MAINT -->|Selesai| U_AVAIL
        U_MAINT -->|Selesai + Contract| U_OCC
    end

    subgraph ASSET_MGMT [Asset Management]
        ASSET_ADD[Tambah Asset<br/>assets table] --> ASSET_LABEL["ocr-asset-label<br/><<edge function>>"]
        ASSET_LABEL --> ASSET_TRACK[Track Depreciation<br/>useful_life_months<br/>salvage_value]
    end

    subgraph AUTO_SYNC [Auto-Sync Triggers]
        UNIT_COUNT_TRIGGER["update_property_unit_counts()<br/><<trigger>><br/>Auto-update total_units,<br/>occupied_units on unit INSERT/UPDATE/DELETE"]
        RENO_TRIGGER["update_property_renovation_total()<br/><<trigger>><br/>Auto-update renovation_cost<br/>on renovation record change"]
    end

    subgraph VACANCY [Vacancy Tracking]
        VAC_CRON["vacancy-tracking-cron<br/><<edge function>>"] --> VAC_SNAP["compute-occupancy-snapshots<br/><<edge function>>"]
        VAC_SNAP --> OCC_VIEW[merchant_occupancy_analysis<br/>materialized view]
    end

    style START fill:#2ecc71,color:#fff
    style UNIT_AVAIL fill:#2ecc71,color:#fff
    style READY fill:#2ecc71,color:#fff
    style U_AVAIL fill:#2ecc71,color:#fff
    style U_OCC fill:#3498db,color:#fff
    style U_MAINT fill:#e67e22,color:#fff
    style ASSIGN_FAC fill:#f1c40f,color:#333
    style GUARDIAN_CHECK fill:#f1c40f,color:#333
    style COMPLIANCE_CHECK fill:#f1c40f,color:#333
    style INSURANCE_CHECK fill:#f1c40f,color:#333
    style RISK_CHECK fill:#f1c40f,color:#333
```

**State Machine** (`UNIT_STATUS_TRANSITIONS`):
| From | To |
|------|-----|
| `available` | `occupied`, `maintenance` |
| `occupied` | `available`, `maintenance` |
| `maintenance` | `available`, `occupied` |

---

## 4. Contract Lifecycle

Alur kontrak dari draft hingga selesai/terminasi. Melibatkan tanda tangan digital merchant dan tenant.

```mermaid
flowchart TD
    START([Merchant Buat Kontrak]) --> VALIDATE[Validasi:<br/>- Unit belum ada kontrak aktif<br/>- Tenant belum ada kontrak aktif]
    VALIDATE --> DRAFT([Status: DRAFT<br/>signature_status: pending])

    DRAFT --> UPLOAD_DOC{Upload Contract Doc?}
    UPLOAD_DOC -->|Yes| DOC_UPLOAD[Upload PDF<br/>contract-documents bucket]
    DOC_UPLOAD --> OCR_CONTRACT["ocr-contract-document<br/><<edge function>>"]
    OCR_CONTRACT --> DRAFT
    UPLOAD_DOC -->|No| SIGN_FLOW

    DRAFT --> SIGN_FLOW{Siapa Tanda Tangan?}
    SIGN_FLOW -->|Merchant| M_SIGN[Merchant Sign<br/>merchant_signature_url<br/>merchant_signed_at]
    SIGN_FLOW -->|Tenant| T_SIGN[Tenant Sign<br/>tenant_signature_url<br/>tenant_signed_at]

    M_SIGN --> SIG_CHECK_M{Tenant Sudah Sign?}
    SIG_CHECK_M -->|Yes| FULLY_SIGNED([signature_status: FULLY_SIGNED])
    SIG_CHECK_M -->|No| M_SIGNED([signature_status: MERCHANT_SIGNED])

    T_SIGN --> SIG_CHECK_T{Merchant Sudah Sign?}
    SIG_CHECK_T -->|Yes| FULLY_SIGNED
    SIG_CHECK_T -->|No| T_SIGNED([signature_status: TENANT_SIGNED])

    M_SIGNED --> T_SIGN
    T_SIGNED --> M_SIGN

    FULLY_SIGNED --> ACTIVE([Contract Status: ACTIVE])
    FULLY_SIGNED --> UNIT_OCC["<<trigger>><br/>Unit status -> occupied<br/>See Diagram 3"]

    ACTIVE --> NOTICE_REQ{Move-Out Notice?}
    NOTICE_REQ -->|Yes| NOTICE([Status: NOTICE<br/>See Diagram 9])
    NOTICE --> COMPLETED([Status: COMPLETED])

    ACTIVE --> TERM_REQ{Early Termination?}
    TERM_REQ -->|Yes| TERMINATED([Status: TERMINATED<br/>See Diagram 9])

    ACTIVE --> EXPIRE{End Date Passed?}
    EXPIRE -->|Yes| EXPIRED([Status: EXPIRED])

    DRAFT --> CANCEL{Cancel Draft?}
    CANCEL -->|Yes| CANCELLED([Status: CANCELLED])

    COMPLETED --> UNIT_FREE["Unit status -> available<br/>See Diagram 3"]
    TERMINATED --> UNIT_FREE
    EXPIRED --> UNIT_FREE

    style START fill:#2ecc71,color:#fff
    style ACTIVE fill:#2ecc71,color:#fff
    style FULLY_SIGNED fill:#2ecc71,color:#fff
    style COMPLETED fill:#2ecc71,color:#fff
    style DRAFT fill:#3498db,color:#fff
    style M_SIGNED fill:#3498db,color:#fff
    style T_SIGNED fill:#3498db,color:#fff
    style NOTICE fill:#e67e22,color:#fff
    style TERMINATED fill:#e74c3c,color:#fff
    style EXPIRED fill:#e74c3c,color:#fff
    style CANCELLED fill:#e74c3c,color:#fff
    style SIGN_FLOW fill:#f1c40f,color:#333
    style SIG_CHECK_M fill:#f1c40f,color:#333
    style SIG_CHECK_T fill:#f1c40f,color:#333
    style NOTICE_REQ fill:#f1c40f,color:#333
    style TERM_REQ fill:#f1c40f,color:#333
    style EXPIRE fill:#f1c40f,color:#333
    style CANCEL fill:#f1c40f,color:#333
    style UPLOAD_DOC fill:#f1c40f,color:#333
```

**State Machine** (`CONTRACT_STATUS_TRANSITIONS`):
| From | To |
|------|-----|
| `draft` | `active`, `cancelled` |
| `pending_signature` | `active`, `cancelled` _(legacy)_ |
| `active` | `notice`, `terminated`, `expired` |
| `notice` | `completed` |
| `terminated` | _(terminal)_ |
| `expired` | _(terminal)_ |
| `completed` | _(terminal)_ |
| `cancelled` | _(terminal)_ |

**Signature Sub-States** (`CONTRACT_SIGNATURE_TRANSITIONS`):
| From | To |
|------|-----|
| `pending` | `merchant_signed`, `tenant_signed` |
| `merchant_signed` | `fully_signed` |
| `tenant_signed` | `fully_signed` |
| `fully_signed` | _(terminal — triggers active + unit occupied)_ |

---

## 5. Tenant Management Flow

Alur undangan tenant, pembuatan akun, dan linking ke kontrak/unit.

```mermaid
flowchart TD
    START([Merchant Invite Tenant]) --> CREATE_INV[Buat Invitation<br/>tenant_invitations table<br/>email, unit_id, rent_amount]
    CREATE_INV --> PENDING_INV([Invitation: PENDING])

    PENDING_INV --> TENANT_ACTION{Tenant Response?}
    TENANT_ACTION -->|Accept| ACCEPT_EF["accept-tenant-invitation<br/><<edge function>>"]
    TENANT_ACTION -->|Expired| EXPIRED_INV([Invitation: EXPIRED])
    TENANT_ACTION -->|No Response| CHECK_EXPIRE{Expiry Date Passed?}
    CHECK_EXPIRE -->|Yes| EXPIRED_INV
    CHECK_EXPIRE -->|No| PENDING_INV

    ACCEPT_EF --> HAS_ACCOUNT{Tenant Sudah Punya Akun?}
    HAS_ACCOUNT -->|No| CREATE_ACC["create-tenant-account<br/><<edge function>>"]
    CREATE_ACC --> ACCEPTED([Invitation: ACCEPTED])
    HAS_ACCOUNT -->|Yes| ACCEPTED

    ACCEPTED --> LINK_HISTORY[Record tenant_merchant_history<br/>merchant_id, tenant_user_id]
    LINK_HISTORY --> CREATE_CONTRACT[Buat Kontrak<br/>See Diagram 4]

    CREATE_CONTRACT --> TENANT_ACTIVE([Tenant Linked to Unit<br/>Contract Active])

    TENANT_ACTIVE --> CONTRACT_END{Kontrak Selesai?}
    CONTRACT_END -->|Yes| UNLINK[Unlink Tenant dari Unit<br/>Unit -> available]
    UNLINK --> HISTORY_UPDATE[Update History<br/>ended_at timestamp]

    subgraph TENANT_VIEW [Tenant Data Access]
        T_PROFILE[profiles table<br/>full_name, email, phone]
        T_HISTORY[tenant_merchant_history<br/>relationship tracking]
        T_METRICS["compute-tenant-payment-metrics<br/><<edge function>>"]
        T_RISK["ml-tenant-risk-score<br/><<edge function>>"]
        T_QUALITY["ml-tenant-quality-scoring<br/><<edge function>>"]
    end

    style START fill:#2ecc71,color:#fff
    style ACCEPTED fill:#2ecc71,color:#fff
    style TENANT_ACTIVE fill:#2ecc71,color:#fff
    style PENDING_INV fill:#3498db,color:#fff
    style EXPIRED_INV fill:#e74c3c,color:#fff
    style TENANT_ACTION fill:#f1c40f,color:#333
    style HAS_ACCOUNT fill:#f1c40f,color:#333
    style CHECK_EXPIRE fill:#f1c40f,color:#333
    style CONTRACT_END fill:#f1c40f,color:#333
```

**State Machine** (`TENANT_INVITATION_TRANSITIONS`):
| From | To |
|------|-----|
| `pending` | `accepted`, `expired` |
| `accepted` | _(terminal)_ |
| `expired` | _(terminal)_ |

**Edge Functions**:
- `accept-tenant-invitation` — Proses penerimaan undangan
- `create-tenant-account` — Buat akun tenant baru
- `get-tenant-invitation` — Ambil detail undangan

---

## 6. Invoice Lifecycle

Alur invoice dari auto-generate hingga pembayaran atau eskalasi overdue.

```mermaid
flowchart TD
    START(["Auto Generate<br/><<edge function>><br/>auto-generate-invoices"]) --> DRAFT([Status: DRAFT])
    MANUAL([Merchant Manual Create]) --> VALIDATE[Validasi:<br/>- Due date not past<br/>- No duplicate month]
    VALIDATE --> DRAFT

    DRAFT --> DENORM["<<trigger>><br/>Auto-populate:<br/>property_id, unit_id,<br/>tenant_name, unit_number"]
    DRAFT --> TRACK_STATUS["track_invoice_status_change()<br/><<trigger>><br/>Log every status change<br/>to invoice_status_history"]

    DRAFT --> SEND{Kirim Invoice?}
    SEND -->|Yes| SEND_PROC[Update status + issued_at<br/>Send email notification<br/><<send-notification>>]
    SEND_PROC --> SENT([Status: SENT])
    SEND -->|Cancel| CANCELLED_D([Status: CANCELLED])

    SENT --> PAY_CHECK{Pembayaran?}
    PAY_CHECK -->|Full| PAID([Status: PAID<br/>paid_at timestamp])
    PAY_CHECK -->|Partial| PARTIAL([Status: PARTIALLY_PAID])
    PAY_CHECK -->|Overdue| OVERDUE([Status: OVERDUE])
    PAY_CHECK -->|Cancel| CANCELLED_S([Status: CANCELLED])

    PARTIAL --> PAY_CHECK2{Pelunasan?}
    PAY_CHECK2 -->|Full| PAID
    PAY_CHECK2 -->|Cancel| CANCELLED_P([Status: CANCELLED])

    OVERDUE --> LATE_FEE[Create Late Fee Record<br/>late_fee_records table]
    LATE_FEE --> REMINDER["send-payment-reminder<br/><<edge function>>"]
    REMINDER --> PAY_OVERDUE{Dibayar?}
    PAY_OVERDUE -->|Yes| PAID
    PAY_OVERDUE -->|No| COLLECTIONS[Create Collections Case<br/>See Diagram 11]
    PAY_OVERDUE -->|Cancel| CANCELLED_O([Status: CANCELLED])

    OVERDUE --> PAY_PLAN{Payment Plan?}
    PAY_PLAN -->|Yes| PLAN_NEG[Negotiate Payment Plan<br/>See Diagram 6B]
    PAY_PLAN -->|No| REMINDER

    SENT --> GEN_PDF["generate-invoice-pdf<br/><<edge function>>"]
    SENT --> XENDIT["xendit-create-invoice<br/><<edge function>><br/>See Diagram 7"]

    style START fill:#2ecc71,color:#fff
    style MANUAL fill:#2ecc71,color:#fff
    style PAID fill:#2ecc71,color:#fff
    style DRAFT fill:#3498db,color:#fff
    style SENT fill:#3498db,color:#fff
    style PARTIAL fill:#e67e22,color:#fff
    style OVERDUE fill:#e74c3c,color:#fff
    style CANCELLED_D fill:#e74c3c,color:#fff
    style CANCELLED_S fill:#e74c3c,color:#fff
    style CANCELLED_P fill:#e74c3c,color:#fff
    style CANCELLED_O fill:#e74c3c,color:#fff
    style SEND fill:#f1c40f,color:#333
    style PAY_CHECK fill:#f1c40f,color:#333
    style PAY_CHECK2 fill:#f1c40f,color:#333
    style PAY_OVERDUE fill:#f1c40f,color:#333
    style PAY_PLAN fill:#f1c40f,color:#333
```

### 6B. Payment Plan Sub-Flow

```mermaid
flowchart TD
    START([Overdue Invoice]) --> NEGOTIATE[Merchant & Tenant<br/>Negotiate Terms]
    NEGOTIATE --> PENDING([Plan: PENDING_ACCEPTANCE])

    PENDING --> RESPONSE{Tenant Response?}
    RESPONSE -->|Accept| ACCEPTED([Plan: ACCEPTED])
    RESPONSE -->|Reject| CANCELLED([Plan: CANCELLED])

    ACCEPTED --> ACTIVATE[Activate Plan]
    ACTIVATE --> ACTIVE_PLAN([Plan: ACTIVE<br/>installments schedule])

    ACTIVE_PLAN --> CHECK["check-payment-plan<br/><<edge function>>"]
    CHECK --> INSTALL_OK{Semua Installment Lunas?}
    INSTALL_OK -->|Yes| COMPLETED([Plan: COMPLETED])
    INSTALL_OK -->|Miss Payments| DEFAULTED([Plan: DEFAULTED])

    style START fill:#e74c3c,color:#fff
    style COMPLETED fill:#2ecc71,color:#fff
    style ACTIVE_PLAN fill:#3498db,color:#fff
    style PENDING fill:#3498db,color:#fff
    style ACCEPTED fill:#2ecc71,color:#fff
    style CANCELLED fill:#e74c3c,color:#fff
    style DEFAULTED fill:#e74c3c,color:#fff
    style RESPONSE fill:#f1c40f,color:#333
    style INSTALL_OK fill:#f1c40f,color:#333
```

**State Machine** (`INVOICE_STATUS_TRANSITIONS`):
| From | To |
|------|-----|
| `draft` | `sent`, `cancelled` |
| `sent` | `paid`, `overdue`, `cancelled`, `partially_paid` |
| `overdue` | `paid`, `cancelled`, `escalated` |
| `escalated` | `paid`, `cancelled` |
| `partially_paid` | `paid`, `cancelled` |
| `pending` | `paid`, `overdue`, `cancelled` _(legacy)_ |
| `paid` | _(terminal)_ |
| `cancelled` | _(terminal)_ |

**Payment Plan** (`PAYMENT_PLAN_STATUS_TRANSITIONS`):
| From | To |
|------|-----|
| `pending_acceptance` | `accepted`, `cancelled` |
| `accepted` | `active` |
| `active` | `completed`, `defaulted` |

---

## 7. Payment & Payment Verification Flow

Alur pembayaran tenant, verifikasi OCR, dan integrasi Xendit payment gateway.

```mermaid
flowchart TD
    START([Invoice Sent]) --> PAY_METHOD{Metode Pembayaran?}

    PAY_METHOD -->|Manual Transfer| UPLOAD[Tenant Upload<br/>Bukti Transfer]
    UPLOAD --> OCR["ocr-payment-proof<br/><<edge function>>"]
    OCR --> VERIF_PENDING([payment_verifications<br/>Status: PENDING])
    VERIF_PENDING --> AUTO_MATCH{OCR Auto Match?}
    AUTO_MATCH -->|Yes| AUTO_MATCHED([Status: AUTO_MATCHED])
    AUTO_MATCH -->|No| MANUAL_REVIEW[Merchant Manual Review]

    AUTO_MATCHED --> MERCHANT_CONFIRM{Merchant Confirm?}
    MERCHANT_CONFIRM -->|Yes| CONFIRMED([Status: CONFIRMED])
    MERCHANT_CONFIRM -->|No| REJECTED([Status: REJECTED])

    MANUAL_REVIEW --> MERCHANT_CONFIRM

    CONFIRMED --> RECORD_PAY[Record Payment<br/>payments table]
    RECORD_PAY --> ESCROW["Masuk Escrow<br/>See Diagram 8"]
    RECORD_PAY --> INV_PAID["Invoice -> PAID<br/>See Diagram 6"]

    PAY_METHOD -->|Xendit Gateway| XENDIT_CREATE["xendit-create-invoice<br/><<edge function>>"]
    XENDIT_CREATE --> PAY_URL[Generate Payment URL<br/>Tenant redirect]
    PAY_URL --> TENANT_PAY[Tenant Bayar<br/>via Xendit]
    TENANT_PAY --> WEBHOOK["xendit-webhook<br/><<edge function>><br/>callback"]
    WEBHOOK --> WEBHOOK_OK{Payment Success?}
    WEBHOOK_OK -->|Yes| RECORD_PAY
    WEBHOOK_OK -->|No| FAILED([Payment Failed])

    PAY_METHOD -->|Auto Pay| AUTO_PAY["auto-pay-execute<br/><<edge function>>"]
    AUTO_PAY --> WEBHOOK

    style START fill:#2ecc71,color:#fff
    style CONFIRMED fill:#2ecc71,color:#fff
    style RECORD_PAY fill:#2ecc71,color:#fff
    style VERIF_PENDING fill:#3498db,color:#fff
    style AUTO_MATCHED fill:#3498db,color:#fff
    style REJECTED fill:#e74c3c,color:#fff
    style FAILED fill:#e74c3c,color:#fff
    style PAY_METHOD fill:#f1c40f,color:#333
    style AUTO_MATCH fill:#f1c40f,color:#333
    style MERCHANT_CONFIRM fill:#f1c40f,color:#333
    style WEBHOOK_OK fill:#f1c40f,color:#333
```

**State Machine** (`PAYMENT_VERIFICATION_TRANSITIONS`):
| From | To |
|------|-----|
| `pending` | `auto_matched`, `confirmed`, `rejected` |
| `auto_matched` | `confirmed`, `rejected` |
| `confirmed` | _(terminal)_ |
| `rejected` | _(terminal)_ |

**Payment Status** (`PAYMENT_STATUS_TRANSITIONS`):
| From | To |
|------|-----|
| `pending` | `paid`, `overdue`, `failed` |
| `overdue` | `paid` |
| `paid` | _(terminal)_ |
| `failed` | _(terminal)_ |

---

## 8. Escrow & Disbursement Flow

Alur dana masuk escrow dan pencairan ke rekening merchant.

```mermaid
flowchart TD
    START([Payment Confirmed]) --> ESC_TX[Create escrow_transaction<br/>type: deposit<br/>gross_amount, platform_fee, gateway_fee]
    ESC_TX --> ESC_PENDING([Escrow TX: PENDING])

    ESC_PENDING --> PROCESS{Processing?}
    PROCESS -->|Success| ESC_COMPLETED([Escrow TX: COMPLETED<br/>Update escrow_accounts.balance])
    PROCESS -->|Fail| ESC_FAILED([Escrow TX: FAILED])

    ESC_COMPLETED --> DISB_CHECK{Disbursement Eligible?}
    DISB_CHECK -->|Yes| DISB_CREATE[Create Disbursement<br/>disbursements table]
    DISB_CHECK -->|Scheduled| SCHEDULED["scheduled-disbursement<br/><<edge function>>"]
    SCHEDULED --> DISB_CREATE

    DISB_CREATE --> DISB_PENDING([Disbursement: PENDING])
    DISB_PENDING --> APPROVAL{Approval Required?}
    APPROVAL -->|Manual Review| REVIEW[Admin/Auto Review<br/>requires_manual_review flag]
    REVIEW --> REVIEW_OK{Approved?}
    REVIEW_OK -->|Yes| DISB_APPROVED([Status: APPROVED])
    REVIEW_OK -->|No| DISB_REJECTED([Status: REJECTED])
    APPROVAL -->|Auto| DISB_APPROVED

    DISB_APPROVED --> XENDIT_DISB["xendit-disbursement<br/><<edge function>>"]
    XENDIT_DISB --> DISB_PROCESSING([Status: PROCESSING])
    DISB_PROCESSING --> XENDIT_WH["xendit-disbursement-webhook<br/><<edge function>>"]
    XENDIT_WH --> DISB_RESULT{Result?}
    DISB_RESULT -->|Success| DISB_COMPLETED([Status: COMPLETED<br/>Merchant receives funds])
    DISB_RESULT -->|Fail| DISB_FAILED([Status: FAILED])
    DISB_FAILED --> RETRY{Retry?}
    RETRY -->|Yes| DISB_PENDING
    RETRY -->|No| DISB_FAILED_FINAL([Failed - Final])

    subgraph BANK_MGMT [Bank Account Management]
        BANK_ADD[Tambah Bank Account<br/>bank_accounts table]
        BANK_PRIMARY[Set Primary Account<br/>is_primary flag]
    end

    style START fill:#2ecc71,color:#fff
    style ESC_COMPLETED fill:#2ecc71,color:#fff
    style DISB_COMPLETED fill:#2ecc71,color:#fff
    style ESC_PENDING fill:#3498db,color:#fff
    style DISB_PENDING fill:#3498db,color:#fff
    style DISB_APPROVED fill:#3498db,color:#fff
    style DISB_PROCESSING fill:#3498db,color:#fff
    style ESC_FAILED fill:#e74c3c,color:#fff
    style DISB_REJECTED fill:#e74c3c,color:#fff
    style DISB_FAILED fill:#e74c3c,color:#fff
    style DISB_FAILED_FINAL fill:#e74c3c,color:#fff
    style PROCESS fill:#f1c40f,color:#333
    style DISB_CHECK fill:#f1c40f,color:#333
    style APPROVAL fill:#f1c40f,color:#333
    style REVIEW_OK fill:#f1c40f,color:#333
    style DISB_RESULT fill:#f1c40f,color:#333
    style RETRY fill:#f1c40f,color:#333
```

**State Machine** (`ESCROW_TRANSACTION_TRANSITIONS`):
| From | To |
|------|-----|
| `pending` | `completed`, `failed` |

**Disbursement** (`DISBURSEMENT_STATUS_TRANSITIONS`):
| From | To |
|------|-----|
| `pending` | `approved`, `rejected` |
| `approved` | `processing` |
| `processing` | `completed`, `failed` |
| `failed` | `pending` _(retry)_ |
| `completed` | _(terminal)_ |
| `rejected` | _(terminal)_ |

---

## 9. Move-Out & Deposit Refund Flow

Alur move-out notice, inspeksi, early termination, dan deposit refund/dispute.

```mermaid
flowchart TD
    START([Tenant/Merchant Initiate Move-Out]) --> NOTICE_TYPE{Jenis?}

    NOTICE_TYPE -->|Normal Notice| NOTICE_SUB[Submit move_out_notices<br/>notice_date, expected_move_out_date]
    NOTICE_SUB --> NOTICE_PENDING([Notice: SUBMITTED])
    NOTICE_PENDING --> ACK{Merchant Acknowledge?}
    ACK -->|Yes| NOTICE_ACK([Notice: ACKNOWLEDGED])
    ACK -->|Reject| NOTICE_REJ([Notice: REJECTED])
    NOTICE_ACK --> APPROVE{Approve Move-Out?}
    APPROVE -->|Yes| NOTICE_APPROVED([Notice: APPROVED])
    NOTICE_APPROVED --> INSPECTION_SCHED

    NOTICE_TYPE -->|Early Termination| ET_REQ[Submit early_termination_requests<br/>reason, requested_date]
    ET_REQ --> ET_PENDING([ET: PENDING_APPROVAL])
    ET_PENDING --> ET_DECISION{Merchant Decision?}
    ET_DECISION -->|Approve| ET_APPROVED([ET: APPROVED<br/>penalty_amount])
    ET_DECISION -->|Deny| ET_DENIED([ET: DENIED])
    ET_DECISION -->|Counter Offer| ET_COUNTER([ET: COUNTER_OFFERED<br/>counter_offer_amount])
    ET_COUNTER --> ET_DECISION2{Tenant Accept Counter?}
    ET_DECISION2 -->|Yes| ET_APPROVED
    ET_DECISION2 -->|No| ET_DENIED
    ET_APPROVED --> CONTRACT_TERM["Contract -> TERMINATED<br/>See Diagram 4"]
    ET_APPROVED --> INSPECTION_SCHED

    INSPECTION_SCHED[Schedule Inspection<br/>move_out_inspections] --> INSP_SCHED([Inspection: SCHEDULED])
    INSP_SCHED --> INSP_START[Start Inspection]
    INSP_START --> INSP_PROG([Inspection: IN_PROGRESS])
    INSP_PROG --> INSP_COMPLETE([Inspection: COMPLETED<br/>inspection results])

    INSP_COMPLETE --> TASKS[Move-Out Tasks<br/>move_out_tasks table<br/>timeline tracking]
    TASKS --> DEPOSIT_CALC[Calculate Deposit Refund<br/>original_deposit - deductions]

    DEPOSIT_CALC --> DEP_PENDING([Deposit: PENDING_PROCESSING])
    DEP_PENDING --> DEP_APPROVE{Approved?}
    DEP_APPROVE -->|Yes| DEP_APPROVED([Deposit: APPROVED])
    DEP_APPROVE -->|No| DEP_REJECTED([Deposit: REJECTED])

    DEP_APPROVED --> DEP_PROCESS["process-deposit-refund<br/><<edge function>>"]
    DEP_PROCESS --> DEP_PROCESSING([Deposit: PROCESSING])
    DEP_PROCESSING --> DEP_COMPLETE([Deposit: COMPLETED<br/>refunded_at])

    DEP_COMPLETE --> NOTICE_DONE([Notice: COMPLETED])
    NOTICE_DONE --> UNIT_FREE["Unit -> available<br/>See Diagram 3"]

    DEP_PENDING --> DISPUTE{Tenant Dispute?}
    DISPUTE -->|Yes| DISP_OPEN([deposit_disputes<br/>Status: OPEN])
    DISP_OPEN --> DISP_RESOLVE[Merchant Response<br/>Admin Resolution]
    DISP_RESOLVE --> DISP_RESOLVED([Dispute: RESOLVED<br/>resolved_amount])

    style START fill:#2ecc71,color:#fff
    style NOTICE_DONE fill:#2ecc71,color:#fff
    style DEP_COMPLETE fill:#2ecc71,color:#fff
    style ET_APPROVED fill:#2ecc71,color:#fff
    style INSP_COMPLETE fill:#2ecc71,color:#fff
    style DISP_RESOLVED fill:#2ecc71,color:#fff
    style NOTICE_PENDING fill:#3498db,color:#fff
    style NOTICE_ACK fill:#3498db,color:#fff
    style NOTICE_APPROVED fill:#3498db,color:#fff
    style INSP_SCHED fill:#3498db,color:#fff
    style INSP_PROG fill:#3498db,color:#fff
    style DEP_PENDING fill:#3498db,color:#fff
    style DEP_APPROVED fill:#3498db,color:#fff
    style DEP_PROCESSING fill:#3498db,color:#fff
    style ET_PENDING fill:#3498db,color:#fff
    style NOTICE_REJ fill:#e74c3c,color:#fff
    style ET_DENIED fill:#e74c3c,color:#fff
    style DEP_REJECTED fill:#e74c3c,color:#fff
    style ET_COUNTER fill:#e67e22,color:#fff
    style DISP_OPEN fill:#e67e22,color:#fff
    style NOTICE_TYPE fill:#f1c40f,color:#333
    style ACK fill:#f1c40f,color:#333
    style APPROVE fill:#f1c40f,color:#333
    style ET_DECISION fill:#f1c40f,color:#333
    style ET_DECISION2 fill:#f1c40f,color:#333
    style DEP_APPROVE fill:#f1c40f,color:#333
    style DISPUTE fill:#f1c40f,color:#333
```

**State Machines**:

Move-Out Notice (`MOVE_OUT_NOTICE_TRANSITIONS`):
| From | To |
|------|-----|
| `submitted` | `acknowledged`, `rejected` |
| `acknowledged` | `approved` |
| `approved` | `completed` |

Move-Out Inspection (`MOVE_OUT_INSPECTION_TRANSITIONS`):
| From | To |
|------|-----|
| `scheduled` | `in_progress` |
| `in_progress` | `completed` |

Early Termination (`EARLY_TERMINATION_TRANSITIONS`):
| From | To |
|------|-----|
| `pending_approval` | `approved`, `denied`, `counter_offered` |
| `counter_offered` | `approved`, `denied` |

Deposit Refund (`DEPOSIT_REFUND_TRANSITIONS`):
| From | To |
|------|-----|
| `pending_processing` | `approved`, `rejected` |
| `approved` | `processing` |
| `processing` | `completed` |

---

## 10. Maintenance Request Lifecycle

Alur permintaan maintenance dari tenant, penugasan vendor, hingga penyelesaian.

```mermaid
flowchart TD
    START([Tenant Submit Request]) --> CREATE[Create maintenance_requests<br/>title, description, priority]
    CREATE --> PENDING([Status: PENDING])
    PENDING --> SLA["<<trigger>><br/>Set SLA Deadline<br/>based on priority"]

    PENDING --> MERCHANT_ACT{Merchant Action?}
    MERCHANT_ACT -->|Assign Vendor| VENDOR_ASSIGN[Assign vendor_jobs<br/>vendor_id, description]
    MERCHANT_ACT -->|Handle Self| IN_PROGRESS([Status: IN_PROGRESS])
    MERCHANT_ACT -->|Cancel| CANCELLED([Status: CANCELLED])

    VENDOR_ASSIGN --> VJ_PENDING([Vendor Job: PENDING])
    VJ_PENDING --> VENDOR_RESP{Vendor Response?}
    VENDOR_RESP -->|Accept| VJ_ACCEPTED([VJ: ACCEPTED])
    VENDOR_RESP -->|Reject| VJ_REJECTED([VJ: REJECTED])
    VJ_REJECTED --> MERCHANT_ACT

    VJ_ACCEPTED --> VJ_PROGRESS([VJ: IN_PROGRESS])
    VJ_PROGRESS --> IN_PROGRESS

    IN_PROGRESS --> EXPENSE{Track Expenses?}
    EXPENSE -->|Yes| EXP_RECORD[Record maintenance_expenses<br/>amount, receipt]
    EXP_RECORD --> OCR_RECEIPT["ocr-maintenance-receipt<br/><<edge function>>"]
    OCR_RECEIPT --> IN_PROGRESS
    EXPENSE -->|No| WORK_DONE

    IN_PROGRESS --> TIMELINE[Update maintenance_timeline<br/>status updates, notes]

    IN_PROGRESS --> WORK_DONE{Work Completed?}
    WORK_DONE -->|Yes| COMPLETED([Status: COMPLETED])
    WORK_DONE -->|Cancel| CANCELLED

    VJ_PROGRESS --> VJ_COMPLETE{Vendor Done?}
    VJ_COMPLETE -->|Yes| VJ_COMPLETED([VJ: COMPLETED])
    VJ_COMPLETED --> WORK_DONE
    VJ_COMPLETE -->|Cancel| VJ_CANCELLED([VJ: CANCELLED])

    COMPLETED --> REVIEW{Tenant Review?}
    REVIEW -->|Yes| RATING[maintenance_reviews<br/>rating, comment]
    REVIEW -->|No| DONE([Request Closed])
    RATING --> VENDOR_RATING["update_vendor_maintenance_rating()<br/><<trigger>><br/>Recalculate vendor avg rating"]
    VENDOR_RATING --> DONE

    COMPLETED --> DSS_MAINT["dss-maintenance-priority<br/><<edge function>><br/>See Diagram 12"]

    style START fill:#2ecc71,color:#fff
    style COMPLETED fill:#2ecc71,color:#fff
    style VJ_COMPLETED fill:#2ecc71,color:#fff
    style DONE fill:#2ecc71,color:#fff
    style PENDING fill:#3498db,color:#fff
    style IN_PROGRESS fill:#3498db,color:#fff
    style VJ_PENDING fill:#3498db,color:#fff
    style VJ_ACCEPTED fill:#3498db,color:#fff
    style VJ_PROGRESS fill:#3498db,color:#fff
    style CANCELLED fill:#e74c3c,color:#fff
    style VJ_REJECTED fill:#e74c3c,color:#fff
    style VJ_CANCELLED fill:#e74c3c,color:#fff
    style MERCHANT_ACT fill:#f1c40f,color:#333
    style VENDOR_RESP fill:#f1c40f,color:#333
    style EXPENSE fill:#f1c40f,color:#333
    style WORK_DONE fill:#f1c40f,color:#333
    style VJ_COMPLETE fill:#f1c40f,color:#333
    style REVIEW fill:#f1c40f,color:#333
```

**State Machine** (`MAINTENANCE_STATUS_TRANSITIONS`):
| From | To |
|------|-----|
| `pending` | `in_progress`, `cancelled` |
| `in_progress` | `completed`, `cancelled` |

**Vendor Job** (`VENDOR_JOB_STATUS_TRANSITIONS`):
| From | To |
|------|-----|
| `pending` | `accepted`, `rejected` |
| `accepted` | `in_progress`, `cancelled` |
| `in_progress` | `completed`, `cancelled` |

---

## 11. Billing Analytics & Collections

Alur eskalasi overdue, collections case, dan analitik pembayaran.

```mermaid
flowchart TD
    START(["check-overdue-escalation<br/><<edge function>>"]) --> SCAN[Scan Overdue Invoices<br/>past due_date]
    SCAN --> CREATE_CASE[Create collections_cases<br/>days_overdue, total_due,<br/>escalation_level]
    CREATE_CASE --> INITIATED([Case: INITIATED])

    INITIATED --> CONTACT[Contact Tenant<br/>last_contact_at]
    CONTACT --> IN_PROGRESS([Case: IN_PROGRESS])

    IN_PROGRESS --> STRATEGY["dss-collection-strategy<br/><<edge function>><br/>See Diagram 12"]
    STRATEGY --> ACTION{Strategy Action?}
    ACTION -->|Payment Reminder| REMINDER["send-payment-reminder<br/><<edge function>>"]
    ACTION -->|WhatsApp| WA["whatsapp-notification<br/><<edge function>>"]
    ACTION -->|Payment Plan| PLAN[Negotiate Plan<br/>See Diagram 6B]
    ACTION -->|Escalate| ESCALATE[Increase escalation_level<br/>next_action_date]
    ESCALATE --> IN_PROGRESS

    REMINDER --> RESULT{Resolved?}
    WA --> RESULT
    PLAN --> RESULT
    RESULT -->|Yes| RESOLVED([Case: RESOLVED<br/>resolution_type])
    RESULT -->|No| IN_PROGRESS

    subgraph ANALYTICS [Payment Analytics]
        METRICS["compute-tenant-payment-metrics<br/><<edge function>>"]
        RISK_SCORE["ml-tenant-risk-score<br/><<edge function>>"]
        FIN_ANALYTICS["ml-financial-analytics<br/><<edge function>>"]
    end

    subgraph RESOLUTION_TYPES [Resolution Types]
        R1[paid_in_full]
        R2[payment_plan]
        R3[write_off]
        R4[eviction]
    end

    style START fill:#e74c3c,color:#fff
    style RESOLVED fill:#2ecc71,color:#fff
    style INITIATED fill:#3498db,color:#fff
    style IN_PROGRESS fill:#3498db,color:#fff
    style ACTION fill:#f1c40f,color:#333
    style RESULT fill:#f1c40f,color:#333
```

**State Machine** (`COLLECTIONS_CASE_TRANSITIONS`):
| From | To |
|------|-----|
| `initiated` | `in_progress` |
| `in_progress` | `resolved` |
| `resolved` | _(terminal — resolution_type: paid_in_full, payment_plan, write_off, eviction)_ |

> **Cross-Reference**: Lihat juga [Diagram 16 (Automated Reminders)](#16-automated-payment-reminders--escalation) untuk auto-create case di T+15, dan [Diagram 20 (Collections Extended)](#20-collections-case-management-extended) untuk payment plan & resolution strategy.

---

## 12. AI/ML & DSS Advisory Flow

Alur Decision Support System dan Machine Learning models untuk merchant.

```mermaid
flowchart TD
    subgraph DSS [Decision Support System - Edge Functions]
        DSS_PRICE["dss-pricing-advisor<br/><<edge function>>"]
        DSS_MAINT["dss-maintenance-priority<br/><<edge function>>"]
        DSS_COLLECT["dss-collection-strategy<br/><<edge function>>"]
        DSS_INVEST["dss-investment-insight<br/><<edge function>>"]
    end

    subgraph ML [Machine Learning Models - Edge Functions]
        ML_CHURN["ml-churn-prediction<br/><<edge function>>"]
        ML_OCC["ml-occupancy-forecast<br/><<edge function>>"]
        ML_REV["ml-revenue-forecast<br/><<edge function>>"]
        ML_RISK["ml-risk-assessment<br/><<edge function>>"]
        ML_TENANT["ml-tenant-quality-scoring<br/><<edge function>>"]
        ML_PRICE["ml-optimal-pricing<br/><<edge function>>"]
        ML_INTEL["ml-price-intelligence<br/><<edge function>>"]
        ML_T_RISK["ml-tenant-risk-score<br/><<edge function>>"]
        ML_FIN["ml-financial-analytics<br/><<edge function>>"]
        ML_DQ["ml-data-quality-check<br/><<edge function>>"]
    end

    subgraph OCR [OCR Processing - Edge Functions]
        OCR_KTP["ocr-ktp-extract"]
        OCR_PAY["ocr-payment-proof"]
        OCR_MAINT["ocr-maintenance-receipt"]
        OCR_COMP["ocr-compliance-document"]
        OCR_CONTRACT["ocr-contract-document"]
        OCR_BIZ["ocr-business-document"]
        OCR_ASSET["ocr-asset-label"]
        OCR_CORRECT["ml-ocr-correction-suggest"]
    end

    DSS_PRICE --> REC_GEN([dss_recommendations<br/>Status: GENERATED])
    DSS_MAINT --> REC_GEN
    DSS_COLLECT --> REC_GEN
    DSS_INVEST --> REC_GEN

    ML_CHURN --> ML_RUN[ml_model_runs<br/>model_type, results]
    ML_OCC --> ML_RUN
    ML_REV --> ML_RUN
    ML_RISK --> ML_RUN
    ML_TENANT --> ML_RUN
    ML_PRICE --> ML_RUN
    ML_INTEL --> ML_RUN
    ML_T_RISK --> ML_RUN
    ML_FIN --> ML_RUN
    ML_DQ --> DQ_CHECK[data_quality_checks<br/>quality_score]

    ML_RUN --> REC_GEN

    REC_GEN --> VIEWED{Merchant View?}
    VIEWED -->|Yes| REC_VIEWED([Status: VIEWED])
    REC_VIEWED --> DECISION{Accept / Reject?}
    DECISION -->|Accept| REC_ACCEPTED([Status: ACCEPTED])
    DECISION -->|Reject| REC_REJECTED([Status: REJECTED<br/>rejection_reason])

    REC_ACCEPTED --> IMPLEMENT[Implement Recommendation]
    IMPLEMENT --> MEASURE[Measure Impact<br/>measured_impact JSONB]
    MEASURE --> REC_MEASURED([Status: MEASURED])

    OCR_KTP --> OCR_RESULT[ocr_results table]
    OCR_PAY --> OCR_RESULT
    OCR_MAINT --> OCR_RESULT
    OCR_COMP --> OCR_RESULT
    OCR_CONTRACT --> OCR_RESULT
    OCR_BIZ --> OCR_RESULT
    OCR_ASSET --> OCR_RESULT
    OCR_RESULT --> OCR_STATUS{OCR Status?}
    OCR_STATUS -->|Success| OCR_COMPLETED([OCR: COMPLETED])
    OCR_STATUS -->|Needs Review| OCR_REVIEW([OCR: REQUIRES_REVIEW])
    OCR_STATUS -->|Fail| OCR_FAILED([OCR: FAILED])
    OCR_REVIEW --> OCR_CORRECT
    OCR_CORRECT --> OCR_COMPLETED

    style REC_GEN fill:#3498db,color:#fff
    style REC_VIEWED fill:#3498db,color:#fff
    style REC_ACCEPTED fill:#2ecc71,color:#fff
    style REC_MEASURED fill:#2ecc71,color:#fff
    style OCR_COMPLETED fill:#2ecc71,color:#fff
    style REC_REJECTED fill:#e74c3c,color:#fff
    style OCR_FAILED fill:#e74c3c,color:#fff
    style OCR_REVIEW fill:#e67e22,color:#fff
    style VIEWED fill:#f1c40f,color:#333
    style DECISION fill:#f1c40f,color:#333
    style OCR_STATUS fill:#f1c40f,color:#333
```

**DSS Recommendation** (`DSS_RECOMMENDATION_TRANSITIONS`):
| From | To |
|------|-----|
| `generated` | `viewed`, `accepted`, `rejected` |
| `viewed` | `accepted`, `rejected` |
| `accepted` | `measured` |

**OCR Result** (`OCR_RESULT_TRANSITIONS`):
| From | To |
|------|-----|
| `processing` | `completed`, `failed`, `requires_review` |
| `requires_review` | `completed`, `failed` |

---

## 13. Referral System

Alur referral merchant, tracking komisioner, dan reward processing.

```mermaid
flowchart TD
    START([Merchant Generate Code]) --> CODE[Create Referral Code<br/>referrals table<br/>referral_code, referrer_merchant_id]
    CODE --> SHARE[Share Code ke Calon Merchant]

    SHARE --> REFEREE[Referee Sign Up<br/>menggunakan referral_code]
    REFEREE --> REF_PENDING([Referral: PENDING])

    REF_PENDING --> VERIFY{Referee Verified?}
    VERIFY -->|Yes| REF_ACTIVE([Referral: ACTIVE<br/>referee_merchant_id linked])
    VERIFY -->|Expired| REF_EXPIRED([Referral: EXPIRED])
    VERIFY -->|No Response| CHECK_EXP{Expiry Passed?}
    CHECK_EXP -->|Yes| REF_EXPIRED
    CHECK_EXP -->|No| REF_PENDING

    REF_ACTIVE --> SUBSCRIBE{Referee Subscribe?}
    SUBSCRIBE -->|Yes| REF_COMPLETED([Referral: COMPLETED])

    REF_COMPLETED --> COMMISSION["process-referral-commissions<br/><<edge function>>"]
    COMMISSION --> COMM_RECORD[referral_commissions<br/>amount, tier_percentage]

    REF_COMPLETED --> REWARD["process-referral-reward<br/><<edge function>>"]
    REWARD --> REWARD_RECORD[Apply Reward to Referrer<br/>discount on subscription]

    subgraph VENDOR_REF [Vendor Order Referral]
        VREF_ORDER[Vendor Order Created] --> VREF_CHECK{Has Referral?}
        VREF_CHECK -->|Yes| VREF_PROCESS["process-vendor-order-referral<br/><<edge function>>"]
        VREF_PROCESS --> VREF_COMM[Vendor Referral Commission]
    end

    style START fill:#2ecc71,color:#fff
    style REF_COMPLETED fill:#2ecc71,color:#fff
    style REF_ACTIVE fill:#3498db,color:#fff
    style REF_PENDING fill:#3498db,color:#fff
    style REF_EXPIRED fill:#e74c3c,color:#fff
    style VERIFY fill:#f1c40f,color:#333
    style CHECK_EXP fill:#f1c40f,color:#333
    style SUBSCRIBE fill:#f1c40f,color:#333
    style VREF_CHECK fill:#f1c40f,color:#333
```

**State Machine** (`REFERRAL_STATUS_TRANSITIONS`):
| From | To |
|------|-----|
| `pending` | `active`, `expired` |
| `active` | `completed` |
| `completed` | _(terminal)_ |
| `expired` | _(terminal)_ |

---

## 14. Support, Feedback & Compliance

Alur support live chat, feedback, compliance tracking, insurance, security, dan audit.

```mermaid
flowchart TD
    subgraph CHAT [Live Chat Support]
        CHAT_START([User Start Chat]) --> CONV[Create chat_conversations<br/>title, context]
        CONV --> MSG[Send chat_messages<br/>role: user/assistant]
        MSG --> AI_BOT["ai-chatbot / merchant-ai-assistant<br/><<edge function>>"]
        AI_BOT --> RESPONSE[AI Response<br/>chat_messages role: assistant]
        RESPONSE --> ANALYTICS_CHAT[chatbot_analytics<br/>query_type, response_time_ms]
        RESPONSE --> MSG
    end

    subgraph FEEDBACK [Merchant Feedback]
        FB_SUBMIT([Merchant Submit Feedback]) --> FB_RECORD[merchant_feedback table<br/>category, content, rating]
        FB_RECORD --> FB_PENDING([Feedback Recorded])
        FB_PENDING --> ADMIN_RESP{Admin Response?}
        ADMIN_RESP -->|Yes| FB_RESPONDED([admin_response filled])
        ADMIN_RESP -->|No| FB_PENDING
    end

    subgraph COMPLIANCE [Compliance Documents]
        COMP_UPLOAD([Upload Document]) --> COMP_DOC[compliance_documents<br/>document_type, expiry_date]
        COMP_DOC --> OCR_COMP_DOC["ocr-compliance-document<br/><<edge function>>"]
        OCR_COMP_DOC --> COMP_ACTIVE([Document Active])
        COMP_ACTIVE --> EXPIRY_CHECK{Approaching Expiry?}
        EXPIRY_CHECK -->|Yes| COMP_ALERT[Send Renewal Alert]
        COMP_ALERT --> COMP_UPLOAD
        EXPIRY_CHECK -->|No| COMP_ACTIVE
    end

    subgraph INSURANCE [Insurance Management]
        INS_CREATE([Create Policy]) --> INS_POLICY[insurance_policies<br/>provider, coverage_amount<br/>premium, expiry]
        INS_POLICY --> INS_ACTIVE([Policy Active])
        INS_ACTIVE --> CLAIM{File Claim?}
        CLAIM -->|Yes| INS_CLAIM[insurance_claims<br/>incident_date, claim_amount]
        INS_CLAIM --> CLAIM_STATUS{Claim Result?}
        CLAIM_STATUS -->|Approved| CLAIM_PAID([Claim Paid<br/>settlement_amount])
        CLAIM_STATUS -->|Denied| CLAIM_DENIED([Claim Denied])
    end

    subgraph SECURITY [Security & Risk]
        SEC_INC([Security Incident]) --> SEC_RECORD[security_incidents<br/>incident_type, severity]
        SEC_RECORD --> SEC_RESOLVE[Investigation & Resolution]

        RISK_ASSESS[disaster_risk_profiles<br/>flood, earthquake, fire,<br/>landslide risk levels]
    end

    subgraph DISPUTE_MGMT [Dispute Management]
        DISP_CREATE([Create Dispute]) --> DISP_OPEN([disputes: OPEN])
        DISP_OPEN --> DISP_PROG([IN_PROGRESS])
        DISP_PROG --> DISP_END{Resolution?}
        DISP_END -->|Resolved| DISP_RESOLVED([RESOLVED])
        DISP_END -->|Closed| DISP_CLOSED([CLOSED])
    end

    subgraph AUDIT [Audit & Data Quality]
        AUDIT_LOG[audit_logs<br/>action, entity_type,<br/>old_data, new_data]
        DQ_CHECK["ml-data-quality-check<br/><<edge function>>"]
        DQ_RECORD[data_quality_checks<br/>quality_score,<br/>validation_results]
        DSS_VAL[dss_validation_logs<br/>validation_type,<br/>validation_result]
        DQ_CHECK --> DQ_RECORD
    end

    subgraph DATA_EXPORT [Data Export & GDPR]
        EXPORT["data-export<br/><<edge function>>"]
        GDPR["gdpr-data-request<br/><<edge function>>"]
    end

    style CHAT_START fill:#2ecc71,color:#fff
    style FB_SUBMIT fill:#2ecc71,color:#fff
    style COMP_UPLOAD fill:#2ecc71,color:#fff
    style INS_CREATE fill:#2ecc71,color:#fff
    style DISP_RESOLVED fill:#2ecc71,color:#fff
    style CLAIM_PAID fill:#2ecc71,color:#fff
    style FB_RESPONDED fill:#2ecc71,color:#fff
    style COMP_ACTIVE fill:#2ecc71,color:#fff
    style INS_ACTIVE fill:#2ecc71,color:#fff
    style DISP_OPEN fill:#3498db,color:#fff
    style DISP_PROG fill:#3498db,color:#fff
    style FB_PENDING fill:#3498db,color:#fff
    style CLAIM_DENIED fill:#e74c3c,color:#fff
    style DISP_CLOSED fill:#e74c3c,color:#fff
    style DISP_END fill:#f1c40f,color:#333
    style CLAIM_STATUS fill:#f1c40f,color:#333
    style EXPIRY_CHECK fill:#f1c40f,color:#333
    style ADMIN_RESP fill:#f1c40f,color:#333
    style CLAIM fill:#f1c40f,color:#333
```

**Dispute** (`DISPUTE_STATUS_TRANSITIONS`):
| From | To |
|------|-----|
| `open` | `in_progress` |
| `in_progress` | `resolved`, `closed` |

---

## 15. Payment Reconciliation (Auto-Match)

Alur rekonsiliasi pembayaran otomatis. Sistem 3-tier matching: exact, partial, dan manual review. Sumber: `reconciliationService.ts`, edge function `auto-match-payment`.

```mermaid
flowchart TD
    START([Payment Recorded<br/>status: paid]) --> CHECK_RECON{reconciliation_status?}

    CHECK_RECON -->|unmatched| TRIGGER_AUTO[Trigger Auto-Match<br/>supabase.functions.invoke<br/>auto-match-payment]
    CHECK_RECON -->|pending_review| MANUAL_QUEUE([Manual Review Queue])
    CHECK_RECON -->|auto_matched| DONE_AUTO([Already Matched])
    CHECK_RECON -->|manually_matched| DONE_MANUAL([Already Matched])

    TRIGGER_AUTO --> FETCH_INV[Fetch Candidate Invoices<br/>same tenant + contract<br/>status: sent/overdue/escalated/partially_paid]

    FETCH_INV --> HAS_INV{Invoices Found?}
    HAS_INV -->|No| TIER3_NO([Tier 3: Manual Review<br/>reconciliation_status = pending_review])

    HAS_INV -->|Yes| TIER1{Tier 1: Exact Match?<br/>amount = total_amount}
    TIER1 -->|Yes| EXACT_MATCH[Create payment_invoice_match<br/>match_type: auto_exact<br/>confidence: 1.0]
    EXACT_MATCH --> UPDATE_PAY_1[reconciliation_status = auto_matched]
    UPDATE_PAY_1 --> UPDATE_INV_1[Invoice status = paid<br/>paid_at = timestamp]
    UPDATE_INV_1 --> MATCHED_DONE([Auto-Match Complete])

    TIER1 -->|No| TIER2{Tier 2: Partial/Over?}
    TIER2 -->|Partial| PARTIAL_MATCH[Create match<br/>match_type: auto_partial<br/>confidence: 0.7]
    PARTIAL_MATCH --> UPDATE_PAY_2[reconciliation_status = pending_review]
    UPDATE_PAY_2 --> UPDATE_INV_2[Invoice status = partially_paid]

    TIER2 -->|Overpayment| OVER_MATCH[Create match<br/>match_type: auto_partial<br/>note surplus amount]
    OVER_MATCH --> UPDATE_PAY_2

    UPDATE_INV_2 --> MERCHANT_REVIEW([Merchant Review Queue])

    MERCHANT_REVIEW --> MANUAL_ACT{Merchant Action?}
    MANUAL_ACT -->|Confirm| MANUAL_CONFIRM[Manual Match<br/>reconciliation_status = manually_matched]
    MANUAL_ACT -->|Reject| MANUAL_REJECT[Keep pending_review]

    MANUAL_CONFIRM --> INV_UPDATE_FINAL{amount >= total_amount?}
    INV_UPDATE_FINAL -->|Yes| INV_PAID([Invoice: PAID])
    INV_UPDATE_FINAL -->|No| INV_PARTIAL([Invoice: PARTIALLY_PAID])

    subgraph HISTORY [Match History]
        HIST_VIEW[Fetch payment_invoice_match<br/>order by created_at DESC<br/>limit 50]
    end

    style START fill:#2ecc71,color:#fff
    style MATCHED_DONE fill:#2ecc71,color:#fff
    style INV_PAID fill:#2ecc71,color:#fff
    style DONE_AUTO fill:#2ecc71,color:#fff
    style DONE_MANUAL fill:#2ecc71,color:#fff
    style TIER3_NO fill:#e74c3c,color:#fff
    style MANUAL_REJECT fill:#e74c3c,color:#fff
    style MERCHANT_REVIEW fill:#3498db,color:#fff
    style MANUAL_QUEUE fill:#3498db,color:#fff
    style INV_PARTIAL fill:#e67e22,color:#fff
    style CHECK_RECON fill:#f1c40f,color:#333
    style HAS_INV fill:#f1c40f,color:#333
    style TIER1 fill:#f1c40f,color:#333
    style TIER2 fill:#f1c40f,color:#333
    style MANUAL_ACT fill:#f1c40f,color:#333
    style INV_UPDATE_FINAL fill:#f1c40f,color:#333
```

**Reconciliation Status Values**:
| Status | Deskripsi |
|--------|-----------|
| `unmatched` | Pembayaran baru, belum dicocokkan |
| `pending_review` | Tier 2/3 — perlu review merchant |
| `auto_matched` | Tier 1 — otomatis cocok (exact) |
| `manually_matched` | Dicocokkan manual oleh merchant |

---

## 16. Automated Payment Reminders & Escalation

Alur pengingat pembayaran otomatis dan eskalasi ke collections. Dijalankan oleh cron daily via edge function `queue-payment-reminders`.

```mermaid
flowchart TD
    START(["Cron Daily<br/>queue-payment-reminders<br/><<edge function>>"]) --> SCAN[Scan Overdue Invoices<br/>status: sent/overdue/escalated/partially_paid<br/>due_date < today]

    SCAN --> HAS_OVERDUE{Ada Invoice Overdue?}
    HAS_OVERDUE -->|No| DONE_EMPTY([No Processing Needed])
    HAS_OVERDUE -->|Yes| GROUP[Group by Merchant]

    GROUP --> LOOP_MERCHANT[For Each Merchant]
    LOOP_MERCHANT --> CHECK_CONFIG{Reminder Config Enabled?}
    CHECK_CONFIG -->|No| SKIP_MERCHANT([Skip Merchant])
    CHECK_CONFIG -->|Yes| LOOP_INV[For Each Invoice]

    LOOP_INV --> CALC_DAYS[Calculate days_overdue<br/>today - due_date]
    CALC_DAYS --> MATCH_SCHED[Match Schedule Entry<br/>filter: days_overdue <= actual<br/>sort: largest first]

    MATCH_SCHED --> HAS_MATCH{Schedule Match?}
    HAS_MATCH -->|No| SKIP_INV([Skip Invoice])
    HAS_MATCH -->|Yes| DEDUP_CHECK{Already Sent<br/>This Level?}

    DEDUP_CHECK -->|Yes| SKIP_INV
    DEDUP_CHECK -->|No| LOG_REMINDER[Insert payment_reminders_log<br/>reminder_type: tone<br/>channel: email/sms/whatsapp<br/>escalation_level: days_overdue<br/>status: sent]

    LOG_REMINDER --> CHECK_T15{days_overdue >= 15?}
    CHECK_T15 -->|No| NEXT_INV([Next Invoice])
    CHECK_T15 -->|Yes| CHECK_CASE{Collections Case Exists?}

    CHECK_CASE -->|Yes| NEXT_INV
    CHECK_CASE -->|No| CREATE_CASE[Auto-Create collections_cases<br/>status: initiated<br/>escalation_level: 1<br/>See Diagram 11, 20]

    CREATE_CASE --> CHECK_ESCALATE{Invoice status = overdue?}
    CHECK_ESCALATE -->|Yes| ESCALATE_INV[Invoice status = escalated<br/>See Diagram 6]
    CHECK_ESCALATE -->|No| NEXT_INV
    ESCALATE_INV --> NEXT_INV

    style START fill:#2ecc71,color:#fff
    style DONE_EMPTY fill:#2ecc71,color:#fff
    style LOG_REMINDER fill:#3498db,color:#fff
    style CREATE_CASE fill:#e74c3c,color:#fff
    style ESCALATE_INV fill:#e74c3c,color:#fff
    style SKIP_MERCHANT fill:#e74c3c,color:#fff
    style HAS_OVERDUE fill:#f1c40f,color:#333
    style CHECK_CONFIG fill:#f1c40f,color:#333
    style HAS_MATCH fill:#f1c40f,color:#333
    style DEDUP_CHECK fill:#f1c40f,color:#333
    style CHECK_T15 fill:#f1c40f,color:#333
    style CHECK_CASE fill:#f1c40f,color:#333
    style CHECK_ESCALATE fill:#f1c40f,color:#333
```

**Reminder Config** (`merchants.collections_reminder_config` JSONB):
```json
{
  "enabled": true,
  "schedule": [
    { "days_overdue": 1, "channel": "email", "tone": "friendly" },
    { "days_overdue": 7, "channel": "sms", "tone": "firm" },
    { "days_overdue": 15, "channel": "whatsapp", "tone": "urgent" }
  ]
}
```

---

## 17. Expense Tracking

Alur pengelolaan pengeluaran operasional merchant. Sumber: `expenseService.ts`.

```mermaid
flowchart TD
    START([Merchant Buka Expense]) --> FETCH_SUMMARY[Fetch Summary<br/>expenseService.fetchSummary]

    FETCH_SUMMARY --> SUMMARY_VIEW[Tampilkan Summary:<br/>- Total bulan ini vs bulan lalu<br/>- Jumlah transaksi<br/>- Trend % perubahan<br/>- Breakdown per kategori]

    SUMMARY_VIEW --> ACTION{Aksi Merchant?}
    ACTION -->|Tambah| ADD_EXPENSE[Input Expense:<br/>category, amount, expense_date<br/>payment_method, notes<br/>is_recurring, tax_deductible]
    ACTION -->|Lihat Daftar| LIST_EXPENSES[Fetch Expenses<br/>order by expense_date DESC<br/>limit 50]
    ACTION -->|Hapus| DELETE_EXPENSE[Delete Expense<br/>expenseService.deleteExpense]

    ADD_EXPENSE --> SAVE[Insert expenses table<br/>approval_status: submitted]
    SAVE --> REFRESH([Refresh Summary])
    REFRESH --> SUMMARY_VIEW

    LIST_EXPENSES --> DETAIL_VIEW[Tampilkan List:<br/>category, amount, date<br/>payment_method, status]
    DETAIL_VIEW --> ACTION

    DELETE_EXPENSE --> REFRESH

    subgraph CATEGORIES [Kategori Pengeluaran]
        C1[utilities]
        C2[maintenance]
        C3[insurance]
        C4[tax]
        C5[marketing]
        C6[admin]
        C7[payroll]
        C8[other]
    end

    style START fill:#2ecc71,color:#fff
    style SUMMARY_VIEW fill:#3498db,color:#fff
    style DETAIL_VIEW fill:#3498db,color:#fff
    style REFRESH fill:#2ecc71,color:#fff
    style ACTION fill:#f1c40f,color:#333
```

---

## 18. Waiting List & Applicant Management

Alur manajemen daftar tunggu dan applicant. State machine: `WAITING_LIST_TRANSITIONS`. Sumber: `waitingListService.ts`.

```mermaid
flowchart TD
    START([Merchant Buka Waiting List]) --> FETCH[Fetch Applicants<br/>filter: status, property_id]
    FETCH --> LIST_VIEW[Tampilkan Daftar Applicant]

    LIST_VIEW --> ACTION{Aksi Merchant?}
    ACTION -->|Tambah| ADD[Input Applicant:<br/>name, phone, email<br/>budget_min/max<br/>preferred_move_in<br/>special_needs, property_id]
    ADD --> SAVE_ADD[Insert waiting_list<br/>status: interested]
    SAVE_ADD --> INTERESTED([Status: INTERESTED])

    INTERESTED --> TRANSITION1{Update Status?}
    TRANSITION1 -->|Apply| APPLIED([Status: APPLIED])

    APPLIED --> TRANSITION2{Next Action?}
    TRANSITION2 -->|Send Offer| OFFER_FLOW[Send Offer Sub-Flow]

    OFFER_FLOW --> SET_UNIT[Set unit_id]
    SET_UNIT --> SET_EXPIRY[Set offer_expires_at<br/>+7 hari]
    SET_EXPIRY --> OFFERED([Status: OFFERED<br/>offered_at = timestamp])

    OFFERED --> RESPONSE{Applicant Response?}
    RESPONSE -->|Accept| ACCEPTED([Status: ACCEPTED<br/>accepted_at = timestamp])
    RESPONSE -->|Reject| REJECTED([Status: REJECTED<br/>rejected_at = timestamp<br/>rejection_reason])

    ACCEPTED --> CREATE_CONTRACT([Buat Kontrak<br/>See Diagram 4])

    ACTION -->|Filter| FILTER[Filter by:<br/>- Status<br/>- Property]
    FILTER --> FETCH

    subgraph STATE_MACHINE [WAITING_LIST_TRANSITIONS]
        SM_INT([interested]) -->|apply| SM_APP([applied])
        SM_APP -->|offer| SM_OFF([offered])
        SM_OFF -->|accept| SM_ACC([accepted])
        SM_OFF -->|reject| SM_REJ([rejected])
        SM_INT -->|reject| SM_REJ
        SM_APP -->|reject| SM_REJ
    end

    style START fill:#2ecc71,color:#fff
    style INTERESTED fill:#3498db,color:#fff
    style APPLIED fill:#3498db,color:#fff
    style OFFERED fill:#e67e22,color:#fff
    style ACCEPTED fill:#2ecc71,color:#fff
    style REJECTED fill:#e74c3c,color:#fff
    style CREATE_CONTRACT fill:#2ecc71,color:#fff
    style SM_ACC fill:#2ecc71,color:#fff
    style SM_REJ fill:#e74c3c,color:#fff
    style TRANSITION1 fill:#f1c40f,color:#333
    style TRANSITION2 fill:#f1c40f,color:#333
    style RESPONSE fill:#f1c40f,color:#333
    style ACTION fill:#f1c40f,color:#333
```

**State Machine** (`WAITING_LIST_TRANSITIONS`):
| From | To |
|------|-----|
| `interested` | `applied`, `rejected` |
| `applied` | `offered`, `rejected` |
| `offered` | `accepted`, `rejected` |
| `accepted` | _(terminal)_ |
| `rejected` | _(terminal)_ |

---

## 19. Lease Renewal & Amendment

Alur perpanjangan sewa dan amandemen kontrak. Cron daily via edge function `send-renewal-alert`. State machine: `AMENDMENT_STATUS_TRANSITIONS`. Sumber: `renewalService.ts`.

```mermaid
flowchart TD
    START(["Cron Daily<br/>send-renewal-alert<br/><<edge function>>"]) --> CHECK_60[Check Contracts<br/>expiring in 60 days]
    CHECK_60 --> CHECK_30[Check Contracts<br/>expiring in 30 days]
    CHECK_30 --> CHECK_7[Check Contracts<br/>expiring in 7 days]

    CHECK_7 --> LOOP_CONTRACT[For Each Matching Contract]
    LOOP_CONTRACT --> DEDUP{Alert Already Sent<br/>for this type?}
    DEDUP -->|Yes| SKIP([Skip])
    DEDUP -->|No| CREATE_ALERT[Insert lease_renewal_alerts<br/>alert_type: 60/30/7_day_warning<br/>status: sent]

    CREATE_ALERT --> ALERT_CREATED([Alert Created])

    ALERT_CREATED --> MERCHANT_VIEW[Merchant Views Alerts<br/>renewalService.fetchAlerts]
    MERCHANT_VIEW --> ALERT_LIST[Tampilkan Alert List<br/>tenant, unit, end_date, rent_amount]

    ALERT_LIST --> AMEND_ACTION{Create Amendment?}
    AMEND_ACTION -->|Yes| CREATE_AMEND[Create Amendment<br/>contract_amendments table]
    CREATE_AMEND --> DRAFT([Amendment: DRAFT<br/>amendment_type, old_values, new_values])

    DRAFT --> SEND_AMEND{Send to Tenant?}
    SEND_AMEND -->|Yes| SENT_AMEND([Amendment: SENT])

    SENT_AMEND --> SIGN{Tenant Sign?}
    SIGN -->|Yes| SIGNED([Amendment: SIGNED<br/>signed_at = timestamp])
    SIGNED --> UPDATE_CONTRACT[Update Contract Terms<br/>See Diagram 4]

    AMEND_ACTION -->|No| MANUAL_RENEW[Manual Renewal Process]

    subgraph AMENDMENT_HISTORY [Amendment History per Contract]
        AH_FETCH[Fetch Amendments by contract_id<br/>order by created_at DESC]
    end

    style START fill:#2ecc71,color:#fff
    style ALERT_CREATED fill:#3498db,color:#fff
    style DRAFT fill:#3498db,color:#fff
    style SENT_AMEND fill:#e67e22,color:#fff
    style SIGNED fill:#2ecc71,color:#fff
    style UPDATE_CONTRACT fill:#2ecc71,color:#fff
    style SKIP fill:#e74c3c,color:#fff
    style DEDUP fill:#f1c40f,color:#333
    style AMEND_ACTION fill:#f1c40f,color:#333
    style SEND_AMEND fill:#f1c40f,color:#333
    style SIGN fill:#f1c40f,color:#333
```

**State Machine** (`AMENDMENT_STATUS_TRANSITIONS`):
| From | To |
|------|-----|
| `draft` | `sent` |
| `sent` | `signed` |
| `signed` | _(terminal — contract updated)_ |

---

## 20. Collections Case Management (Extended)

Alur manajemen kasus penagihan diperluas dengan payment plan dan strategy resolution. Sumber: `collectionsCaseService.ts`.

```mermaid
flowchart TD
    START([Overdue Invoice<br/>or Auto-Created by Reminders<br/>See Diagram 16]) --> FETCH_CASES[Fetch Cases<br/>with invoice joins<br/>invoice_number, tenant_name, unit_number]

    FETCH_CASES --> CASE_LIST[Tampilkan Case List<br/>filter by status]

    CASE_LIST --> CASE_ACTION{Case Action?}
    CASE_ACTION -->|Contact Tenant| CONTACT[Update last_contact_at<br/>Status: IN_PROGRESS]
    CONTACT --> IN_PROGRESS([Case: IN_PROGRESS])

    IN_PROGRESS --> STRATEGY{Resolution Strategy?}
    STRATEGY -->|Payment Plan| PLAN_FLOW[Create Payment Plan Sub-Flow]
    STRATEGY -->|Escalate| ESCALATE[Increase escalation_level<br/>Set next_action_date]
    STRATEGY -->|Write-off| RESOLVE_WO[Resolve: write_off]
    STRATEGY -->|Eviction| RESOLVE_EV[Resolve: eviction]
    STRATEGY -->|Paid in Full| RESOLVE_PF[Resolve: paid_in_full]

    ESCALATE --> IN_PROGRESS

    PLAN_FLOW --> PLAN_INPUT[Input Payment Plan:<br/>total_amount, installment_count<br/>frequency, start_date]
    PLAN_INPUT --> CALC_INSTALL[Calculate Installment<br/>installment_amount = ceil<br/>total / count]
    CALC_INSTALL --> SAVE_PLAN[Insert payment_plans<br/>status: pending_acceptance<br/>See Diagram 6B]
    SAVE_PLAN --> RESOLVE_PP[Resolve Case: payment_plan]

    RESOLVE_WO --> RESOLVED([Case: RESOLVED<br/>resolved_at = timestamp<br/>resolution_type set])
    RESOLVE_EV --> RESOLVED
    RESOLVE_PF --> RESOLVED
    RESOLVE_PP --> RESOLVED

    subgraph CASE_TRANSITIONS [COLLECTIONS_CASE_TRANSITIONS]
        CT_INIT([initiated]) --> CT_PROG([in_progress])
        CT_PROG --> CT_RES([resolved])
    end

    style START fill:#e74c3c,color:#fff
    style IN_PROGRESS fill:#3498db,color:#fff
    style RESOLVED fill:#2ecc71,color:#fff
    style CT_RES fill:#2ecc71,color:#fff
    style CASE_ACTION fill:#f1c40f,color:#333
    style STRATEGY fill:#f1c40f,color:#333
```

**Resolution Types**:
| Type | Deskripsi |
|------|-----------|
| `paid_in_full` | Tenant melunasi seluruh tagihan |
| `payment_plan` | Dibuat rencana cicilan (See Diagram 6B) |
| `write_off` | Tagihan dihapus sebagai kerugian |
| `eviction` | Proses pengusiran tenant |

---

## 21. Dynamic Pricing Rules

Alur CRUD aturan harga dinamis. Sumber: `dynamicPricingService.ts`.

```mermaid
flowchart TD
    START([Merchant Buka Pricing Rules]) --> FETCH[Fetch Rules<br/>dynamic_pricing_rules table<br/>order by priority ASC]
    FETCH --> RULE_LIST[Tampilkan Rule List]

    RULE_LIST --> ACTION{Aksi Merchant?}
    ACTION -->|Tambah| CREATE[Input Rule:<br/>rule_name, rule_type<br/>adjustment_type, adjustment_value<br/>conditions, priority<br/>min_price, max_price<br/>valid_from, valid_until]
    ACTION -->|Edit| EDIT[Update Rule Fields]
    ACTION -->|Hapus| DELETE[Delete Rule]
    ACTION -->|Toggle| TOGGLE[Toggle is_active<br/>true/false]

    CREATE --> SELECT_TYPE{Rule Type?}
    SELECT_TYPE -->|Occupancy| TYPE_OCC[Okupansi-based<br/>Adjust berdasarkan tingkat hunian]
    SELECT_TYPE -->|Seasonal| TYPE_SEA[Musiman<br/>Adjust berdasarkan waktu/musim]
    SELECT_TYPE -->|Demand| TYPE_DEM[Permintaan<br/>Adjust berdasarkan demand]
    SELECT_TYPE -->|Duration| TYPE_DUR[Durasi Sewa<br/>Diskon sewa jangka panjang]
    SELECT_TYPE -->|Loyalty| TYPE_LOY[Loyalitas<br/>Diskon tenant setia]

    TYPE_OCC --> ADJ_TYPE{Adjustment Type?}
    TYPE_SEA --> ADJ_TYPE
    TYPE_DEM --> ADJ_TYPE
    TYPE_DUR --> ADJ_TYPE
    TYPE_LOY --> ADJ_TYPE

    ADJ_TYPE -->|Percentage| ADJ_PCT[Set % adjustment]
    ADJ_TYPE -->|Fixed| ADJ_FIX[Set IDR adjustment]

    ADJ_PCT --> SAVE[Insert/Update<br/>dynamic_pricing_rules]
    ADJ_FIX --> SAVE
    SAVE --> REFRESH([Refresh List])
    REFRESH --> RULE_LIST

    EDIT --> SAVE
    DELETE --> REFRESH
    TOGGLE --> REFRESH

    style START fill:#2ecc71,color:#fff
    style RULE_LIST fill:#3498db,color:#fff
    style REFRESH fill:#2ecc71,color:#fff
    style ACTION fill:#f1c40f,color:#333
    style SELECT_TYPE fill:#f1c40f,color:#333
    style ADJ_TYPE fill:#f1c40f,color:#333
```

**Rule Types**:
| Type | Label | Deskripsi |
|------|-------|-----------|
| `occupancy` | Okupansi | Penyesuaian berdasarkan tingkat hunian properti |
| `seasonal` | Musiman | Harga berbeda berdasarkan musim/waktu |
| `demand` | Permintaan | Harga berdasarkan tingkat permintaan |
| `duration` | Durasi Sewa | Diskon untuk kontrak jangka panjang |
| `loyalty` | Loyalitas | Diskon untuk tenant yang sudah lama |

---

## 22. Financial Reports (P&L)

Alur laporan keuangan Profit & Loss. Sumber: `financialReportService.ts`.

```mermaid
flowchart TD
    START([Merchant Buka Financial Report]) --> SELECT_PERIOD[Select Period<br/>N bulan, default: 6]

    SELECT_PERIOD --> FETCH_DATA[Parallel Fetch:<br/>1. Paid Invoices >= startDate<br/>2. Expenses >= startDate<br/>3. Properties for name mapping]

    FETCH_DATA --> AGG_MONTHLY[Aggregate Monthly P&L<br/>For each month:<br/>revenue = sum paid invoices<br/>expenses = sum expenses<br/>netIncome = revenue - expenses]

    AGG_MONTHLY --> GROUP_REV[Group Revenue by Property<br/>Map property_id to property name<br/>Sum amounts per property]

    GROUP_REV --> GROUP_EXP[Group Expenses by Category<br/>Sum amounts per category<br/>Sort descending]

    GROUP_EXP --> SUMMARY[Build Financial Summary:<br/>totalRevenue, totalExpenses<br/>netIncome, monthlyData[]<br/>revenueByProperty[]<br/>expenseByCategory[]]

    SUMMARY --> DISPLAY[Display Charts:<br/>- Monthly P&L bar chart<br/>- Revenue by property pie<br/>- Expense by category pie<br/>- Trend line]

    style START fill:#2ecc71,color:#fff
    style DISPLAY fill:#3498db,color:#fff
    style SUMMARY fill:#2ecc71,color:#fff
```

**Data Sources**:
| Source | Filter | Diagram |
|--------|--------|---------|
| `invoices` | `status = paid`, `paid_at >= startDate` | Diagram 6 |
| `expenses` | `expense_date >= startDate` | Diagram 17 |
| `properties` | `merchant_id` match | Diagram 3 |

---

## 23. Admin Launch Readiness

Alur dashboard kesiapan peluncuran platform. Sumber: `launchReadinessService.ts`.

```mermaid
flowchart TD
    START([Admin Buka Launch Dashboard]) --> FETCH_METRICS[Parallel Fetch Counts:<br/>merchants, properties, units<br/>contracts, invoices, payments<br/>feature_flags]

    FETCH_METRICS --> COMPUTE_CHECKS[Compute 18 Readiness Checks<br/>across 5 Categories]

    COMPUTE_CHECKS --> CAT_CORE[Core (3 checks):<br/>- Auth system<br/>- Merchant management<br/>- Properties & Units]

    COMPUTE_CHECKS --> CAT_OPS[Operations (4 checks):<br/>- Contracts & Sewa<br/>- Daftar Tunggu<br/>- Perpanjangan Sewa<br/>- Maintenance]

    COMPUTE_CHECKS --> CAT_FIN[Finance (5 checks):<br/>- Tagihan<br/>- Pembayaran & Xendit<br/>- Auto-Match Rate<br/>- Penagihan & Kasus<br/>- Pengeluaran]

    COMPUTE_CHECKS --> CAT_INTEL[Intelligence (3 checks):<br/>- Harga Dinamis<br/>- Laporan Keuangan<br/>- DSS & AI Advisor]

    COMPUTE_CHECKS --> CAT_INFRA[Infrastructure (3 checks):<br/>- Row Level Security<br/>- Edge Functions<br/>- Feature Flags]

    CAT_CORE --> SCORE[Calculate Weighted Score<br/>pass/warning/fail per check]
    CAT_OPS --> SCORE
    CAT_FIN --> SCORE
    CAT_INTEL --> SCORE
    CAT_INFRA --> SCORE

    SCORE --> DISPLAY{Go / No-Go?}
    DISPLAY -->|All Pass| GO([GO - Ready to Launch])
    DISPLAY -->|Warnings| CAUTION([CAUTION - Review Items])
    DISPLAY -->|Failures| NO_GO([NO-GO - Fix Required])

    subgraph KEY_METRICS [Key Performance Indicators]
        KPI_MATCH[Payment Auto-Match Rate<br/>target >= 80%]
        KPI_ACTIVE[Active Merchants Count]
        KPI_OVERDUE[Overdue Invoice Count]
        KPI_EF[Edge Functions Deployed]
        KPI_FF[Feature Flags Configured]
    end

    style START fill:#2ecc71,color:#fff
    style GO fill:#2ecc71,color:#fff
    style CAUTION fill:#e67e22,color:#fff
    style NO_GO fill:#e74c3c,color:#fff
    style SCORE fill:#3498db,color:#fff
    style DISPLAY fill:#f1c40f,color:#333
```

**Readiness Categories & Weight**:
| Category | Checks | Key Criteria |
|----------|--------|-------------|
| Core | 3 | Auth aktif, merchants > 0, properties > 0 |
| Operations | 4 | Contracts > 0, waiting list, renewal alerts, maintenance |
| Finance | 5 | Invoices > 0, payment gateway, match rate >= 80%, collections, expenses |
| Intelligence | 3 | Dynamic pricing, financial reports, DSS advisor |
| Infrastructure | 3 | RLS aktif, edge functions deployed, feature flags > 0 |

---

## Lampiran: Cross-Reference Matrix

| Diagram | Referensi ke Diagram Lain |
|---------|---------------------------|
| 1. Onboarding | -> 2 (Subscription) |
| 2. Subscription | -> 1 (Verified merchant) |
| 3. Property & Unit | -> 4 (Contract), 5 (Tenant) |
| 4. Contract | -> 3 (Unit status), 5 (Tenant), 9 (Move-out), 19 (Amendment) |
| 5. Tenant | -> 4 (Contract), 3 (Unit) |
| 6. Invoice | -> 7 (Payment), 11 (Collections), 6B (Payment Plan), 15 (Reconciliation), 16 (Escalation) |
| 7. Payment | -> 6 (Invoice), 8 (Escrow), 15 (Reconciliation) |
| 8. Escrow | -> 7 (Payment) |
| 9. Move-Out | -> 3 (Unit), 4 (Contract) |
| 10. Maintenance | -> 12 (DSS) |
| 11. Collections | -> 6 (Invoice), 6B (Payment Plan), 12 (DSS), 16 (Auto-Reminders), 20 (Extended) |
| 12. AI/ML & DSS | -> 10 (Maintenance), 11 (Collections) |
| 13. Referral | Standalone |
| 14. Support | -> 12 (Data Quality) |
| 15. Reconciliation | -> 7 (Payment triggers auto-match), 6 (Match updates invoice status) |
| 16. Reminders | -> 6 (Escalates invoice), 11/20 (Auto-creates collections case at T+15) |
| 17. Expense | -> 22 (Financial Reports aggregates expenses) |
| 18. Waiting List | -> 4 (Accepted applicant creates contract) |
| 19. Renewal | -> 4 (Amendment modifies contract terms) |
| 20. Collections Extended | -> 6B (Creates payment plans), 6 (Resolves invoice) |
| 21. Pricing | -> 3 (Rules reference properties) |
| 22. Financial Reports | -> 6 (Aggregates paid invoices), 17 (Aggregates expenses) |
| 23. Launch Readiness | -> All (Reads all system tables for readiness scoring) |

## Lampiran: Edge Functions Summary

| Edge Function | Domain | Diagram |
|---------------|--------|---------|
| `ensure-user-bootstrap` | Onboarding | 1 |
| `ocr-ktp-extract` | Onboarding/OCR | 1, 12 |
| `ocr-business-document` | Onboarding/OCR | 1, 12 |
| `subscription-billing` | Subscription | 2 |
| `subscription-payment` | Subscription | 2 |
| `subscription-renewal` | Subscription | 2 |
| `subscription-grace-check` | Subscription | 2 |
| `ocr-compliance-document` | Property | 3, 14 |
| `ocr-asset-label` | Property/Asset | 3, 12 |
| `vacancy-tracking-cron` | Property | 3 |
| `compute-occupancy-snapshots` | Property | 3 |
| `ocr-contract-document` | Contract | 4, 12 |
| `accept-tenant-invitation` | Tenant | 5 |
| `create-tenant-account` | Tenant | 5 |
| `get-tenant-invitation` | Tenant | 5 |
| `auto-generate-invoices` | Invoice | 6 |
| `generate-invoice-pdf` | Invoice | 6 |
| `send-payment-reminder` | Invoice/Collections | 6, 11 |
| `check-payment-plan` | Invoice | 6B |
| `ocr-payment-proof` | Payment | 7, 12 |
| `xendit-create-invoice` | Payment | 7 |
| `xendit-webhook` | Payment | 7 |
| `auto-pay-execute` | Payment | 7 |
| `scheduled-disbursement` | Escrow | 8 |
| `xendit-disbursement` | Escrow | 8 |
| `xendit-disbursement-webhook` | Escrow | 8 |
| `process-deposit-refund` | Move-Out | 9 |
| `ocr-maintenance-receipt` | Maintenance | 10, 12 |
| `check-overdue-escalation` | Collections | 11 |
| `compute-tenant-payment-metrics` | Collections | 11 |
| `auto-match-payment` | Reconciliation | 15 |
| `queue-payment-reminders` | Reminders | 16 |
| `send-renewal-alert` | Lease Renewal | 19 |
| `dss-pricing-advisor` | DSS | 12 |
| `dss-maintenance-priority` | DSS | 10, 12 |
| `dss-collection-strategy` | DSS | 11, 12 |
| `dss-investment-insight` | DSS | 12 |
| `ml-churn-prediction` | ML | 12 |
| `ml-occupancy-forecast` | ML | 12 |
| `ml-revenue-forecast` | ML | 12 |
| `ml-risk-assessment` | ML | 12 |
| `ml-tenant-quality-scoring` | ML | 12 |
| `ml-optimal-pricing` | ML | 12 |
| `ml-price-intelligence` | ML | 12 |
| `ml-tenant-risk-score` | ML | 5, 12 |
| `ml-financial-analytics` | ML | 11, 12 |
| `ml-data-quality-check` | ML | 12, 14 |
| `ml-ocr-correction-suggest` | ML/OCR | 12 |
| `process-referral-commissions` | Referral | 13 |
| `process-referral-reward` | Referral | 13 |
| `process-vendor-order-referral` | Referral | 13 |
| `ai-chatbot` | Support | 14 |
| `merchant-ai-assistant` | Support | 14 |
| `vendor-ai-assistant` | Support | 14 |
| `send-notification` | Notifications | 6, 14 |
| `whatsapp-notification` | Notifications | 11, 14 |
| `data-export` | Data | 14 |
| `gdpr-data-request` | GDPR | 14 |
| `validate-admin-secret` | Auth | Internal |
| `auth-webhook` | Auth | Internal |
| `log-rls-access` | Security | Internal |
| `order-auto-reject` | Marketplace | Marketplace (non-merchant) |

## Lampiran: State Machines Summary

| State Machine | Constant Name | Diagram |
|---------------|---------------|---------|
| Merchant Verification | `MERCHANT_VERIFICATION_TRANSITIONS` | 1 |
| Verification (generic) | `VERIFICATION_STATUS_TRANSITIONS` | Generic (used internally) |
| Vendor Verification | `VENDOR_VERIFICATION_TRANSITIONS` | Vendor Domain (non-merchant) |
| Tenant Invitation | `TENANT_INVITATION_TRANSITIONS` | 5 |
| Subscription | `SUBSCRIPTION_STATUS_TRANSITIONS` | 2 |
| Unit Status | `UNIT_STATUS_TRANSITIONS` | 3 |
| Contract Status | `CONTRACT_STATUS_TRANSITIONS` | 4 |
| Contract Signature | `CONTRACT_SIGNATURE_TRANSITIONS` | 4 |
| Invoice Status | `INVOICE_STATUS_TRANSITIONS` | 6 |
| Payment Plan | `PAYMENT_PLAN_STATUS_TRANSITIONS` | 6B |
| Payment Status | `PAYMENT_STATUS_TRANSITIONS` | 7 |
| Payment Verification | `PAYMENT_VERIFICATION_TRANSITIONS` | 7 |
| Escrow Transaction | `ESCROW_TRANSACTION_TRANSITIONS` | 8 |
| Disbursement | `DISBURSEMENT_STATUS_TRANSITIONS` | 8 |
| Move-Out Notice | `MOVE_OUT_NOTICE_TRANSITIONS` | 9 |
| Move-Out Inspection | `MOVE_OUT_INSPECTION_TRANSITIONS` | 9 |
| Early Termination | `EARLY_TERMINATION_TRANSITIONS` | 9 |
| Deposit Refund | `DEPOSIT_REFUND_TRANSITIONS` | 9 |
| Maintenance | `MAINTENANCE_STATUS_TRANSITIONS` | 10 |
| Vendor Job | `VENDOR_JOB_STATUS_TRANSITIONS` | 10 |
| Collections Case | `COLLECTIONS_CASE_TRANSITIONS` | 11, 20 |
| DSS Recommendation | `DSS_RECOMMENDATION_TRANSITIONS` | 12 |
| OCR Result | `OCR_RESULT_TRANSITIONS` | 12 |
| Referral | `REFERRAL_STATUS_TRANSITIONS` | 13 |
| Dispute | `DISPUTE_STATUS_TRANSITIONS` | 14 |
| Waiting List | `WAITING_LIST_TRANSITIONS` | 18 |
| Contract Amendment | `AMENDMENT_STATUS_TRANSITIONS` | 19 |
| Order (Marketplace) | `ORDER_STATUS_TRANSITIONS` | Marketplace |
| Forum Report | `FORUM_REPORT_TRANSITIONS` | Forum |
