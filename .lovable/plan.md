# Revise UX Assessment & User Journey Document

## Objective

Edit`old-docs/UX_ASSESSMENT_AND_USER_JOURNEY.md` with strict source traceability, corrected data, and a mandatory hallucination self-check section. All claims must reference specific documents and line numbers.

## Issues Found in Current Document

### Factual Errors to Correct


| Error                                          | Current Value                                                        | Correct Value                                                                                                                                               | Source                                                                                |
| ---------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Sidebar item count                             | "25 sidebar items" (repeated 6+ times)                               | **24 sidebar items** (3+4+5+12)                                                                                                                             | `navigation-config.ts` lines 118-163                                                  |
| State machine count                            | "25 state machines" (repeated 8+ times)                              | **31 state machines**                                                                                                                                       | `state-machines.ts` — full count of all exported `*_TRANSITIONS` constants            |
| Amendment states                               | "8 amendment states"                                                 | **9 states** in code (draft, sent, tenant_reviewing, negotiating, agreed, signing, signed, rejected, cancelled)                                             | `AMENDMENT_STATUS_TRANSITIONS` lines 217-227                                          |
| Collections Case in Diagram 11 reference table | Shows simplified 3-state (initiated, in_progress, resolved)          | Full machine has **7 states** (initiated, reminder_sent, follow_up, in_progress, escalated, legal, resolved)                                                | `COLLECTIONS_CASE_TRANSITIONS` lines 196-204                                          |
| Lease Amendment diagram vs code                | Diagram 19 shows 5 states (draft, sent, signed, rejected, cancelled) | Code has 9 states including tenant_reviewing, negotiating, agreed, signing                                                                                  | Discrepancy between `merchant_activity_diagram.md` Diagram 19 and `state-machines.ts` |
| ML edge function count                         | "10 ML + 4 DSS = 14 AI edge functions"                               | Needs verification — Diagram 12 lists 10 ML + 4 DSS but includes `ml-ocr-correction-suggest` as 11th ML. Count should note OCR functions separately (7 OCR) | `merchant_activity_diagram.md` Diagram 12                                             |


### Hallucination Risks Identified


| Claim                                             | Status                                        | Action                                                                                |
| ------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------- |
| "40-60% churn rate" for onboarding friction       | Assumption — no SiHuni data                   | Already labeled with warning marker but must use `Assumption (Low Confidence)` format |
| "Mamikos PMS competitor benchmark"                | Assumption — no documentation                 | Must use formal assumption label                                                      |
| Admin verification turnaround time "1-72 hours"   | Not documented                                | Must mark as "Not Defined in Current System Documentation"                            |
| "10 parallel queries in merchantDashboardService" | Needs verification against actual code        | Verify or mark as assumption                                                          |
| Push notification claims                          | Not verified against edge functions           | Must check if `send-notification` edge function exists                                |
| "No manual tenant creation" claim                 | Needs verification against tenant invite flow | The API contract (Section 5.1) shows phone is optional, not email-only                |


### Structural Changes Required

1. **Add Step 1: Source Traceability Matrix** — Every feature mapped to exact document + section + evidence snippet
2. **Add Documentation Source block** to each feature section with Document, Section, Reference fields
3. **Add Step 3: Hallucination Self-Check** at the end
4. **Use formal assumption labels** (`Assumption (Low Confidence)`, `Not Defined`, `Ambiguous`) instead of informal warning markers
5. **Fix Diagram 19/Amendment discrepancy** — Flag that activity diagram shows simplified 5-state flow while code implements full 9-state negotiation flow
6. **Correct all count references** — 24 sidebar items, 31 state machines, 9 amendment states

## Document Structure (Revised)

### Pre-Analysis: Source Traceability Matrix

New section mapping all 22 features to exact document sources with evidence snippets.

### Section 1: Executive UX Summary

Same structure, corrected counts (24 sidebar, 31 state machines).

### Section 2: Feature-by-Feature Assessment (22 features)

Each feature now includes:

- **Documentation Source** block (Document, Section, Reference)
- Corrected state machine references
- Formal assumption labels replacing informal warnings
- `Not Defined` markers where endpoints aren't documented
- Flag for Diagram 19 vs code discrepancy in Feature 19

### Section 3: End-to-End Merchant Journeys

Same structure, corrected references.

### Section 4: UX Risk Map

Corrected count references.

### Section 5: Over-Complexity Detection

Corrected: "31 state machines" not 25.

### Section 6: Scalability UX Check

Corrected sidebar count to 24.

### Section 7: Final UX Verdict

Same verdict, corrected evidence.

### NEW Section 8: Hallucination Risk Self-Check

- Total Features Identified: 22 (from Diagrams 1-22 in `merchant_activity_diagram.md`)
- Features Without Source: 0
- Assumptions Used: list all with confidence levels
- Discrepancies Found: Diagram 19 vs `AMENDMENT_STATUS_TRANSITIONS`, Diagram 11 simplified collections vs full 7-state machine

### Appendix: Corrected Feature Count Summary

All counts verified against source files.

## Key Corrections Summary

The revised document corrects **6 factual errors**, adds **formal source traceability** for all 22 features, marks **2 documentation discrepancies**, and labels all **assumptions with confidence levels**. The overall verdict remains "Needs Refinement" as the evidence still supports that conclusion — only the supporting numbers change.

## File Modified


| Action  | File                                         |
| ------- | -------------------------------------------- |
| REWRITE | `old-docs/UX_ASSESSMENT_AND_USER_JOURNEY.md` |
