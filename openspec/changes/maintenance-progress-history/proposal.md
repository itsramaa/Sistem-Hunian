# Proposal: Maintenance — Multi-Progress Update History

## Problem
Maintenance saat ini hanya menyimpan satu status dan satu tindakan penanganan. Tidak ada riwayat progress — operator tidak bisa lihat kapan status berubah, siapa yang mengubah, dan catatan per-update.

## Solution
Tambah progress log di Maintenance Detail yang menampilkan timeline perubahan status. Backend perlu tabel `maintenance_logs` untuk menyimpan riwayat setiap update.

## Scope
- **Backend** — migration baru tabel `maintenance_logs`, endpoint `GET /api/v1/maintenances/:id/logs`
- **Frontend** — section timeline di `MaintenanceDetail.tsx`

## Backend Requirements

### Migration
```sql
-- +goose Up
CREATE TABLE maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_id UUID NOT NULL REFERENCES maintenances(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  catatan TEXT,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_maintenance_logs_maintenance_id ON maintenance_logs(maintenance_id);
```

### Endpoint
```
GET /api/v1/maintenances/:id/logs
Response: { success: true, data: MaintenanceLog[] }
```

### Handler — saat UPDATE maintenance
Setiap kali `PUT /api/v1/maintenances/:id` dipanggil, insert record ke `maintenance_logs`.

## Frontend Implementation Plan

### MaintenanceDetail.tsx — tambah timeline section
```tsx
const { data: logsData } = useMaintenanceLogs(id);
const logs = logsData ?? [];

{logs.length > 0 && (
  <div className="glass-card p-4 space-y-3">
    <h2 className="text-sm font-semibold">Riwayat Progress</h2>
    <div className="space-y-3">
      {logs.map((log, i) => (
        <div key={log.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full ${statusColor[log.status]}`} />
            {i < logs.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1" />}
          </div>
          <div className="pb-3">
            <p className="text-sm font-medium">{statusLabel[log.status]}</p>
            {log.catatan && <p className="text-xs text-muted-foreground">{log.catatan}</p>}
            <p className="text-xs text-muted-foreground mt-0.5">{fmt(log.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

## Acceptance Criteria
- [ ] Setiap update maintenance mencatat log ke `maintenance_logs`
- [ ] GET /maintenances/:id/logs mengembalikan log terurut terbaru
- [ ] Maintenance Detail menampilkan timeline progress
- [ ] Timeline menampilkan status, catatan, dan waktu update
- [ ] Frontend hook `useMaintenanceLogs` tersedia
