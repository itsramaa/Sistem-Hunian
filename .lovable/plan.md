
# UI/UX Improvements: Data Quality, Guardian Select, Scrollbar, Tenant Creation, Settings Cleanup, and Mobile Sidebar

## 1. Remove Data Quality Tab from Property Detail

Remove the "Kualitas Data" tab from `PropertyDetail.tsx`. It already exists as a standalone page at `/merchant/data-quality` accessible via the Alat/InsightsHub card.

**File:** `src/pages/merchant/PropertyDetail.tsx`
- Remove `data-quality` from `validTabs` array
- Remove the `data-quality` option from the "Lainnya" dropdown menu
- Remove the `TabsContent value="data-quality"` section
- Remove the `LazyDataQuality` import if no longer needed

## 2. Guardian Select in Property Form (Instead of Manual Input)

Replace the manual "Info Penjaga" input fields in `PropertyFormDialog.tsx` (Step 2) with a Select dropdown that lists existing guardians. Add a "Tambah Penjaga Baru" button that opens the `GuardianFormDialog`.

**File:** `src/features/properties/components/PropertyFormDialog.tsx`
- Remove `guardian_name` and `guardian_phone` from schema (they stay in DB but populated via guardian assignment)
- Replace manual inputs with a `Select` dropdown fetching guardians from `property_guardians` table
- Add a `useState` for opening `GuardianFormDialog` inline
- Store selected `guardian_id` instead of name/phone (or keep name/phone populated from selected guardian)
- Add "Tambah Baru" button next to the Select

**File:** `src/features/properties/components/GuardianFormDialog.tsx`
- Add `photo_url` field to the schema
- Add `FileUpload` component for photo upload (using `property-images` bucket)
- Display photo preview when editing existing guardian

## 3. Guardian Form Photo Upload

**File:** `src/features/properties/components/GuardianFormDialog.tsx`
- Add `photo_url` to the zod schema (optional string)
- Add `FileUpload` or `UnitPhotoUpload` component for photo upload
- Show existing photo when editing a guardian
- Save `photo_url` to the `property_guardians` table (column already exists)

## 4. Global Scrollbar Styling

Make all scrollbars match the sidebar's dark, eye-catching scrollbar style.

**File:** `src/index.css`
- Update `.custom-scrollbar` to use a more visible, styled thumb (e.g., `hsl(var(--primary) / 0.3)` thumb with rounded corners)
- Apply global scrollbar styles to `*` or `body` so all scrollable areas get the same look
- Make the scrollbar thumb more visible with hover effect matching sidebar style

## 5. Change "Tambah Tenant" to Create Account (Not Select)

Transform `AddTenantDialog` from "pick existing tenant" to "create new tenant account" flow.

**Step 1 changes:** Remove tenant picker. Replace with form fields: email, password, full name, phone (basic info only for login access).

**File:** `src/features/users/components/tenant/AddTenantDialog.tsx`
- Step 1: Show email, password, full_name, phone fields (create account)
- Step 2: Property & unit selection (keep as-is)
- Step 3: Contract details (keep as-is)
- On submit: call an edge function or Supabase admin API to create the user account, then create the contract

**File:** `src/features/users/types/addTenantSchema.ts`
- Add `password` field with strong password validation (min 12 chars per security policy)
- Keep existing fields

**File:** `src/features/users/services/merchantTenantService.ts`
- Update `addTenantDirectly` to call an edge function that creates the user via `supabase.auth.admin.createUser()` (since client can't create users for others)
- The edge function creates user, profile, user_role, then returns user_id for contract creation

**New edge function:** `supabase/functions/create-tenant-account/index.ts`
- Accepts: email, password, full_name, phone, merchant_id
- Creates user via admin API with email confirmed
- Creates profile, user_role (tenant), and links to merchant
- Returns user_id

## 6. Settings: Remove Theme Tab, Remove "Perbankan" from Profile

**File:** `src/pages/merchant/Settings.tsx`
- Remove the "Tema" tab and its `TabsContent`
- Remove theme-related imports (`useTheme`, `RadioGroup`, `Palette`)
- Move "Keamanan" (password change) content to Profile page
- Default tab becomes "notifications"

**File:** `src/pages/merchant/Profile.tsx`
- Remove "Perbankan" tab (it's already in Settings)
- Add "Keamanan" tab with the password change form (moved from Settings)
- Profile tabs: Bisnis, Verifikasi, Keamanan

## 7. Mobile Sidebar Navigation for Merchant

Currently merchant on mobile only has `MobileHeader` with breadcrumbs but no way to navigate between sections (no sidebar, no bottom nav). Need to add a hamburger menu that opens a slide-out sidebar.

**File:** `src/shared/components/layouts/MobileHeader.tsx`
- Add a hamburger/menu button (visible when `!config.hasBottomNav`)
- On click, open a Sheet/Drawer from the left showing the full navigation menu (same items as desktop sidebar)

**New file:** `src/shared/components/layouts/MobileSidebarSheet.tsx`
- Sheet component that slides from left
- Renders the same navigation groups from `navigationConfig[role].mainNav`
- Includes role brand header
- Closes on nav item click

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/merchant/PropertyDetail.tsx` | Remove data-quality tab |
| `src/features/properties/components/PropertyFormDialog.tsx` | Guardian select dropdown + add new button |
| `src/features/properties/components/GuardianFormDialog.tsx` | Add photo upload field |
| `src/index.css` | Global scrollbar styling |
| `src/features/users/components/tenant/AddTenantDialog.tsx` | Create account flow instead of select |
| `src/features/users/types/addTenantSchema.ts` | Add password field |
| `src/features/users/services/merchantTenantService.ts` | Call edge function for user creation |
| `supabase/functions/create-tenant-account/index.ts` | **New**: Edge function to create tenant user |
| `src/pages/merchant/Settings.tsx` | Remove Theme tab, remove Security (moved to Profile) |
| `src/pages/merchant/Profile.tsx` | Remove Perbankan tab, add Keamanan tab |
| `src/shared/components/layouts/MobileHeader.tsx` | Add hamburger menu button |
| `src/shared/components/layouts/MobileSidebarSheet.tsx` | **New**: Mobile navigation sheet |

## Technical Notes

- `property_guardians.photo_url` column already exists in the database -- no migration needed for photo upload
- Edge function `create-tenant-account` uses `SUPABASE_SERVICE_ROLE_KEY` (already configured) for admin user creation
- The tenant account is created with email auto-confirmed so they can login immediately
- Guardian select in property form queries guardians filtered by merchant_id
- Global scrollbar uses CSS custom properties matching the design system's primary color
- Mobile sidebar sheet uses the same `navigationConfig` data as desktop sidebar for consistency
