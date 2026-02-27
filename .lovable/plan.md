

# Create UX Assessment & User Journey Document

## Objective

Create `old-docs/UX_ASSESSMENT_AND_USER_JOURNEY.md` -- a comprehensive UX audit of ALL merchant features from the perspective of a non-technical boarding house owner, based strictly on documented system evidence.

## Source Evidence Used

All findings are grounded in actual codebase artifacts:
- **Navigation config**: 13 primary + 12 secondary nav items (57 total merchant pages)
- **State machines**: 25 defined in `state-machines.ts` with 100+ transitions
- **Activity diagrams**: 23 workflows documented in `merchant_activity_diagram.md`
- **Dashboard service**: `merchantDashboardService.ts` with 10 parallel queries
- **Role actions**: 5 primary merchant actions defined in `role-actions.ts`
- **Audit report**: Existing findings in `PMS_Audit_Report_FULL.md`

## Document Structure

### 1. Executive UX Summary
Assessment of system understandability, flow complexity, admin dependency, and time-to-first-value. Based on actual onboarding flow (Diagram 1: 8 steps before first insight) and navigation complexity (57 pages).

### 2. Feature-by-Feature UX Assessment (20 merchant features)
For each feature: actual flow table, state machine reference, UX friction analysis, business impact, and simplification opportunities. Features covered:
1. Onboarding & Verification
2. Subscription Management
3. Property & Unit Management
4. Contract Lifecycle
5. Tenant Management
6. Invoice Management
7. Payment & Verification
8. Direct Payment (former Escrow)
9. Move-Out & Deposit Refund
10. Maintenance Requests
11. Collections & Billing Analytics
12. AI/ML & DSS Advisory
13. Referral System
14. Support & Compliance
15. Payment Reconciliation
16. Automated Reminders
17. Expense Tracking
18. Waiting List
19. Lease Renewal & Amendment
20. Dynamic Pricing
21. Financial Reports
22. Financial Control Center (new)

### 3. End-to-End Merchant Journeys
- A. Onboarding Journey (steps-to-first-value analysis)
- B. Daily Operational Journey (page navigation count)
- C. Critical Scenarios (tenant payment, late payment, complaint, full occupancy, expansion)

### 4. UX Risk Map
High/Medium/Low risk categorization based on actual friction points discovered

### 5. Over-Complexity Detection
Enterprise-grade processes inappropriate for small kosan operations (e.g., 25 state machines, 10+ ML edge functions, 3-tier reconciliation for manual transfers)

### 6. Scalability UX Check
Assessment at 5, 20, and 100 unit scales -- which features break UX at scale

### 7. Final UX Verdict
Evidence-based verdict with specific reasoning

## File Created

| Action | File |
|--------|------|
| CREATE | `old-docs/UX_ASSESSMENT_AND_USER_JOURNEY.md` |

## Technical Notes

- No code changes -- pure documentation
- All findings reference specific files, state machines, and diagram numbers
- Assumptions are explicitly labeled per the rules
- Document will be approximately 3000-4000 lines of detailed, grounded analysis

