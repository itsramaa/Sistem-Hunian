# API Specification - SiHuni (Sistem Manajemen Kosan)

## 1. Overview
Dokumen ini menjelaskan spesifikasi RESTful API untuk platform SiHuni. API ini dirancang untuk mendukung aplikasi web dan mobile (PWA) dengan fokus pada performa, keamanan, dan skalabilitas.

- **Base URL**: `https://api.sihuni.com/api/v1`
- **Content-Type**: `application/json` (kecuali upload file: `multipart/form-data`)
- **Date Format**: ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`)
- **Currency**: IDR (Indonesian Rupiah)

## 2. Authentication & Authorization
Menggunakan JWT (JSON Web Token) dengan strategi *Access Token* (masa berlaku pendek) dan *Refresh Token* (masa berlaku panjang).

### Roles (RBAC)
| Role Code | Description | Scope |
|-----------|-------------|-------|
| `SUPER_ADMIN` | Administrator Sistem | Akses penuh seluruh platform & manajemen tenant SaaS |
| `OWNER` | Pemilik Kos | Manajemen properti, keuangan, laporan, staf |
| `STAFF` | Penjaga Kos | Operasional harian, validasi pembayaran, keluhan |
| `TENANT` | Penyewa | Dashboard penyewa, pembayaran, ajukan keluhan |

### Security Headers
- `Authorization`: `Bearer <access_token>`
- `X-Device-ID`: Unique device identifier (untuk tracking login)

## 3. Standard Response & Error Handling

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "meta": {                 // Optional, for pagination
    "page": 1,
    "limit": 10,
    "total_items": 50,
    "total_pages": 5
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Property with ID 123 not found",
    "details": []           // Validation errors if any
  }
}
```

## 4. Endpoints

### 4.1. Authentication (Auth)

#### Login
- **POST** `/auth/login`
- **Body**: `{ "email": "user@example.com", "password": "..." }`
- **Response**: Access Token, Refresh Token, User Profile.

#### Register (Tenant Only)
- **POST** `/auth/register`
- **Body**: `{ "full_name": "...", "email": "...", "password": "...", "phone": "..." }`

#### Refresh Token
- **POST** `/auth/refresh-token`
- **Body**: `{ "refresh_token": "..." }`

#### Get Current User
- **GET** `/auth/me`

#### Logout
- **POST** `/auth/logout`

### 4.2. Property Management (Properti & Kamar)

#### List Properties (Kosan)
- **GET** `/properties`
- **Query Params**: `?owner_id=...&search=...&city=...`
- **Response**: List of properties with summary (total rooms, available rooms).

#### Get Property Details
- **GET** `/properties/{id}`
- **Response**: Detail kosan, fasilitas, rules, foto.

#### Create Property (Owner)
- **POST** `/properties`
- **Body**: Multipart form data (Details + Images).

#### Manage Room Types
- **GET** `/properties/{id}/room-types`
- **POST** `/properties/{id}/room-types`
- **PUT** `/room-types/{id}`

#### Manage Rooms (Unit Kamar)
- **GET** `/properties/{id}/rooms`
- **POST** `/properties/{id}/rooms`
- **Body**: `{ "room_number": "101", "floor": 1, "room_type_id": "...", "status": "AVAILABLE" }`

### 4.3. Tenant Management (Penyewa)

#### List Tenants
- **GET** `/tenants`
- **Query Params**: `?status=ACTIVE|ALUMNI&property_id=...`

#### Tenant Check-In (Onboarding)
- **POST** `/tenants/check-in`
- **Description**: Proses memasukkan penyewa baru ke kamar.
- **Body**:
  ```json
  {
    "user_id": "usr_...", // Jika user sudah ada
    "personal_info": { ... }, // Jika user baru
    "room_id": "rm_...",
    "start_date": "2023-10-01",
    "duration_months": 12,
    "deposit_amount": 500000,
    "rental_price": 1500000
  }
  ```

#### Tenant Check-Out
- **POST** `/tenants/{id}/check-out`
- **Body**: `{ "end_date": "...", "notes": "...", "deposit_refunded": true }`

### 4.4. Financial (Keuangan)

#### Create Invoice (Tagihan)
- **POST** `/invoices`
- **Description**: Generate tagihan sewa bulanan (bisa manual atau cron job system).

#### Upload Payment Proof (Bukti Transfer)
- **POST** `/invoices/{id}/payment-proof`
- **Body**: Multipart file (Image).
- **Trigger**: Otomatis memicu OCR processing di background.

#### Verify Payment (Staff/Owner)
- **POST** `/invoices/{id}/verify`
- **Body**: `{ "status": "PAID", "notes": "Verified manually" }`

#### Financial Report (Laporan)
- **GET** `/reports/financial`
- **Query Params**: `?start_date=...&end_date=...&type=REVENUE|EXPENSE|PROFIT`
- **Response**: Data agregat untuk grafik pendapatan bersih (Net Income).

### 4.5. Operations (Operasional)

#### Report Issue (Keluhan)
- **POST** `/complaints`
- **Body**: `{ "title": "AC Bocor", "description": "...", "category": "FACILITY", "photos": [...] }`

#### Update Complaint Status
- **PATCH** `/complaints/{id}/status`
- **Body**: `{ "status": "IN_PROGRESS|RESOLVED", "technician_notes": "..." }`

### 4.6. Smart Features (AI & OCR)

#### OCR KTP Extraction
- **POST** `/smart/ocr/ktp`
- **Body**: Multipart file (KTP Image).
- **Response**: Extracted NIK, Nama, Tanggal Lahir, Alamat.
- **Usage**: Digunakan saat form Check-In tenant untuk auto-fill.

#### OCR Payment Proof Analysis
- **POST** `/smart/ocr/payment`
- **Body**: Multipart file (Transfer Receipt).
- **Response**: Extracted Amount, Date, Sender Bank, Receiver Bank.
- **Usage**: Validasi otomatis nominal transfer.

#### Revenue Prediction (Forecasting)
- **GET** `/smart/analytics/revenue-forecast`
- **Description**: Menggunakan Linear Regression berdasarkan data historis 12 bulan terakhir.
- **Response**:
  ```json
  {
    "current_month_revenue": 15000000,
    "forecast_next_month": 15500000,
    "trend": "UP",
    "confidence_score": 0.85
  }
  ```

#### GenAI Assistant (Chatbot)
- **POST** `/smart/ai/chat`
- **Body**: `{ "message": "Bagaimana cara mengatasi penyewa yang telat bayar?", "context": "general" }`
- **Response**: `{ "reply": "Berdasarkan SOP, Anda dapat mengirimkan notifikasi peringatan..." }`

## 5. Data Models (Schema Definition)

### User
```typescript
interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'SUPER_ADMIN' | 'OWNER' | 'STAFF' | 'TENANT';
  phone_number: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
}
```

### Property (Kosan)
```typescript
interface Property {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  facilities: string[]; // ["WIFI", "AC", "PARKING"]
  images: string[];
  rules: string[];
  total_rooms: number;
}
```

### Room (Kamar)
```typescript
interface Room {
  id: string;
  property_id: string;
  room_number: string;
  floor: number;
  type: RoomType;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  current_tenant_id?: string;
  price_monthly: number;
}
```

### Invoice (Tagihan)
```typescript
interface Invoice {
  id: string;
  tenant_id: string;
  room_id: string;
  amount: number;
  due_date: string;
  status: 'UNPAID' | 'PENDING_VERIFICATION' | 'PAID' | 'OVERDUE';
  payment_proof_url?: string;
  payment_date?: string;
  items: InvoiceItem[];
}
```

## 6. Integrations
- **Payment Gateway**: Midtrans / Xendit (Webhook handling required at `/webhooks/payment`).
- **Notification Service**: Firebase Cloud Messaging (FCM) & WhatsApp API (Twilio/Wablas).
- **Storage**: AWS S3 / MinIO / Supabase Storage.
