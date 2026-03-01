

# Improvement: Pattern 4 (Async Status Feedback) and Pattern 5 (Modal vs Full-Page Consistency)

## Analysis

### Pattern 4: No Async Status Updates
The app already uses toast notifications -- no actual full-page refreshes occur. However, there are two problems:
1. **Mixed toast systems**: 27 files use shadcn's `useToast` (bottom-right, dismissable) while newer code uses sonner (top-center, auto-dismiss). This creates inconsistent feedback UX.
2. **Generic messages**: Toasts say "Reminder sent" without context (tenant name, amount). Messages are partly English, partly Indonesian.

**Fix**: Standardize all payment/invoice action feedback on **sonner** with rich, contextual Indonesian messages. Sonner is the better choice because it's simpler (no hook needed), auto-dismisses, and is already used in newer code.

### Pattern 5: Modal vs Full-Page Inconsistency
The InvoicesTable currently navigates to a full page (`/merchant/invoices/:id`) on row click, while the Collections OutstandingTable opens an inline Sheet. This is inconsistent.

**Fix**: Make InvoicesTable row click open `InvoiceDetailsDialog` inline (already exists as a prop `onView`) instead of navigating to a full page. Remove the `useNavigate` call.

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `src/features/payments/hooks/useInvoiceActions.ts` | MODIFY | Switch from shadcn toast to sonner with rich Indonesian messages |
| `src/features/payments/components/InvoicesTable.tsx` | MODIFY | Row click opens detail dialog instead of full-page navigation |
| `old-docs/SYSTEM_AUDIT_REPORT.md` | UPDATE | Pattern 4 and 5 tracking |

## Technical Details

### useInvoiceActions.ts Changes
- Replace `import { useToast } from '@/shared/hooks/use-toast'` with `import { toast } from 'sonner'`
- Remove `const { toast } = useToast()` line
- Convert all `toast({ title, description, variant })` calls to `toast.success(message)` / `toast.error(message)`:
  - `handleCreateInvoice`: `toast.success('Faktur berhasil dibuat')`
  - `handleSendInvoice`: `toast.success('Faktur berhasil dikirim ke penyewa')`
  - `handleMarkAsPaid`: `toast.success('Faktur ditandai lunas')`
  - `handleSendReminder`: `toast.success('Pengingat pembayaran berhasil dikirim')`
  - `downloadInvoicePdf`: `toast.loading('Membuat PDF...')` then success/error
  - All error cases: `toast.error('Gagal [action]: ' + error.message)`

### InvoicesTable.tsx Changes
- Remove `import { useNavigate } from 'react-router-dom'` and `const navigate = useNavigate()`
- Change row `onClick` from `navigate(\`/merchant/invoices/${invoice.id}\`)` to `onView(invoice)`
- This makes the Invoices page consistent with Collections (inline detail view via dialog/sheet)

### No Database Changes
Purely frontend feedback improvements.

