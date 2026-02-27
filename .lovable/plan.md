

# Update merchant_activity_diagram.md: User Journeys + Role Perspectives

## Overview
Edit the existing 23-section document to shift focus from **state machine documentation** to **user journey flows**, and add **role-based perspective sections** for shared features. No sections will be deleted -- only enhanced.

## Changes Per Section

### Global Changes
- Rename document title from "Merchant Activity Diagrams" to "SiHuni User Journey & Activity Diagrams"
- Update subtitle to mention multi-role perspective (Pemilik, Tenant, Admin, Vendor)
- Add a "Konvensi Peran" legend at top explaining role icons/labels used throughout

### Per-Diagram Edits (Keep diagrams, add journey narrative)

For each of the 23 sections, add a **"Perspektif Peran"** subsection after the diagram. This table clarifies who does what. Sections that are single-role only get a brief note; shared features get a full 4-role breakdown.

| Section | Shared? | Roles Involved | Key Addition |
|---------|---------|----------------|--------------|
| 1. Onboarding | Yes | Merchant (register), Admin (review/approve) | Admin sees verification queue; Merchant sees status tracker |
| 2. Subscription | Merchant-only | Merchant | Brief note: Admin manages tiers via `/admin/subscription-tiers` |
| 3. Property & Unit | Merchant-only | Merchant | Admin can view all properties at `/admin/properties` |
| 4. Contract | **Shared** | Merchant (create, sign), Tenant (sign, view), Admin (view all) | Full role table |
| 5. Tenant Mgmt | **Shared** | Merchant (invite), Tenant (accept/view), Admin (view all) | Full role table |
| 6. Invoice | **Shared** | Merchant (create/send), Tenant (view/pay), Admin (view aggregate) | Full role table |
| 7. Payment | **Shared** | Tenant (pay/upload proof), Merchant (verify), Admin (escrow oversight) | Full role table |
| 8. Escrow | **Shared** | Merchant (request disbursement), Admin (review/approve) | Full role table |
| 9. Move-Out | **Shared** | Tenant (submit notice), Merchant (inspect/process), Admin (dispute resolution) | Full role table |
| 10. Maintenance | **Shared** | Tenant (submit request), Merchant (assign), Vendor (accept/work), Admin (oversight) | Full 4-role table |
| 11. Collections | Merchant-focused | Merchant, Admin (view cases) | Admin sees aggregate analytics |
| 12. AI/DSS | Merchant-focused | Merchant | Note: Admin monitors DSS health at `/admin/dss-health` |
| 13. Referral | **Shared** | Merchant/Tenant/Vendor (generate/use codes), Admin (manage payouts) | Full role table |
| 14. Support | **Shared** | All 4 roles use AI chatbot; Admin manages KB | Full role table |
| 15. Reconciliation | Merchant-focused | Merchant (manual match), System (auto-match) | Admin sees via escrow |
| 16. Reminders | System/Merchant | System (cron), Merchant (config), Tenant (receives) | Role table |
| 17. Expenses | Merchant-only | Merchant | Brief note |
| 18. Waiting List | Merchant-only | Merchant | Brief note |
| 19. Lease Renewal | Merchant-focused | Merchant (create amendment), Tenant (view contract changes) | Role table |
| 20. Collections Extended | Merchant-focused | Merchant | Brief note |
| 21. Dynamic Pricing | Merchant-only | Merchant | Brief note |
| 22. Financial Reports | Merchant-only | Merchant | Brief note |
| 23. Launch Readiness | Admin-only | Admin | Brief note |

### Narrative Additions Per Section
For each section, add a brief **"Perjalanan Pengguna"** (User Journey) paragraph before the Mermaid diagram, written in plain language describing the end-to-end story from the user's perspective. Example for Section 4 (Contract):

> "Pemilik properti membuat kontrak untuk unit yang tersedia, lalu menandatangani secara digital. Penyewa menerima undangan untuk menandatangani kontrak. Setelah kedua pihak menandatangani, kontrak otomatis aktif dan unit berubah status menjadi terisi. Admin dapat melihat semua kontrak di seluruh platform."

### State Machine Tables
Keep all existing state machine tables but move them into collapsible `<details>` blocks with summary "Referensi State Machine" so they don't dominate the narrative flow.

### New Section: Role Journey Summary (before Lampiran)
Add a new summary section "Ringkasan Journey per Peran" with 4 subsections:

**Pemilik (Merchant):** Full lifecycle from onboarding -> property setup -> tenant management -> billing -> financial reports
**Penyewa (Tenant):** Accept invitation -> sign contract -> pay invoices -> request maintenance -> marketplace -> move-out
**Vendor:** Register -> get verified -> receive jobs -> complete work -> earn
**Admin:** Verify merchants/vendors -> manage escrow -> resolve disputes -> monitor launch readiness

Each with a simple numbered step list referencing the relevant diagram numbers.

## Technical Details

### File Modified
- `old-docs/merchant_activity_diagram.md`

### Execution Order
1. Update document title, subtitle, and add role legend
2. For each of 23 sections: add "Perjalanan Pengguna" narrative + "Perspektif Peran" role table
3. Wrap existing state machine tables in `<details>` blocks
4. Add new "Ringkasan Journey per Peran" section before Lampiran
5. Keep all Lampiran (Cross-Reference, Edge Functions, State Machines) unchanged

