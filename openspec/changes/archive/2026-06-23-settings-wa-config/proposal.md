# Proposal: Settings — WhatsApp Recipient Config

## Problem
Nomor WA penerima notifikasi (operator/manager) saat ini hardcoded di backend environment variable. Tidak ada cara untuk mengubah nomor penerima dari UI. Jika nomor berganti atau ingin tambah penerima baru, perlu edit .env dan restart server.

## Solution
Tambah halaman/section Settings untuk konfigurasi WA recipient — bisa tambah, edit, hapus nomor WA penerima. Backend perlu tabel `wa_config` untuk menyimpan konfigurasi dan endpoint CRUD-nya.

## Scope
- **Frontend** — `src/features/settings/pages/Settings.tsx` (atau tab baru di Settings)
- **Backend** — tabel `wa_config`, endpoint `GET/PUT /api/v1/settings/wa-config`

## Backend Requirements

### Migration
```sql
-- +goose Up
CREATE TABLE wa_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO wa_config (key, value, description) VALUES
  ('recipient_numbers', '', 'Nomor WA penerima notifikasi (pisahkan dengan koma)'),
  ('notification_enabled', 'true', 'Aktifkan notifikasi WhatsApp');
```

### Endpoints
```
GET  /api/v1/settings/wa-config
Response: { recipient_numbers: string[], notification_enabled: boolean }

PUT  /api/v1/settings/wa-config
Body: { recipient_numbers: string[], notification_enabled: boolean }
Response: { success: true }
```

## Frontend Implementation Plan

### Settings.tsx — tambah tab/section WA Config (operator only)
```tsx
// State
const [recipients, setRecipients] = useState<string[]>([]);
const [newNumber, setNewNumber] = useState("");
const [notifEnabled, setNotifEnabled] = useState(true);

// Fetch
const { data } = useQuery({
  queryKey: ["wa-config"],
  queryFn: () => apiClient.get("/settings/wa-config").then(r => r.data),
});

// UI — list nomor dengan add/remove
<div className="glass-card p-4 space-y-4">
  <div className="flex items-center justify-between">
    <h3 className="text-sm font-semibold">Penerima Notifikasi WhatsApp</h3>
    <Switch checked={notifEnabled} onCheckedChange={setNotifEnabled} />
  </div>
  <div className="space-y-2">
    {recipients.map((num, i) => (
      <div key={i} className="flex items-center gap-2">
        <span className="flex-1 text-sm">{num}</span>
        <Button variant="ghost" size="icon" onClick={() => removeNumber(i)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    ))}
    <div className="flex gap-2">
      <Input
        placeholder="628xxxxxxxxxx"
        value={newNumber}
        onChange={e => setNewNumber(e.target.value)}
      />
      <Button onClick={addNumber}>Tambah</Button>
    </div>
  </div>
  <Button onClick={handleSave} disabled={isSaving}>Simpan</Button>
</div>
```

## Acceptance Criteria
- [ ] Section WA Config hanya muncul untuk role operator
- [ ] Tampilkan daftar nomor WA penerima saat ini
- [ ] Bisa tambah nomor baru (validasi format 628xxx)
- [ ] Bisa hapus nomor dari daftar
- [ ] Toggle aktif/nonaktif notifikasi WA
- [ ] Simpan config ke backend via `PUT /settings/wa-config`
- [ ] Backend menggunakan config dari DB saat kirim notifikasi (tidak hardcode env)
- [ ] Toast success/error setelah save
