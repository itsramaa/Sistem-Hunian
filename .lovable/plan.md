

# Utilities & Shared Expense Billing + Document Template Library

## Overview

Two features to enhance operational efficiency:
1. **Utilities & Shared Expense Billing** -- Meter reading input, usage calculation, cost allocation (fixed/metered), auto-generation of utility invoices separate from rent, and tenant-facing breakdown
2. **Document Template Library** -- Database-backed template storage (replacing localStorage), pre-drafted Indonesian kos templates, variable auto-fill with tenant/property data, PDF export, and version history

---

## Feature 1: Utilities & Shared Expense Billing

### 1A: Database -- New Tables

**`utility_meter_readings`** -- Monthly meter readings per unit:
```
id                uuid PK
merchant_id       uuid FK merchants
property_id       uuid FK properties
unit_id           uuid FK units
utility_type      text NOT NULL (water, electricity)
reading_date      date NOT NULL
previous_reading  numeric NOT NULL
current_reading   numeric NOT NULL
usage             numeric GENERATED (current_reading - previous_reading)
rate_per_unit     numeric NOT NULL
photo_url         text (optional meter photo)
notes             text
created_at        timestamptz DEFAULT now()
```

**`utility_charges`** -- Computed charges per tenant per period:
```
id                uuid PK
merchant_id       uuid FK merchants
property_id       uuid FK properties
unit_id           uuid FK units
contract_id       uuid FK contracts
tenant_user_id    uuid
billing_period    text NOT NULL (e.g. '2026-02')
utility_type      text NOT NULL (water, electricity, internet, cleaning, other)
allocation_method text NOT NULL (metered, equal_split, weighted_split, fixed)
total_cost        numeric NOT NULL
unit_share        numeric NOT NULL (tenant's portion)
quantity          numeric (usage units for metered)
rate              numeric
invoice_id        uuid FK invoices (linked when invoiced)
status            text DEFAULT 'pending' (pending, invoiced, paid)
created_at        timestamptz DEFAULT now()
```

**`utility_settings`** -- Per-property utility configuration:
```
id                uuid PK
merchant_id       uuid FK merchants
property_id       uuid FK properties
utility_type      text NOT NULL
allocation_method text NOT NULL DEFAULT 'equal_split'
rate_per_unit     numeric (for metered types)
fixed_monthly     numeric (for fixed allocation)
weight_config     jsonb (unit_type -> weight mapping for weighted split)
is_active         boolean DEFAULT true
created_at        timestamptz DEFAULT now()
updated_at        timestamptz DEFAULT now()
```

RLS: All tables scoped to merchant via `merchant_id = auth.uid()` through merchants lookup. Tenant read access for their own charges.

### 1B: Utility Billing Service

Create `src/features/utilities/services/utilityBillingService.ts`:
- `fetchSettings(propertyId)` -- get utility config for a property
- `saveSettings(propertyId, settings[])` -- upsert utility settings
- `submitMeterReading(data)` -- insert reading, auto-calculate usage
- `fetchReadings(propertyId, period)` -- readings for a billing period
- `generateCharges(propertyId, period)` -- compute charges per unit per utility type:
  - **Metered** (water/electricity): usage x rate_per_unit
  - **Equal split** (internet): total_cost / occupied_units_count
  - **Weighted split** (cleaning): total_cost x (unit_weight / sum_weights)
  - **Fixed** (flat monthly): fixed_monthly amount per unit
- `fetchCharges(propertyId, period)` -- list charges for a period
- `createUtilityInvoices(propertyId, period)` -- generate one invoice per tenant with line_items for each utility type, link via `invoice_id` on charges

### 1C: Utility Management Page

Create `src/pages/merchant/UtilityBilling.tsx`:
- **Tab 1: Pengaturan** -- Per-property utility settings (which utilities are active, rates, allocation method)
- **Tab 2: Input Meter** -- Monthly meter reading form. Select property, month. Grid of units with previous/current reading input. Optional photo upload for meter
- **Tab 3: Tagihan Utilitas** -- Generated charges view per period. Status badges (pending/invoiced/paid). "Generate Invoice" button to create invoices for all pending charges
- **Stats strip**: Total charges this month, pending amount, billed amount

### 1D: Meter Reading Form

Create `src/features/utilities/components/MeterReadingForm.tsx`:
- Property + period selector at top
- Grid/table of occupied units (fetched from contracts)
- Each row: unit number, previous reading (auto-filled from last period), current reading input, calculated usage
- Batch submit all readings at once
- Validation: current >= previous

### 1E: Utility Charge Generator

Create `src/features/utilities/components/UtilityChargeGenerator.tsx`:
- Select property + period
- Shows breakdown: each utility type, total cost, per-unit allocation
- Preview mode before confirming generation
- "Generate & Invoice" button creates charges + invoices in one action

### 1F: Tenant Utility View

Enhance tenant invoice detail or create section in tenant dashboard:
- When invoice has utility line_items, show breakdown:
  - "Air: {usage} m3 x Rp {rate} = Rp {total}"
  - "Internet: Rp {total} / {unit_count} unit = Rp {share}"
  - "Kebersihan: Rp {total} x {weight}% = Rp {share}"

### 1G: Hooks

Create `src/features/utilities/hooks/useUtilityBilling.ts`:
- `useUtilitySettings(propertyId)` -- query settings
- `useSaveSettings()` -- mutation
- `useMeterReadings(propertyId, period)` -- query readings
- `useSubmitReadings()` -- mutation
- `useUtilityCharges(propertyId, period)` -- query charges
- `useGenerateCharges()` -- mutation
- `useGenerateUtilityInvoices()` -- mutation

---

## Feature 2: Document Template Library

### 2A: Database -- `document_templates` Table

```
id                uuid PK
merchant_id       uuid FK merchants
name              text NOT NULL
description       text
category          text NOT NULL (lease_contract, house_rules, move_in_checklist, inspection_report, eviction_notice, payment_reminder, other)
content           text NOT NULL (template body with {{variable}} placeholders)
variables         jsonb (list of available variables with descriptions)
is_default        boolean DEFAULT false
is_system         boolean DEFAULT false (pre-drafted system templates)
version           integer DEFAULT 1
created_at        timestamptz DEFAULT now()
updated_at        timestamptz DEFAULT now()
```

RLS: merchant CRUD on own templates. System templates (is_system=true) readable by all merchants.

Seed system templates via migration with standard Indonesian kos contract, house rules, move-in checklist, inspection report, eviction notice, payment reminder.

### 2B: Template Service

Create `src/features/documents/services/documentTemplateService.ts`:
- `fetchTemplates(merchantId, category?)` -- list templates (own + system)
- `createTemplate(data)` -- insert new template, increment version on update
- `updateTemplate(id, data)` -- update content, bump version, keep old version as snapshot in `document_template_versions` (optional -- can store version history in same table with parent_id)
- `deleteTemplate(id)` -- delete (only non-system)
- `duplicateTemplate(id)` -- copy system template to merchant's own for customization
- `fillTemplate(templateId, variables)` -- replace `{{variable}}` placeholders with actual data
- `getAvailableVariables(category)` -- return variable list per category (tenant_name, unit_number, rent_amount, property_name, start_date, end_date, etc.)

### 2C: Template Library Page

Create `src/pages/merchant/DocumentTemplates.tsx`:
- Grid/list of templates grouped by category
- System templates marked with badge "Template Standar"
- Each card shows: name, category, last updated, version number
- Actions: Edit, Duplicate, Delete, Preview, Use/Fill

### 2D: Template Editor Component

Create `src/features/documents/components/DocumentTemplateEditor.tsx`:
- Rich text area with variable insertion toolbar
- Variable picker sidebar: click to insert `{{variable_name}}` at cursor
- Preview mode: show template with sample data filled in
- Category selector
- Save / Save as New Version

### 2E: Template Fill & Export

Create `src/features/documents/components/DocumentFillDialog.tsx`:
- Select a template
- Auto-fill variables from selected contract/tenant/property data
- Manual override for any variable
- Preview filled document
- Export options: Copy text, Download as PDF (via existing generate-invoice-pdf pattern or simple HTML-to-PDF)

### 2F: Migrate Existing ContractTemplateManager

The existing `ContractTemplateManager.tsx` uses localStorage. Migrate to use the new database-backed service:
- Update `useContractTemplates` hook to use `documentTemplateService` filtered by `category = 'lease_contract'`
- Keep backward compatibility by importing any localStorage templates on first load

### 2G: Hooks

Create `src/features/documents/hooks/useDocumentTemplates.ts`:
- `useDocumentTemplates(merchantId, category?)` -- query
- `useCreateTemplate()` -- mutation
- `useUpdateTemplate()` -- mutation
- `useDeleteTemplate()` -- mutation
- `useDuplicateTemplate()` -- mutation
- `useFillTemplate()` -- fill variables and return rendered content

---

## Navigation & Routes

| Route | Page | Nav Group |
|-------|------|-----------|
| `/merchant/utility-billing` | New | Keuangan |
| `/merchant/document-templates` | New | Wawasan (near existing documents) |

Add to `navigation-config.ts` under appropriate groups with icons: `Gauge` for utilities, `FileStack` for document templates.

---

## Files Summary

| Action | File | Description |
|--------|------|-------------|
| CREATE | DB migration | 3 utility tables + document_templates table + seed system templates |
| CREATE | `src/features/utilities/services/utilityBillingService.ts` | Meter reading, charge calculation, invoice generation |
| CREATE | `src/features/utilities/hooks/useUtilityBilling.ts` | TanStack Query hooks |
| CREATE | `src/features/utilities/components/MeterReadingForm.tsx` | Batch meter reading input |
| CREATE | `src/features/utilities/components/UtilityChargeGenerator.tsx` | Charge preview + generation |
| CREATE | `src/features/utilities/components/UtilitySettingsForm.tsx` | Per-property utility config |
| CREATE | `src/pages/merchant/UtilityBilling.tsx` | Main page with tabs |
| CREATE | `src/features/documents/services/documentTemplateService.ts` | Template CRUD + fill |
| CREATE | `src/features/documents/hooks/useDocumentTemplates.ts` | TanStack Query hooks |
| CREATE | `src/features/documents/components/DocumentTemplateEditor.tsx` | Editor with variable insertion |
| CREATE | `src/features/documents/components/DocumentFillDialog.tsx` | Fill + preview + export |
| CREATE | `src/pages/merchant/DocumentTemplates.tsx` | Template library page |
| MODIFY | `src/features/contracts/components/ContractTemplateManager.tsx` | Migrate from localStorage to DB |
| MODIFY | `src/shared/components/layouts/navigation-config.ts` | Add 2 new nav items |
| MODIFY | `src/App.tsx` | Add 2 new routes |
| MODIFY | `old-docs/PMS_Audit_Report_FULL.md` | Mark utility billing + document template status |

---

## Technical Notes

- Meter readings use `numeric` for precision (water m3, electricity kWh)
- Utility invoices reuse existing `invoices` table with `line_items` JSONB for breakdown
- Charge generation is idempotent -- won't duplicate if charges already exist for a period
- System templates are seeded via migration and marked `is_system = true` (non-deletable by merchants)
- Template variables use `{{double_brace}}` syntax for simple string replacement
- PDF export can reuse the existing `generate-invoice-pdf` edge function pattern or use client-side HTML rendering
- The `units` table already has `electricity_included`, `water_included`, `wifi_included` fields -- utility settings complement these by defining billing rules when NOT included in rent
- No new npm packages needed

