

# Data Import/Export Requirements Implementation

## Current Status Summary

| Requirement | Status | Detail |
|---|---|---|
| IR-501: CSV/Excel bulk import | Partial | CSV import exists for properties only; no Excel support; no unit import |
| IR-502: Column mapping | Not implemented | Headers must match template exactly |
| IR-503: Validation rules on import | Implemented | Zod schema validation per row |
| IR-504: Error report with row numbers | Implemented | Errors shown per row with details |
| IR-601: Export filtered data to CSV/Excel | Implemented | `exportToCSV`, `exportToExcel` utilities used across multiple pages |
| IR-602: Export metadata | Not implemented | Exports lack timestamp, user info, and filter context |
| IR-603: Proper Excel formatting | Partial | Tab-separated with BOM; not true .xlsx |
| IR-701: JSON API export | Not implemented | No dedicated endpoint |
| IR-702: Schema matches internal model | Not implemented | No endpoint exists |
| IR-703: Pagination for large datasets | Not implemented | No endpoint exists |

## Implementation Plan

### Task 1: Add Column Mapping to CSV Import (IR-502)

Enhance `PropertyImportDialog.tsx` with an intermediate "Map Columns" step between upload and preview:

- After parsing CSV headers, show a UI where each required field (name, property_type, address, etc.) can be mapped to any detected CSV column via dropdown selects
- Auto-detect matches (e.g., "nama" maps to "name", "alamat" maps to "address")
- Apply mapping before Zod validation runs

### Task 2: Add Export Metadata (IR-602)

Update `exportToCSV` and `exportToExcel` in `src/shared/utils/exportUtils.ts`:

- Prepend metadata rows to CSV/Excel output: export timestamp, exported by (current user email), and active filters description
- Add optional `metadata` parameter to export functions: `{ exportedBy?: string; filters?: Record<string, string> }`
- Update `exportToPDF` to include metadata in the header section

### Task 3: JSON API Export Endpoint (IR-701, IR-702, IR-703)

Create a new Edge Function `supabase/functions/data-export/index.ts`:

- Accepts query parameters: `entity` (properties, units, payments, contracts), `page`, `page_size`, `filters`
- Authenticates via JWT and scopes data to the merchant
- Returns paginated JSON matching the internal data model schema
- Response format:
```text
{
  "data": [...],
  "meta": {
    "page": 1,
    "page_size": 50,
    "total": 234,
    "exported_at": "2026-02-23T...",
    "exported_by": "user@email.com"
  }
}
```

### Task 4: Extend Bulk Import to Units (IR-501 enhancement)

Create `UnitImportDialog.tsx` following the same pattern as `PropertyImportDialog`:

- CSV template with unit fields (unit_number, unit_type, floor, size_sqm, rent_amount, status, etc.)
- Zod validation using existing `unitSchema`
- Column mapping step (from Task 1 pattern)
- Error report with row-level details (IR-504)
- Add import button to the Units management page

## Technical Details

### Column Mapping Component

New shared component `src/shared/components/ColumnMapper.tsx`:
- Props: `csvHeaders: string[]`, `requiredFields: { key: string; label: string; required: boolean }[]`
- Uses fuzzy matching (Levenshtein or simple includes) for auto-suggestions
- Returns a `Record<string, string>` mapping

### Export Metadata Format (CSV)

```text
# Exported: 2026-02-23 14:30:00
# Exported By: user@example.com  
# Filters: Status=active, City=Jakarta
# ---
Date,Amount,Status,...
```

### Edge Function: data-export

- Validates auth token and resolves merchant_id
- Whitelist of allowed entities prevents arbitrary table access
- Uses Supabase client with `.range()` for pagination
- Caps `page_size` at 100 to prevent abuse

### File Changes Summary

| File | Action |
|---|---|
| `src/shared/components/ColumnMapper.tsx` | Create - reusable column mapping UI |
| `src/shared/utils/exportUtils.ts` | Modify - add metadata support to CSV/Excel/PDF exports |
| `src/features/properties/components/PropertyImportDialog.tsx` | Modify - add column mapping step |
| `src/features/properties/components/UnitImportDialog.tsx` | Create - bulk unit import with validation |
| `supabase/functions/data-export/index.ts` | Create - paginated JSON API export |
| `src/pages/merchant/Properties.tsx` | Modify - wire unit import dialog |

