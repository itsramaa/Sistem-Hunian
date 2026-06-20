# SRS — REST API
# Sistem Informasi Manajemen Kos Multi-Properti Berbasis Web

**Versi:** 1.0 | Lihat `srs_overview.md` untuk konteks penuh.

---

## 1. Konvensi API

- Base URL: `/api/v1`
- Format request/response: `application/json`
- Seluruh endpoint (kecuali login) memerlukan header `Authorization: Bearer <jwt_token>`
- Timestamp menggunakan format ISO 8601 (RFC 3339): `2024-01-15T08:30:00Z`
- UUID digunakan sebagai primary key di seluruh entitas
- Pagination menggunakan query parameter `page` dan `limit`

### Format Response Sukses

```json
{
  "success": true,
  "data": { ... },
  "pagination": { ... }   // hanya pada endpoint list
}
```

### Format Response Error

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { ... }    // null atau object field-level errors
  }
}
```

---

## 2. Authorization Matrix

| Endpoint | Operator | Manajer | Viewer |
|----------|----------|---------|--------|
| `POST /auth/login` | ✓ | ✓ | ✓ |
| `GET /auth/me` | ✓ | ✓ | ✓ |
| `GET /dashboard/summary` | ✓ | ✓ | ✓ |
| `GET /dashboard/alerts` | ✓ | ✓ | ✗ |
| `GET/POST /properties` | ✓ | ✗ | ✗ |
| `PUT/DELETE /properties/{id}` | ✓ | ✗ | ✗ |
| `GET/POST /rooms` | ✓ | ✗ | ✗ |
| `PUT/DELETE /rooms/{id}` | ✓ | ✗ | ✗ |
| `GET/POST /tenants` | ✓ | ✗ | ✗ |
| `POST /tenants/{id}/checkout` | ✓ | ✗ | ✗ |
| `GET/POST /payments` | ✓ | ✗ | ✗ |
| `PATCH /payments/{id}/upload` | ✓ | ✗ | ✗ |
| `GET/POST /confirmations` | ✓ | ✗ | ✗ |
| `POST /confirmations/{id}/confirm` | ✓ | ✗ | ✗ |
| `GET /maintenances` | ✓ | ✓ | ✗ |
| `POST /maintenances` | ✓ | ✓ | ✗ |
| `PUT /maintenances/{id}` | ✓ | ✓ | ✗ |
| `GET /notifications` | ✓ | ✗ | ✗ |
| `PATCH /notifications/{id}/read` | ✓ | ✗ | ✗ |

---

## 3. Authentication

### POST `/api/v1/auth/login`

**Request**
```json
{
  "email": "operator@kos.com",
  "password": "secret"
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "nama": "Operator",
      "email": "operator@kos.com",
      "role": "operator"
    }
  }
}
```

**Error:** `401` — `AUTH_001`

---

### GET `/api/v1/auth/me`

**Response 200**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nama": "Operator",
    "email": "operator@kos.com",
    "role": "operator"
  }
}
```

---

## 4. Dashboard

### GET `/api/v1/dashboard/summary`

Diakses oleh semua role.

**Response 200**
```json
{
  "success": true,
  "data": {
    "total_properti": 3,
    "total_kamar": 42,
    "kamar_available": 15,
    "kamar_occupied": 20,
    "kamar_dp_confirmation": 7
  }
}
```

---

### GET `/api/v1/dashboard/alerts`

Diakses oleh Operator dan Manajer.

**Response 200**
```json
{
  "success": true,
  "data": {
    "dp_alerts": [
      {
        "confirmation_id": "uuid",
        "room_id": "uuid",
        "nomor_kamar": "A01",
        "nama_properti": "Kos A",
        "nama_calon_penghuni": "Budi",
        "batas_tanggal": "2024-01-20",
        "sisa_hari": 2,
        "tipe": "dp_reminder"
      }
    ],
    "payment_alerts": [
      {
        "room_id": "uuid",
        "nomor_kamar": "B05",
        "nama_properti": "Kos B",
        "nama_penghuni": "Sari",
        "periode": "2024-01",
        "tipe": "payment_overdue"
      }
    ]
  }
}
```

---

## 5. Property

### GET `/api/v1/properties`

**Query Parameters:** `page`, `limit`, `search`

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nama": "Kos Melati",
      "alamat": "Jl. MM2100 Blok A No. 1",
      "deskripsi": "Kos 3 lantai",
      "jumlah_kamar": 15,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 3 }
}
```

---

### POST `/api/v1/properties`

**Request**
```json
{
  "nama": "Kos Melati",
  "alamat": "Jl. MM2100 Blok A No. 1",
  "deskripsi": "Kos 3 lantai dekat pintu gerbang"
}
```

**Response 201** — data properti yang baru dibuat

**Error:** `400` — `VALIDATION_001`

---

### PUT `/api/v1/properties/{id}`

**Request** — sama dengan POST, semua field opsional (patch semantics)

**Response 200** — data properti setelah update

**Error:** `404` — `PROPERTY_001`

---

### DELETE `/api/v1/properties/{id}`

**Response 200**
```json
{ "success": true, "data": { "message": "Property deleted" } }
```

**Error:** `404` — `PROPERTY_001` | `422` — `PROPERTY_002` (masih punya kamar)

---

## 6. Room

### GET `/api/v1/rooms`

**Query Parameters:** `page`, `limit`, `search`, `property_id`, `status`

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "property_id": "uuid",
      "nama_properti": "Kos Melati",
      "nomor_kamar": "A01",
      "tipe_kamar": "Standar",
      "harga_sewa": 1200000,
      "status": "occupied",
      "penghuni_aktif": "Budi Santoso"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 42 }
}
```

---

### POST `/api/v1/rooms`

**Request**
```json
{
  "property_id": "uuid",
  "nomor_kamar": "A01",
  "tipe_kamar": "Standar",
  "harga_sewa": 1200000
}
```

**Response 201**

**Error:** `400` — `VALIDATION_001` | `422` — `ROOM_004` (nomor sudah ada)

---

### PUT `/api/v1/rooms/{id}`

**Request** — field yang ingin diubah (partial update)

**Response 200**

**Error:** `404` — `ROOM_001`

---

### DELETE `/api/v1/rooms/{id}`

**Response 200**

**Error:** `404` — `ROOM_001` | `422` — `ROOM_002` (terisi atau dp_confirmation)

---

## 7. Tenant

### GET `/api/v1/tenants`

**Query Parameters:** `page`, `limit`, `room_id`, `property_id`, `status` (`active`/`checked_out`)

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "room_id": "uuid",
      "nomor_kamar": "A01",
      "nama_properti": "Kos Melati",
      "nama": "Budi Santoso",
      "no_identitas": "3271...",
      "no_telepon": "0812...",
      "tanggal_masuk": "2024-01-01",
      "durasi_sewa": 6,
      "status": "active",
      "tanggal_keluar": null
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 35 }
}
```

---

### POST `/api/v1/tenants`

**Request**
```json
{
  "room_id": "uuid",
  "nama": "Budi Santoso",
  "no_identitas": "3271234567890001",
  "no_telepon": "081234567890",
  "tanggal_masuk": "2024-01-01",
  "durasi_sewa": 6
}
```

**Response 201**

**Error:** `400` — `VALIDATION_001` | `422` — `ROOM_002` (room tidak available)

---

### POST `/api/v1/tenants/{id}/checkout`

**Request**
```json
{ "tanggal_keluar": "2024-07-01" }
```

**Response 200**

**Error:** `404` — `TENANT_001` | `422` — `TENANT_002` (sudah checked_out)

---

## 8. Payment

### GET `/api/v1/payments`

**Query Parameters:** `page`, `limit`, `room_id`, `tenant_id`, `periode`, `status`, `property_id`

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "room_id": "uuid",
      "nomor_kamar": "A01",
      "tenant_id": "uuid",
      "nama_penghuni": "Budi Santoso",
      "periode": "2024-01",
      "nominal": 1200000,
      "tanggal_bayar": "2024-01-05",
      "status": "paid",
      "bukti_transfer_url": "/uploads/payments/abc123.jpg"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 100 }
}
```

---

### POST `/api/v1/payments`

**Request**
```json
{
  "room_id": "uuid",
  "tenant_id": "uuid",
  "periode": "2024-01",
  "nominal": 1200000,
  "tanggal_bayar": "2024-01-05"
}
```

**Response 201**

**Error:** `400` — `VALIDATION_001` | `422` — `PAYMENT_002` (periode sudah ada)

---

### PATCH `/api/v1/payments/{id}/upload`

**Request:** `multipart/form-data`, field `bukti_transfer` (file)

**Response 200**
```json
{
  "success": true,
  "data": { "bukti_transfer_url": "/uploads/payments/uuid.jpg" }
}
```

**Error:** `404` — `PAYMENT_001` | `422` — `PAYMENT_003` (format/ukuran tidak valid)

---

## 9. Confirmation

### GET `/api/v1/confirmations`

**Query Parameters:** `page`, `limit`, `room_id`, `property_id`, `status`

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "room_id": "uuid",
      "nomor_kamar": "B03",
      "nama_properti": "Kos Mawar",
      "nama_calon_penghuni": "Sari Dewi",
      "nominal_dp": 600000,
      "batas_tanggal_konfirmasi": "2024-01-20",
      "sisa_hari": 5,
      "status": "pending"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 7 }
}
```

---

### POST `/api/v1/confirmations`

**Request**
```json
{
  "room_id": "uuid",
  "nama_calon_penghuni": "Sari Dewi",
  "nominal_dp": 600000,
  "batas_tanggal_konfirmasi": "2024-01-20"
}
```

**Response 201**

**Error:** `422` — `ROOM_003` (sudah ada DP pending)

---

### POST `/api/v1/confirmations/{id}/confirm`

Mengkonfirmasi calon penghuni masuk. Atomik: update confirmation + update room + insert tenant.

**Request**
```json
{
  "nama": "Sari Dewi",
  "no_identitas": "3271234567890002",
  "no_telepon": "081298765432",
  "tanggal_masuk": "2024-01-22",
  "durasi_sewa": 3
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "confirmation_id": "uuid",
    "tenant_id": "uuid",
    "message": "Confirmation successful. Tenant created and room is now occupied."
  }
}
```

**Error:** `404` — `CONFIRMATION_001` | `422` — `CONFIRMATION_002` / `CONFIRMATION_003`

---

## 10. Maintenance

### GET `/api/v1/maintenances`

**Query Parameters:** `page`, `limit`, `room_id`, `property_id`, `status`

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "room_id": "uuid",
      "nomor_kamar": "A02",
      "nama_properti": "Kos Melati",
      "tanggal_laporan": "2024-01-10",
      "deskripsi_kerusakan": "Kebocoran atap lantai 2",
      "tindakan_penanganan": "Tambal dengan sealant",
      "biaya": 250000,
      "status": "completed"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 30 }
}
```

---

### POST `/api/v1/maintenances`

**Request**
```json
{
  "room_id": "uuid",
  "tanggal_laporan": "2024-01-10",
  "deskripsi_kerusakan": "Kebocoran atap lantai 2"
}
```

**Response 201** — status awal `reported`

---

### PUT `/api/v1/maintenances/{id}`

**Request**
```json
{
  "tindakan_penanganan": "Tambal dengan sealant waterproof",
  "biaya": 250000,
  "status": "completed"
}
```

**Response 200**

**Error:** `404` — `MAINTENANCE_001` | `422` — `MAINTENANCE_002` (status tidak valid)

---

## 11. Notification

### GET `/api/v1/notifications`

**Query Parameters:** `is_read` (boolean, optional), `tipe`

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tipe": "dp_expired",
      "referensi_id": "uuid",
      "pesan": "DP konfirmasi kamar B03 (Kos Mawar) atas nama Sari Dewi telah melewati batas tanggal konfirmasi.",
      "is_read": false,
      "created_at": "2024-01-21T00:00:00Z"
    }
  ]
}
```

---

### PATCH `/api/v1/notifications/{id}/read`

**Response 200**
```json
{ "success": true, "data": { "message": "Notification marked as read" } }
```
