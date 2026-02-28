
# Improvement 1: Restructure Navigation Hierarchy + Fix Build Errors

## Overview

Two parallel tasks:
1. **Restructure merchant sidebar navigation** in `navigation-config.ts` from 4 groups (Utama, Operasional, Keuangan, Lainnya) to 6 groups matching the audit plan
2. **Fix 15 build errors** in edge functions (pre-existing TypeScript issues)
3. **Track progress** in `SYSTEM_AUDIT_REPORT.md`

---

## Part A: Navigation Restructure

### File: `src/shared/components/layouts/navigation-config.ts`

Replace the merchant `mainNav` array (lines 118-162) with 6 groups:

| Group | Label | Items | Changes |
|-------|-------|-------|---------|
| 1 | **Utama** | Dashboard | Unchanged (1 item) |
| 2 | **Properti & Okupansi** | Properti, Papan Okupansi, Inventori, Maintenance, Penjaga (Tim On-Site) | Inventory + Guardians moved from "Lainnya"; Guardians label clarified |
| 3 | **Penyewa & Kontrak** | Penyewa, Kontrak, Daftar Tunggu | Same items, new group label |
| 4 | **Keuangan** | Kontrol Keuangan, Tagihan, Pembayaran, Penagihan, Pengeluaran, Rekonsiliasi, Utilitas, Harga Dinamis, Lap. Keuangan | Collections elevated; Reconciliation label simplified; Financial Reports moved to end |
| 5 | **Wawasan & Manajemen** | Alat (InsightsHub), Laporan, Template Dokumen, Manajemen Staff, Performa Vendor, API & Integrasi | InsightsHub + Staff elevated from "Lainnya" |
| 6 | **Akun** | Profil, Langganan, Pengaturan, Notifikasi, Bantuan, Feedback | 6 previously orphaned/hidden pages now in sidebar |

### Key Changes:
- **"Lainnya" group eliminated** -- all items redistributed
- **6 orphaned pages added**: Profile, Billing, Settings, Alerts, Support, Feedback
- **Labels clarified**: "Resolusi & Rekonsiliasi" becomes "Rekonsiliasi"; "Penjaga" becomes "Penjaga (Tim On-Site)"
- **Collections elevated** from collapsed group to Keuangan section
- **InsightsHub + Staff** elevated to visible "Wawasan & Manajemen" group
- **Collapsible behavior**: The "Lainnya" collapsible logic in `nav-main.tsx` will no longer trigger since no group is named "Lainnya"

### New imports needed:
- `Bell` (for Alerts/Notifikasi icon)
- `Receipt` (for Billing/Langganan icon)
- `HelpCircle` (for Support/Bantuan icon)
- `MessageCircle` (for Feedback icon)

### No changes to `nav-main.tsx`:
The collapsible check `group.label === "Lainnya"` will simply never match -- harmless. No functional change needed.

---

## Part B: Fix 15 Build Errors in Edge Functions

### Error Category 1: `err` is of type `unknown` (4 files)
Add `(err as Error).message` or `(e as Error).message`:
- `auto-match-payment/index.ts` line 162
- `compute-occupancy-snapshots/index.ts` line 102
- `compute-tenant-payment-metrics/index.ts` line 136
- `queue-payment-reminders/index.ts` line 140
- `send-renewal-alert/index.ts` line 67

### Error Category 2: `.catch()` on `PromiseLike` (2 files)
Replace `.then(() => {}).catch(() => {})` with `Promise.resolve(...).then(...).catch(...)`:
- `ml-churn-prediction/index.ts` line 127
- `ml-tenant-risk-score/index.ts` line 162

### Error Category 3: `ai-chatbot/index.ts` line 188 (type cast)
The Supabase join returns `property` as an array. Fix by casting through `unknown`:
```typescript
const contractUnit = activeContract?.unit as unknown as { unit_number: string; property: { name: string } } | null;
```

### Error Category 4: `ml-ocr-correction-suggest/index.ts` (7 errors)
This file uses `callLovableAI` incorrectly -- passing `messages` instead of `systemPrompt` + `userContent`, and accessing `aiResponse.choices` which doesn't exist on `AiToolCallResult`. Also uses wrong param names for `logModelRun`.

Fixes:
1. `createUserClient(req)` -> extract auth header first: `createUserClient(req.headers.get("Authorization") || "")`
2. `authenticateUser(userClient)` -> `authenticateUser(req, userClient)`
3. `user.id` -> `user.userId`
4. `merchantId` null check before `checkTierLimit`
5. Restructure `callLovableAI` call to use correct interface (`systemPrompt`, `userContent`, `tools`, `toolChoice`)
6. Use `aiResponse.toolCallResult` instead of `aiResponse.choices[0].message.tool_calls[0]`
7. Fix `logModelRun` params: `merchant_id` -> `merchantId`, add `functionName`, `userId`

---

## Part C: Track Progress in SYSTEM_AUDIT_REPORT.md

Add an implementation tracking section after the Improvement 1 block (around line 1360) with per-line status tracking using the required format (COMPLETE/PARTIAL/NOT STARTED/SKIP/BLOCKED).

---

## Files Modified

| File | Change |
|------|--------|
| `src/shared/components/layouts/navigation-config.ts` | Restructure merchant mainNav to 6 groups |
| `supabase/functions/ai-chatbot/index.ts` | Fix type cast (line 188) |
| `supabase/functions/auto-match-payment/index.ts` | Fix `err` unknown type |
| `supabase/functions/compute-occupancy-snapshots/index.ts` | Fix `e` unknown type |
| `supabase/functions/compute-tenant-payment-metrics/index.ts` | Fix `e` unknown type |
| `supabase/functions/ml-churn-prediction/index.ts` | Fix `.catch()` on PromiseLike |
| `supabase/functions/ml-ocr-correction-suggest/index.ts` | Fix 7 type errors (API mismatch) |
| `supabase/functions/ml-tenant-risk-score/index.ts` | Fix `.catch()` on PromiseLike |
| `supabase/functions/queue-payment-reminders/index.ts` | Fix `err` unknown type |
| `supabase/functions/send-renewal-alert/index.ts` | Fix `error` unknown type |
| `old-docs/SYSTEM_AUDIT_REPORT.md` | Add implementation tracking section |
