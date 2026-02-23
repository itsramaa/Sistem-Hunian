
# Full Structural & UX Redesign: Contracts, Invoices & Payments

Redesign lengkap arsitektur informasi, interaction flow, dan layout untuk modul Contracts, Invoices, dan Payments -- baik halaman list maupun detail.

---

## Design System (Berlaku untuk Semua)

- **Cards**: `bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40`
- **Tabs**: `pill-tab-list` + `pill-tab-trigger` pattern (rounded-full, gradient active)
- **Buttons**: Primary = `gradient-cta rounded-xl`, Secondary = `variant="outline" rounded-xl`
- **Inputs**: `rounded-xl bg-background/60 border-border/50`
- **Tables**: `glass-table` wrapper, gradient header row
- **Badges**: `rounded-full` with semantic colors
- **Dropdown**: `DropdownMenuContent` gets `rounded-xl`
- **Icons**: `gradient-icon-box` (rounded-xl bg-gradient-to-br from-primary/20 to-primary/5)

---

## PART 1: Contracts Page (`Contracts.tsx`)

### Current Issues
- TabsList uses inline styling instead of pill-tab-list/pill-tab-trigger classes
- "Create Contract" button uses raw gradient classes instead of `gradient-cta`
- Filter bar already uses `glass-filter-bar` -- good
- Stats already use StatCard -- good

### Changes
1. **TabsList**: Replace inline classes with `pill-tab-list` class
2. **TabsTrigger**: Replace inline classes with `pill-tab-trigger` class
3. **Create Contract button**: Simplify to `gradient-cta rounded-xl shadow-md`
4. **Add "Expiring Soon" tab**: New tab filtering contracts ending within 30 days (lifecycle view)
5. **Contracts page description**: More context-aware -- show total active revenue in description

### Components Touched
- `Contracts.tsx` -- tabs, button, expiring tab

---

## PART 2: Contract Detail Page (`ContractDetail.tsx`)

### Current Issues
- Flat 2-column layout with no KPI strip at top
- No financial summary (total contract value, payments made)
- Sidebar only has document upload + download -- minimal
- No contract timeline/progress indicator
- Back button uses `variant="ghost"` inconsistently

### Redesign Structure

```text
[Back Button (glass pill)]
[PageHeader + Status Badge]
[KPI Strip: 4 cards -- Contract Value, Monthly Rent, Duration, Days Remaining]
[2-col grid]
  [Main: Property+Tenant | Contract Details Grid | Signatures | Terms]
  [Sidebar: Contract Progress | Actions | Documents]
```

### Changes
1. **Add KPI Strip** (4 glass stat cards):
   - Total Contract Value (rent_amount x months)
   - Monthly Rent
   - Duration (months)
   - Days Remaining (or "Expired" badge)
2. **Contract Progress sidebar card**: Visual progress bar showing elapsed vs remaining time
3. **Back button**: Glass pill style `px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border/40`
4. **Signatures section**: Add gradient treatment to signed state (green gradient border)
5. **Terms section**: Add `prose` styling for better readability
6. **Actions card**: Add "Edit Terms" button if contract is draft, add "Mark Notice" if active

### Components Touched
- `ContractDetail.tsx` -- full restructure

---

## PART 3: Invoices Page (`Invoices.tsx`)

### Current Issues
- Good structure already (PageHeader + Stats + Filters + Table)
- Missing tab navigation for status-based views (unlike Contracts which has tabs)
- InvoiceDetailsDialog is a plain dialog without glass treatment

### Changes
1. **Add Tabs** for lifecycle-based filtering:
   - All | Draft | Sent | Paid | Overdue
   - Using pill-tab-list pattern
   - Each tab filters `filteredInvoices` by status
2. **InvoiceDetailsDialog enhancement** (see Part 4 sub-section)

### Components Touched
- `Invoices.tsx` -- add tabs
- `InvoicesTable.tsx` -- add `rounded-xl` to DropdownMenuContent

---

## PART 4: Invoice Detail Page (`InvoiceDetail.tsx`)

### Current Issues
- Already has good glassmorphic layout with Amount Breakdown + sidebar
- Missing tenant info section (who is this invoice for?)
- Missing linked contract reference
- Missing payment history for this invoice
- Back button not glass-pill styled

### Changes
1. **Add Tenant Info card** in main content (above Amount Breakdown):
   - Fetch tenant profile using `invoice.tenant_user_id`
   - Show name, email, phone with gradient-icon-box User icon
2. **Add Contract Reference link** in sidebar Details card:
   - Show contract unit + property
   - Clickable to navigate to `/merchant/contracts/:id`
3. **Back button**: Glass pill style
4. **Amount Breakdown card**: Add gradient-icon-box to section header
5. **Actions card**: Add gradient-icon-box to section header

### InvoiceDetailsDialog Enhancement
- Add `rounded-2xl` to DialogContent
- Add glass treatment: `bg-card/90 backdrop-blur-sm border border-border/40` to amount section
- Add `rounded-full` to status badge
- Add `rounded-xl` to all buttons
- Add `gradient-cta` to primary action buttons

### Components Touched
- `InvoiceDetail.tsx` -- tenant info, contract ref, glass pill back
- `InvoiceDetailsDialog.tsx` -- glass treatment, rounded buttons

---

## PART 5: Payments Page (`Payments.tsx`)

### Current Issues
- Header buttons (Refresh, Send Reminders) lack glass/rounded treatment
- TabsList uses inline styling instead of pill classes
- Good structure with History + Overdue tabs

### Changes
1. **Refresh button**: `rounded-xl` + glass treatment
2. **Send Reminders button**: `gradient-cta rounded-xl` (not `variant="secondary"`)
3. **TabsList**: Replace with `pill-tab-list` class
4. **TabsTrigger**: Replace with `pill-tab-trigger` class
5. **Add "Pending" count badge** to History tab (like overdue has badge)

### Components Touched
- `Payments.tsx` -- button styling, pill tabs, pending badge

---

## PART 6: Payment Detail Page (`PaymentDetail.tsx`)

### Current Issues
- Good glassmorphic layout already
- Missing tenant info (who made the payment?)
- Missing linked invoice reference
- Back button not glass-pill styled
- Amount card is centered text -- could be more structured

### Changes
1. **Add Tenant Info** card (fetch from payment's related invoice/contract)
2. **Back button**: Glass pill style
3. **Amount card**: Add gradient-icon-box to left side, keep big number, add "Payment Type" subtitle
4. **Add Invoice Reference** in sidebar:
   - Link to `/merchant/invoices/:id` if invoice exists
5. **Details Grid cards**: Add hover effect `hover:bg-primary/5 transition-all`

### Components Touched
- `PaymentDetail.tsx` -- tenant info, invoice ref, glass pill back

---

## PART 7: Dialog & Form Enhancements

### MarkPaidDialog.tsx
- SelectTrigger: Add `rounded-xl bg-background/60 border-border/50`
- Input: Add `rounded-xl bg-background/60 border-border/50`
- DialogFooter: Add `flex-col-reverse sm:flex-row` for mobile stacking

### CreateInvoiceDialog.tsx
- All Input/Select: Already have `rounded-xl` on some -- ensure consistency
- SelectTrigger: Add `bg-background/60 border-border/50`
- Total Amount card: Keep existing gradient treatment
- DialogFooter: Add `flex-col-reverse sm:flex-row`

### InvoiceDetailsDialog.tsx (full restyle)
- DialogContent: `rounded-2xl bg-popover/95 backdrop-blur-xl`
- Invoice number + badge: Glass treatment header
- Amount breakdown: `bg-card/90 backdrop-blur-sm rounded-xl border border-border/40 p-4`
- Total line: Gradient text treatment
- Buttons: `rounded-xl`, primary = `gradient-cta`

### CreateContractDialog.tsx
- Already well-styled with rounded-xl inputs
- DialogFooter: Add `flex-col-reverse sm:flex-row`

---

## PART 8: Table Component Enhancements

### ContractsTable.tsx
- DropdownMenuContent: Add `rounded-xl`

### InvoicesTable.tsx
- DropdownMenuContent: Add `rounded-xl`

### PaymentsTable.tsx
- "Mark Paid" button: Add `rounded-xl`
- Reminder icon button: Add `rounded-xl`

### OverdueInvoicesTable.tsx
- "Setup Payment Plan" button: Already `rounded-xl` -- good
- No changes needed

---

## Summary of Files Modified

| No | File | Type | Changes |
|----|------|------|---------|
| 1 | `Contracts.tsx` | EDIT | pill-tab classes, gradient-cta button, expiring tab |
| 2 | `ContractDetail.tsx` | EDIT | KPI strip, contract progress, glass back button, enhanced actions |
| 3 | `Invoices.tsx` | EDIT | Add status tabs with pill pattern |
| 4 | `InvoiceDetail.tsx` | EDIT | Tenant info, contract ref, glass back button |
| 5 | `Payments.tsx` | EDIT | pill-tab classes, button styling, pending badge |
| 6 | `PaymentDetail.tsx` | EDIT | Glass back button, hover effects |
| 7 | `InvoiceDetailsDialog.tsx` | EDIT | Full glass restyle |
| 8 | `MarkPaidDialog.tsx` | EDIT | Input/select styling, mobile footer |
| 9 | `CreateInvoiceDialog.tsx` | EDIT | Mobile footer |
| 10 | `CreateContractDialog.tsx` | EDIT | Mobile footer |
| 11 | `ContractsTable.tsx` | EDIT | DropdownMenuContent rounded-xl |
| 12 | `InvoicesTable.tsx` | EDIT | DropdownMenuContent rounded-xl |
| 13 | `PaymentsTable.tsx` | EDIT | Button rounded-xl |

## Implementation Order

1. Contracts page + ContractsTable (tabs + expiring)
2. Contract Detail page (KPI strip + progress + actions)
3. Invoices page + InvoicesTable (status tabs)
4. Invoice Detail page (tenant info + contract ref)
5. Payments page + PaymentsTable (pill tabs + buttons)
6. Payment Detail page (glass back + hover)
7. Dialogs (InvoiceDetailsDialog, MarkPaidDialog, CreateInvoiceDialog, CreateContractDialog)
