
# Coverage Validation Review: UX Assessment & User Journey

## Merchant Feature Ground Truth List

Extracted from navigation config, activity diagrams, and page files:

| # | Feature Name | Source Document | Section |
|---|---|---|---|
| 1 | Onboarding & Verification | `merchant_activity_diagram.md` Diagram 1 | Merchant Registration |
| 2 | Subscription Management | `merchant_activity_diagram.md` Diagram 2 | Subscription Lifecycle |
| 3 | Property & Unit Management | `merchant_activity_diagram.md` Diagram 3 | Property Setup |
| 4 | Contract Lifecycle | `merchant_activity_diagram.md` Diagram 4 | Contract Creation |
| 5 | Tenant Management | `merchant_activity_diagram.md` Diagram 5 | Tenant Flow |
| 6 | Invoice Management | `merchant_activity_diagram.md` Diagrams 6, 6B | Invoice Lifecycle |
| 7 | Payment & Verification | `merchant_activity_diagram.md` Diagram 7 | Payment Flow |
| 8 | Escrow & Disbursement | `merchant_activity_diagram.md` Diagram 8 | Escrow Flow |
| 9 | Move-Out & Deposit Refund | `merchant_activity_diagram.md` Diagram 9 | Move-Out Process |
| 10 | Maintenance Requests | `merchant_activity_diagram.md` Diagram 10 | Maintenance Lifecycle |
| 11 | Collections & Billing Analytics | `merchant_activity_diagram.md` Diagrams 11, 20 | Collections Case |
| 12 | AI/ML & DSS Advisory | `merchant_activity_diagram.md` Diagram 12 | AI/DSS Flow |
| 13 | Referral System | `merchant_activity_diagram.md` Diagram 13 | Referral Flow |
| 14 | Support, Feedback & Compliance | `merchant_activity_diagram.md` Diagram 14 | Support Flow |
| 15 | Payment Reconciliation | `merchant_activity_diagram.md` Diagram 15 | Auto-Match |
| 16 | Automated Payment Reminders | `merchant_activity_diagram.md` Diagram 16 | Reminder System |
| 17 | Expense Tracking | `merchant_activity_diagram.md` Diagram 17 | Expense Management |
| 18 | Waiting List | `merchant_activity_diagram.md` Diagram 18 | Applicant Management |
| 19 | Lease Renewal & Amendment | `merchant_activity_diagram.md` Diagram 19 | Amendment Lifecycle |
| 20 | Dynamic Pricing | `merchant_activity_diagram.md` Diagram 21 | Pricing Rules |
| 21 | Financial Reports (P&L) | `merchant_activity_diagram.md` Diagram 22 | Financial Reporting |
| 22 | Financial Control Center | `role-actions.ts` line 23 | Approval Workflow |
| 23 | Occupancy Board | `navigation-config.ts` line 124; `OccupancyBoard.tsx` | Sidebar item "Papan Okupansi" |
| 24 | Inventory / Asset Management | `navigation-config.ts` line 149; Diagram 3 subgraph | Sidebar item "Inventori" |
| 25 | Guardian Management | `navigation-config.ts` line 150; `Guardians.tsx` | Sidebar item "Penjaga" |
| 26 | Vendor Performance | `navigation-config.ts` line 151; `VendorPerformance.tsx` | Sidebar item "Performa Vendor" |
| 27 | Utility Billing | `navigation-config.ts` line 152; page exists | Sidebar item "Utilitas" |
| 28 | Document Templates | `navigation-config.ts` line 157; `DocumentTemplates.tsx` | Sidebar item "Template Dokumen" |
| 29 | API & Integration | `navigation-config.ts` line 159; page exists | Sidebar item "API & Integrasi" |
| 30 | Staff Management | `navigation-config.ts` line 160; `StaffManagement.tsx` with RBAC | Sidebar item "Manajemen Staff" |
| 31 | InsightsHub (Analytics Landing) | `navigation-config.ts` line 158; `InsightsHub.tsx` | Sidebar item "Alat" |
| 32 | Tenant Screening | `App.tsx` line 87; `TenantScreening.tsx`; activePattern in nav | Dedicated page linked from Tenants |

---

## Coverage Cross-Validation Table

| # | Feature Name | Present in UX Doc? | Section Reference | Complete? |
|---|---|---|---|---|
| 1 | Onboarding & Verification | Yes | Section 2, Feature 1 | Yes |
| 2 | Subscription Management | Yes | Section 2, Feature 2 | Yes |
| 3 | Property & Unit Management | Yes | Section 2, Feature 3 | Yes |
| 4 | Contract Lifecycle | Yes | Section 2, Feature 4 | Yes |
| 5 | Tenant Management | Yes | Section 2, Feature 5 | Yes |
| 6 | Invoice Management | Yes | Section 2, Feature 6 | Yes |
| 7 | Payment & Verification | Yes | Section 2, Feature 7 | Yes |
| 8 | Escrow & Disbursement | Yes | Section 2, Feature 8 | Yes |
| 9 | Move-Out & Deposit Refund | Yes | Section 2, Feature 9 | Yes |
| 10 | Maintenance Requests | Yes | Section 2, Feature 10 | Yes |
| 11 | Collections & Billing Analytics | Yes | Section 2, Feature 11 | Yes |
| 12 | AI/ML & DSS Advisory | Yes | Section 2, Feature 12 | Yes |
| 13 | Referral System | Yes | Section 2, Feature 13 | Yes |
| 14 | Support, Feedback & Compliance | Yes | Section 2, Feature 14 | Yes |
| 15 | Payment Reconciliation | Yes | Section 2, Feature 15 | Yes |
| 16 | Automated Payment Reminders | Yes | Section 2, Feature 16 | Yes |
| 17 | Expense Tracking | Yes | Section 2, Feature 17 | Yes |
| 18 | Waiting List | Yes | Section 2, Feature 18 | Yes |
| 19 | Lease Renewal & Amendment | Yes | Section 2, Feature 19 | Yes |
| 20 | Dynamic Pricing | Yes | Section 2, Feature 20 | Yes |
| 21 | Financial Reports (P&L) | Yes | Section 2, Feature 21 | Yes |
| 22 | Financial Control Center | Yes | Section 2, Feature 22 | Yes |
| 23 | Occupancy Board | **Missing** | -- | -- |
| 24 | Inventory / Asset Management | **Partial** | Mentioned in Feature 3 subgraph only | No standalone assessment |
| 25 | Guardian Management | **Partial** | Mentioned in Feature 3 as optional step | No standalone assessment |
| 26 | Vendor Performance | **Partial** | Mentioned in Feature 10 (vendor rating) | No standalone assessment |
| 27 | Utility Billing | **Missing** | -- | -- |
| 28 | Document Templates | **Partial** | Mentioned in Section 5 "over-complexity" | No UX friction/business analysis |
| 29 | API & Integration | **Partial** | Mentioned in Section 5 "over-complexity" | No UX friction/business analysis |
| 30 | Staff Management | **Missing** | -- | -- |
| 31 | InsightsHub (Analytics Landing) | **Partial** | Mentioned in Feature 12 context | No standalone assessment of hub UX |
| 32 | Tenant Screening | **Partial** | Mentioned briefly in Feature 5 | No standalone assessment |

---

## Coverage Status

| Metric | Value |
|--------|-------|
| Total Features Identified | **32** |
| Fully Covered | **22** |
| Partially Covered | **7** |
| Missing | **3** |
| **Coverage Status** | **Incomplete** |

### Verdict: Coverage = Not Fully Complete

The document covers 22/32 merchant features fully. 7 features are partially mentioned but lack the required format (Documentation Source, Current Flow table, State Machine, UX Friction, Business Impact, Simplification Opportunities). 3 features are entirely absent.

---

## Missing and Partial Features

### Entirely Missing (3)

| Feature | Why Skipped | Source |
|---------|-------------|--------|
| Occupancy Board | No activity diagram exists for this feature. It has its own sidebar item, dedicated page with drag-and-drop unit status management, and `useOccupancyBoard` hook | `navigation-config.ts` line 124, `OccupancyBoard.tsx` |
| Utility Billing | No activity diagram exists. Has sidebar item and dedicated page for tracking utility costs per property/unit | `navigation-config.ts` line 152 |
| Staff Management | No activity diagram exists. Has full RBAC system with 3 roles (caretaker, property_manager, accountant), permission groups, invite/remove flow | `navigation-config.ts` line 160, `StaffManagement.tsx` |

### Partially Covered (7)

| Feature | Current Coverage | Missing |
|---------|-----------------|---------|
| Inventory/Asset Management | Mentioned as Diagram 3 subgraph (asset tracking, OCR label, depreciation) | No standalone UX friction analysis, flow table, business impact |
| Guardian Management | Mentioned as optional step in Feature 3 | No standalone assessment of guardian assignment UX |
| Vendor Performance | Referenced in Feature 10 (vendor rating trigger) | No assessment of the standalone analytics dashboard |
| Document Templates | Listed in Section 5 "over-complexity" | No flow table, friction analysis, or business impact |
| API & Integration | Listed in Section 5 "over-complexity" | No flow table, friction analysis, or business impact |
| InsightsHub | Referenced in Feature 12 | No assessment of the card-based landing UX pattern |
| Tenant Screening | Briefly mentioned in Feature 5 as "AI scoring features" | No assessment of the dedicated screening page and its Green/Yellow/Red grading UX |

---

## Revision Plan

### What to Add

Add 10 new feature sections (Features 23-32) to the UX document, following the exact format:

- Documentation Source block
- Current Flow table (from actual page code since no activity diagrams exist for these)
- State Machine (or "No Explicit State Machine Defined" marker)
- UX Friction Analysis
- Business Impact
- Simplification Opportunities

### What to Update

1. **Traceability Matrix** (Section Step 1): Add rows 23-32
2. **Hallucination Self-Check** (Section 8): Update totals from 22 to 32
3. **Executive Summary**: Update "24 sidebar items" context to note that 10 features were previously unassessed
4. **Over-Complexity Section**: Move API & Integration and Document Templates from mere mentions to proper cross-references

### Technical Notes

- Features 23-32 do NOT have activity diagrams in `merchant_activity_diagram.md` (which only covers Diagrams 1-23, where Diagram 23 is admin-only). Their source evidence comes from `navigation-config.ts` sidebar items + actual page implementations.
- For features without activity diagrams, the Documentation Source will reference the page file and navigation config.
- All new sections will follow the Non-Hallucination Protocol with appropriate markers.

### Final Coverage After Revision

| Metric | Before | After |
|--------|--------|-------|
| Total Features | 32 | 32 |
| Fully Covered | 22 | 32 |
| Partial | 7 | 0 |
| Missing | 3 | 0 |
| Coverage | Incomplete | Complete |
