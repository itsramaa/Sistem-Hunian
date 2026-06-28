# 13 — Shared Components

**Location**: `src/shared/components/ui/`, global patterns

---

## Current Issues

- Empty state belum ada komponen terpusat
- Loading skeleton tidak konsisten antar halaman
- Status badge mungkin dibuat inline di banyak tempat
- Page header tidak punya komponen terpusat

---

## Enhancement Specification

### 1. PageHeader Component

```tsx
<PageHeader
  title="Properti"
  subtitle="Kelola semua properti kos"
  action={<Button>+ Tambah</Button>}
/>
```

Renders:
```
[title text-2xl font-bold]              [action]
[subtitle text-sm text-muted-foreground]
[divider border-b mt-4]
```

### 2. StatusBadge Component

Single source of truth untuk semua status:

```tsx
<StatusBadge status="available" />
<StatusBadge status="occupied" />
<StatusBadge status="paid" />
```

Status → Label + Color mapping (sesuai semantic table di proposal.md utama)

### 3. EmptyState Component

```tsx
<EmptyState
  icon={Building2}
  title="Belum ada properti"
  description="Mulai dengan menambahkan properti pertama"
  action={<Button>+ Tambah Properti</Button>}
/>
```

Renders:
```
[Icon besar text-muted-foreground/40 w-12 h-12]
[title text-lg font-medium]
[description text-sm text-muted-foreground]
[action button optional]
```

### 4. DataTableSkeleton Component

```tsx
<DataTableSkeleton rows={5} columns={6} />
```

Renders tabel skeleton proporsional dengan ukuran tabel asli.

### 5. ConfirmDialog Component

```tsx
<ConfirmDialog
  title="Hapus Properti"
  description="Properti tidak dapat dihapus jika masih memiliki kamar."
  onConfirm={handleDelete}
  confirmLabel="Hapus"
  confirmVariant="destructive"
/>
```

Wrapper around Shadcn `<AlertDialog>`.

### 6. CurrencyDisplay Component

```tsx
<CurrencyDisplay value={1200000} />
// Output: Rp 1.200.000
```

Consistent Rupiah formatting across all pages.

### 7. RelativeTime Component

```tsx
<RelativeTime date="2026-06-20T10:00:00Z" />
// Output: "3 hari yang lalu"
```

### 8. FilterBar Component

```tsx
<FilterBar>
  <FilterSearch placeholder="Cari nama..." onChange={...} />
  <FilterSelect options={statusOptions} onChange={...} />
  <FilterReset onReset={...} />
</FilterBar>
```

Consistent horizontal filter layout.

### 9. Global Toast Conventions

```ts
// Success
toast.success("Properti berhasil ditambahkan")

// Error
toast.error(getApiErrorMessage(err))

// Loading (jarang, hanya untuk operasi panjang)
toast.loading("Memproses...")
```

---

## Acceptance Criteria

- [ ] `PageHeader` dipakai di semua halaman
- [ ] `StatusBadge` single source of truth untuk semua status
- [ ] `EmptyState` dipakai di semua list yang bisa kosong
- [ ] `DataTableSkeleton` dipakai di semua halaman dengan tabel
- [ ] `ConfirmDialog` dipakai untuk semua destructive action
- [ ] `CurrencyDisplay` dipakai di semua tempat yang tampilkan harga
- [ ] Toast convention konsisten di semua mutasi
