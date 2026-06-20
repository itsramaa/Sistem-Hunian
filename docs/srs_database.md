# SRS — Database
# Sistem Informasi Manajemen Kos Multi-Properti Berbasis Web

**Versi:** 1.0 | Lihat `srs_overview.md` untuk konteks penuh.

---

## 1. Teknologi

- **DBMS:** PostgreSQL 15+
- **Alasan:** Integritas relasional tinggi. Data operasional kos memiliki banyak relasi antar entitas yang harus terjaga konsistensinya — pembayaran harus terhubung ke kamar dan penghuni yang valid, konfirmasi harus terikat pada status kamar yang bersangkutan.

---

## 2. Skema Database

### Tabel `users`

```sql
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20) NOT NULL CHECK (role IN ('operator', 'manager', 'viewer')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Tabel `properties`

```sql
CREATE TABLE properties (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama        VARCHAR(255) NOT NULL,
    alamat      VARCHAR(500) NOT NULL,
    deskripsi   TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Tabel `rooms`

```sql
CREATE TABLE rooms (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id  UUID NOT NULL REFERENCES properties(id),
    nomor_kamar  VARCHAR(50) NOT NULL,
    tipe_kamar   VARCHAR(100) NOT NULL,
    harga_sewa   NUMERIC(12,2) NOT NULL CHECK (harga_sewa > 0),
    status       VARCHAR(20) NOT NULL DEFAULT 'available'
                 CHECK (status IN ('available', 'dp_confirmation', 'occupied')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (property_id, nomor_kamar)
);
```

### Tabel `tenants`

```sql
CREATE TABLE tenants (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id          UUID NOT NULL REFERENCES rooms(id),
    nama             VARCHAR(255) NOT NULL,
    no_identitas     VARCHAR(100) NOT NULL,
    no_telepon       VARCHAR(30) NOT NULL,
    tanggal_masuk    DATE NOT NULL,
    durasi_sewa      INTEGER NOT NULL CHECK (durasi_sewa > 0),
    status           VARCHAR(20) NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active', 'checked_out')),
    tanggal_keluar   DATE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Catatan:** Penghuni yang telah keluar tidak dihapus. `tanggal_keluar` terisi saat checkout, `status` diubah menjadi `checked_out`. Histori hunian per kamar tetap dapat ditelusuri.

### Tabel `payments`

```sql
CREATE TABLE payments (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id            UUID NOT NULL REFERENCES rooms(id),
    tenant_id          UUID NOT NULL REFERENCES tenants(id),
    periode            VARCHAR(7) NOT NULL,        -- format: YYYY-MM
    nominal            NUMERIC(12,2) NOT NULL CHECK (nominal > 0),
    tanggal_bayar      DATE,
    status             VARCHAR(20) NOT NULL DEFAULT 'unpaid'
                       CHECK (status IN ('unpaid', 'paid', 'overdue')),
    bukti_transfer_url TEXT,
    created_by         UUID REFERENCES users(id),
    updated_by         UUID REFERENCES users(id),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Catatan:** `tanggal_bayar` dan `bukti_transfer_url` bersifat nullable — dapat terisi setelah pencatatan awal. Histori pembayaran **tidak boleh dihapus**.

### Tabel `confirmations`

```sql
CREATE TABLE confirmations (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id                  UUID NOT NULL REFERENCES rooms(id),
    nama_calon_penghuni      VARCHAR(255) NOT NULL,
    nominal_dp               NUMERIC(12,2) NOT NULL CHECK (nominal_dp > 0),
    batas_tanggal_konfirmasi DATE NOT NULL,
    status                   VARCHAR(20) NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'confirmed', 'expired')),
    updated_by               UUID REFERENCES users(id),
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Constraint aplikasi:** Satu kamar hanya boleh memiliki satu baris `confirmations` dengan `status = 'pending'` dalam satu waktu. Constraint ini di-enforce di service layer (bukan di DB constraint) untuk memberikan pesan error yang informatif.

### Tabel `maintenances`

```sql
CREATE TABLE maintenances (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id             UUID NOT NULL REFERENCES rooms(id),
    tanggal_laporan     DATE NOT NULL,
    deskripsi_kerusakan TEXT NOT NULL,
    tindakan_penanganan TEXT,
    biaya               NUMERIC(12,2) DEFAULT 0,
    status              VARCHAR(20) NOT NULL DEFAULT 'reported'
                        CHECK (status IN ('reported', 'in_progress', 'completed')),
    created_by          UUID REFERENCES users(id),
    updated_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Catatan:** `tindakan_penanganan` dan `biaya` nullable — diisi saat update, bukan saat membuat laporan awal. Histori **tidak boleh dihapus**.

### Tabel `notifications`

```sql
CREATE TABLE notifications (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipe         VARCHAR(50) NOT NULL
                 CHECK (tipe IN ('dp_reminder', 'dp_expired', 'payment_due', 'payment_overdue')),
    referensi_id UUID NOT NULL,     -- FK ke confirmations.id atau payments.id (bergantung tipe)
    pesan        TEXT NOT NULL,
    is_read      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Catatan:** `referensi_id` tidak menggunakan foreign key constraint karena menunjuk ke dua tabel berbeda bergantung nilai `tipe`. Resolusi referensi dilakukan di application layer.

---

## 3. Indexes

```sql
-- Lookup kamar per properti (dashboard, filter)
CREATE INDEX idx_rooms_property_id ON rooms(property_id);
CREATE INDEX idx_rooms_status ON rooms(status);

-- Lookup penghuni aktif per kamar
CREATE INDEX idx_tenants_room_id ON tenants(room_id);
CREATE INDEX idx_tenants_status ON tenants(status);

-- Lookup pembayaran per kamar dan periode
CREATE INDEX idx_payments_room_id ON payments(room_id);
CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_payments_periode ON payments(periode);
CREATE INDEX idx_payments_status ON payments(status);

-- Lookup konfirmasi pending per kamar
CREATE INDEX idx_confirmations_room_id ON confirmations(room_id);
CREATE INDEX idx_confirmations_status ON confirmations(status);

-- Lookup maintenance per kamar
CREATE INDEX idx_maintenances_room_id ON maintenances(room_id);
CREATE INDEX idx_maintenances_status ON maintenances(status);

-- Notifikasi unread
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_tipe ON notifications(tipe);
```

---

## 4. Database Constraints (DDL)

```sql
-- Nomor kamar unik dalam satu properti
UNIQUE (property_id, nomor_kamar);

-- Harga sewa harus positif
CHECK (harga_sewa > 0);

-- Nominal pembayaran harus positif
CHECK (nominal > 0);

-- Nominal DP harus positif
CHECK (nominal_dp > 0);

-- Durasi sewa harus positif
CHECK (durasi_sewa > 0);

-- Role hanya boleh nilai yang ditentukan
CHECK (role IN ('operator', 'manager', 'viewer'));

-- Status kamar hanya boleh nilai yang ditentukan
CHECK (status IN ('available', 'dp_confirmation', 'occupied'));
```

---

## 5. Transaction Specification

### Confirm DP

Dieksekusi sebagai **satu database transaction**. Seluruh langkah commit bersama atau rollback bersama apabila salah satu gagal.

```
BEGIN TRANSACTION

1. SELECT confirmation FOR UPDATE         -- lock baris konfirmasi
2. Validasi: confirmation.status = 'pending'
3. UPDATE confirmations SET status = 'confirmed', updated_by = $user_id
4. UPDATE rooms SET status = 'occupied'
5. INSERT INTO tenants (data penghuni baru)
6. INSERT INTO payments (periode pertama jika diperlukan)

COMMIT
-- Rollback otomatis apabila salah satu langkah gagal
```

### Checkout Tenant

```
BEGIN TRANSACTION

1. SELECT tenant FOR UPDATE
2. Validasi: tenant.status = 'active'
3. UPDATE tenants SET status = 'checked_out', tanggal_keluar = $tanggal_keluar
4. UPDATE rooms SET status = 'available'

COMMIT
```

### DP Expired (Background Worker)

```
BEGIN TRANSACTION

1. SELECT confirmation FOR UPDATE WHERE status = 'pending' AND batas_tanggal_konfirmasi < NOW()
2. UPDATE confirmations SET status = 'expired'
3. UPDATE rooms SET status = 'available'
4. INSERT INTO notifications (tipe = 'dp_expired', referensi_id = confirmation.id)

COMMIT
```

---

## 6. Domain Model Specification

### User

- Email harus unik.
- Password disimpan dalam bentuk hash (bcrypt).
- Role hanya boleh: `operator`, `manager`, `viewer`.
- Tidak ada soft delete pada tabel ini.

### Property

- `nama` wajib diisi.
- Properti tidak dapat dihapus apabila masih memiliki kamar (cek di service layer sebelum DELETE).

### Room

- Harus terhubung ke satu properti (`property_id` NOT NULL).
- `nomor_kamar` unik dalam satu properti (DB unique constraint).
- Hanya boleh memiliki satu tenant aktif (`status = 'active'`).
- Hanya boleh memiliki satu confirmation pending.
- State: `available` → `dp_confirmation` → `occupied` → `available`.

### Tenant

- Tenant baru hanya dapat dibuat pada room berstatus `available`.
- Histori tenant tidak boleh dihapus — gunakan `status = 'checked_out'`.
- Checkout wajib mengubah status kamar menjadi `available`.

### Payment

- `nominal` harus lebih besar dari nol.
- Histori pembayaran tidak boleh dihapus.
- Jatuh tempo dihitung berdasarkan `tanggal_masuk` tenant per bulan.

### Confirmation

- Satu room hanya boleh memiliki satu `pending` confirmation.
- `pending` dapat bertransisi menjadi `confirmed` (oleh Operator) atau `expired` (oleh background worker).
- `batas_tanggal_konfirmasi` harus berupa tanggal di masa depan saat pencatatan.

### Maintenance

- Histori maintenance tidak boleh dihapus.
- Status hanya boleh: `reported` → `in_progress` → `completed`.
- `tindakan_penanganan` dan `biaya` opsional saat pencatatan awal, diisi saat update progress.

---

## 7. Validation Matrix

### Create Property

| Field | Required | Rule |
|-------|----------|------|
| nama | Ya | Max 255 karakter |
| alamat | Ya | Max 500 karakter |
| deskripsi | Tidak | Max 1000 karakter |

### Create Room

| Field | Required | Rule |
|-------|----------|------|
| property_id | Ya | UUID valid, property harus ada |
| nomor_kamar | Ya | Max 50 karakter, unik dalam property |
| tipe_kamar | Ya | Max 100 karakter |
| harga_sewa | Ya | Numeric, > 0 |

### Create Tenant

| Field | Required | Rule |
|-------|----------|------|
| room_id | Ya | UUID valid, room harus berstatus `available` |
| nama | Ya | Max 255 karakter |
| nomor_identitas | Ya | Max 100 karakter |
| nomor_telepon | Ya | Max 30 karakter |
| tanggal_masuk | Ya | Format DATE valid, tidak boleh di masa depan jauh |
| durasi_sewa | Ya | Integer > 0 (dalam bulan) |

### Create Payment

| Field | Required | Rule |
|-------|----------|------|
| room_id | Ya | UUID valid, room harus ada |
| tenant_id | Ya | UUID valid, tenant harus aktif pada room tersebut |
| periode | Ya | Format `YYYY-MM` |
| nominal | Ya | Numeric > 0 |
| tanggal_bayar | Tidak | Format DATE valid |
| bukti_transfer | Tidak | jpg/jpeg/png/pdf, max 5 MB |

### Create Confirmation

| Field | Required | Rule |
|-------|----------|------|
| room_id | Ya | UUID valid, room harus berstatus `available` |
| nama_calon_penghuni | Ya | Max 255 karakter |
| nominal_dp | Ya | Numeric > 0 |
| batas_tanggal_konfirmasi | Ya | DATE valid, harus di masa depan |

### Create Maintenance

| Field | Required | Rule |
|-------|----------|------|
| room_id | Ya | UUID valid, room harus ada |
| tanggal_laporan | Ya | Format DATE valid |
| deskripsi_kerusakan | Ya | Tidak boleh kosong |
| tindakan_penanganan | Tidak | - |
| biaya | Tidak | Numeric ≥ 0 |

---

## 8. Audit Trail

Seluruh tabel operasional wajib menyimpan kolom audit:

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `created_by` | UUID (FK users) | Pengguna yang membuat rekaman |
| `updated_by` | UUID (FK users) | Pengguna atau proses yang terakhir mengubah |
| `created_at` | TIMESTAMPTZ | Waktu rekaman dibuat |
| `updated_at` | TIMESTAMPTZ | Waktu rekaman terakhir diubah |

Tabel yang menerapkan audit trail: `rooms`, `tenants`, `payments`, `confirmations`, `maintenances`.

Tabel `notifications` hanya menyimpan `created_at` karena merupakan rekaman event yang tidak diubah setelah dibuat.

**Kegunaan audit trail:**
- Investigasi perubahan data yang tidak diharapkan
- Histori aktivitas Operator (siapa yang mencatat apa dan kapan)
- Pelacakan kesalahan operasional
- Pembeda antara perubahan manual oleh Operator vs perubahan otomatis oleh background worker (background worker dapat menggunakan user_id khusus sistem)
