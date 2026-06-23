# Proposal: Audit Trail — Export & Filter by User

## Problem
Audit trail saat ini sudah punya filter properti, tanggal, dan jenis perubahan. Namun dua fitur penting masih kurang:
1. **Filter by user** — tidak bisa lihat siapa yang melakukan perubahan tertentu
2. **Export** — tidak ada cara download data audit trail untuk keperluan laporan/rekap

## Solution
Tambah filter `changed_by` (dropdown user) dan tombol Export CSV di halaman Audit Trail.

## Scope
- **Frontend** — `src/features/audit/pages/AuditTrailPage.tsx`
- **Backend** — update `GET /api/v1/audit/room-status` untuk support filter `changed_by`, tambah `GET /api/v1/audit/room-status/export` untuk CSV download

## Backend Requirements

### Update existing endpoint
```
GET /api/v1/audit/room-status?changed_by=<user_id>&...
```
Tambah filter `changed_by` di `audit_repo.go` dan `audit_service.go`.

### Export endpoint
```
GET /api/v1/audit/room-status/export?property_id=&from_date=&to_date=&changed_by=&new_status=
Response: text/csv
Content-Disposition: attachment; filename="audit-trail-<date>.csv"
```
CSV columns: `Tanggal`, `Kamar`, `Properti`, `Status Lama`, `Status Baru`, `Diubah Oleh`, `Alasan`

## Frontend Implementation Plan

### 1. Tambah users list query
```ts
const { data: usersData } = useQuery({
  queryKey: ["users-list"],
  queryFn: () => apiClient.get("/users").then(r => r.data?.data ?? []),
});
const users = usersData ?? [];
```

### 2. Tambah filter dropdown "Diubah Oleh"
```tsx
<Select value={changedByFilter || "_all"} onValueChange={(v) => { setChangedByFilter(v === "_all" ? "" : v); setPage(1); }}>
  <SelectTrigger className="w-[180px] rounded-xl h-10">
    <SelectValue placeholder="Semua user" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="_all">Semua user</SelectItem>
    {users.map((u: any) => (
      <SelectItem key={u.id} value={u.id}>{u.nama}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

### 3. Tombol Export CSV
```tsx
const handleExport = async () => {
  const params = new URLSearchParams();
  if (propertyFilter) params.set("property_id", propertyFilter);
  if (fromDate) params.set("from_date", fromDate);
  if (toDate) params.set("to_date", toDate);
  if (newStatusFilter) params.set("new_status", newStatusFilter);
  if (changedByFilter) params.set("changed_by", changedByFilter);

  const response = await apiClient.get(`/audit/room-status/export?${params}`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(response.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-trail-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

<Button variant="outline" onClick={handleExport} className="gap-2 rounded-xl h-10">
  <Download className="h-4 w-4" /> Export CSV
</Button>
```

## Acceptance Criteria
- [ ] Filter "Diubah Oleh" menampilkan dropdown list user
- [ ] Filter bekerja kombinasi dengan filter lain (properti, tanggal, status)
- [ ] Backend support `changed_by` query param di endpoint audit
- [ ] Tombol Export CSV muncul di header Audit Trail
- [ ] Export menghasilkan file CSV dengan semua filter aktif diterapkan
- [ ] Backend endpoint export mengembalikan CSV dengan header yang benar
- [ ] Nama file: `audit-trail-YYYY-MM-DD.csv`
