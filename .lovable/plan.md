

# Data Import/Export Requirements Implementation

## Current Status Summary

| Requirement | Status | Detail |
|---|---|---|
| IR-501: CSV/Excel bulk import | ✅ Implemented | CSV import for properties AND units with column mapping |
| IR-502: Column mapping | ✅ Implemented | Reusable ColumnMapper component with auto-detect |
| IR-503: Validation rules on import | ✅ Implemented | Zod schema validation per row |
| IR-504: Error report with row numbers | ✅ Implemented | Errors shown per row with details |
| IR-601: Export filtered data to CSV/Excel | ✅ Implemented | `exportToCSV`, `exportToExcel` utilities |
| IR-602: Export metadata | ✅ Implemented | Optional metadata param for timestamp, user, filters |
| IR-603: Proper Excel formatting | Partial | Tab-separated with BOM; not true .xlsx |
| IR-701: JSON API export | ✅ Implemented | `data-export` edge function |
| IR-702: Schema matches internal model | ✅ Implemented | Returns raw DB schema |
| IR-703: Pagination for large datasets | ✅ Implemented | page/page_size params, max 100 per page |

## Completed Changes

| File | Action |
|---|---|
| `src/shared/components/ColumnMapper.tsx` | Created - reusable column mapping UI with auto-detect |
| `src/shared/utils/exportUtils.ts` | Modified - added ExportMetadata support to CSV/Excel/PDF |
| `src/features/properties/components/PropertyImportDialog.tsx` | Modified - added column mapping step |
| `src/features/properties/components/UnitImportDialog.tsx` | Created - bulk unit import with validation |
| `supabase/functions/data-export/index.ts` | Created - paginated JSON API export |
| `src/pages/merchant/Units.tsx` | Modified - wired unit import dialog |
