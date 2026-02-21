# API Contract - SiHuni.com (B2B2C SaaS)

**Base URL:** `https://api.sihuni.com/v1`  
**Authentication:** Bearer Token (JWT)  
**Content-Type:** `application/json`  
**Payment Gateway:** Xendit (Sandbox mode untuk development)  
**AI Provider:** Google Gemini 1.5 Flash API

---

## 1. Authentication API

### 1.1 Register User (Role-specific)
**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "merchant@example.com",
  "phone": "+6281234567890",
  "password": "SecurePass123!",
  "full_name": "John Doe",
  "role": "merchant", // or "vendor" (tenant via invitation only)
  "business_name": "Kosan Sejahtera" // required for merchant/vendor
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid-v4",
    "email": "merchant@example.com",
    "role": "merchant",
    "trial_tier": "basic", // auto-assign trial based on default
    "trial_expires_at": "2026-01-05T00:00:00Z"
  },
  "message": "Registration successful. 14-day trial started."
}
```

---

### 1.2 Login
**Endpoint:** `POST /auth/login`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "jwt.token.here",
    "refresh_token": "refresh.token.here",
    "expires_in": 3600,
    "user": {
      "id": "uuid-v4",
      "email": "merchant@example.com",
      "full_name": "John Doe",
      "role": "merchant",
      "subscription": {
        "tier": "basic",
        "status": "trial",
        "trial_ends_at": "2026-01-05T00:00:00Z"
      }
    }
  }
}
```

---

## 2. Merchant Management API

### 2.1 Get Merchant Profile
**Endpoint:** `GET /merchants/me`  
**Auth Required:** Yes (Merchant)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "merchant-uuid",
    "user_id": "user-uuid",
    "business_name": "Kosan Sejahtera",
    "verification_status": "pending", // or "verified", "rejected"
    "subscription": {
      "tier": "basic",
      "status": "trial",
      "trial_ends_at": "2026-01-05",
      "max_properties": 5,
      "max_units": 100,
      "features": ["payment_auto", "chatbot_basic", "analytics_basic"]
    },
    "escrow_balance": 15450000,
    "pending_disbursement": 2300000,
    "referral_code": "KOSAN-SEJAHTERA-ABC123"
  }
}
```

---

### 2.2 Submit Verification Documents
**Endpoint:** `POST /merchants/verification`  
**Auth Required:** Yes (Merchant)

**Request Body:**
```json
{
  "ktp_number": "3201234567890001",
  "ktp_photo_url": "s3://bucket/ktp.jpg",
  "npwp_number": "12.345.678.9-012.000",
  "npwp_photo_url": "s3://bucket/npwp.jpg",
  "property_doc_url": "s3://bucket/property-cert.pdf"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "verification_id": "verif-uuid",
    "status": "pending",
    "message": "Documents submitted. Admin review within 1-2 business days."
  }
}
```

---

### 2.3 Admin: Approve/Reject Verification
**Endpoint:** `PATCH /admin/merchants/{merchant_id}/verification`  
**Auth Required:** Yes (Admin)

**Request Body:**
```json
{
  "action": "approve", // or "reject"
  "rejection_reason": "KTP photo not clear" // if reject
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "merchant_id": "merchant-uuid",
    "verification_status": "verified",
    "verified_at": "2025-12-23T10:00:00Z"
  }
}
```

---

## 3. Subscription Management API

### 3.1 Get Available Tiers
**Endpoint:** `GET /subscriptions/tiers`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tiers": [
      {
        "id": "tier-free",
        "name": "Free",
        "price_monthly": 0,
        "price_yearly": 0,
        "trial_days": 0,
        "max_properties": 1,
        "max_units": 5,
        "features": ["manual_payment", "basic_maintenance"]
      },
      {
        "id": "tier-basic",
        "name": "Basic",
        "price_monthly": 149000,
        "price_yearly": 1490000,
        "trial_days": 14,
        "max_properties": 5,
        "max_units": 100,
        "features": ["payment_auto", "escrow", "chatbot_basic", "analytics_basic", "vendor_access"]
      },
      {
        "id": "tier-pro",
        "name": "Pro",
        "price_monthly": 349000,
        "price_yearly": 3490000,
        "trial_days": 7,
        "max_properties": 15,
        "max_units": 500,
        "features": ["all_basic", "recurring_payment", "chatbot_advanced", "analytics_advanced", "custom_logo"]
      },
      {
        "id": "tier-enterprise",
        "name": "Enterprise",
        "price_monthly": 999000,
        "price_yearly": null,
        "trial_days": 3,
        "max_properties": null,
        "max_units": null,
        "features": ["all_pro", "white_label", "api_access", "dedicated_support"]
      }
    ]
  }
}
```

---

### 3.2 Subscribe to Tier (After Trial)
**Endpoint:** `POST /subscriptions/subscribe`  
**Auth Required:** Yes (Merchant)

**Request Body:**
```json
{
  "tier_id": "tier-basic",
  "billing_cycle": "monthly", // or "yearly"
  "payment_method": "xendit_invoice" // pay via Xendit
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "subscription_id": "sub-uuid",
    "tier": "basic",
    "amount": 149000,
    "billing_cycle": "monthly",
    "xendit_invoice_url": "https://invoice.xendit.co/...",
    "expires_at": "2026-01-07T23:59:59Z",
    "message": "Please complete payment to activate subscription"
  }
}
```

---

### 3.3 Webhook: Subscription Payment Callback (Xendit)
**Endpoint:** `POST /webhooks/xendit/subscription`  
**Auth Required:** No (Xendit signature verification)

**Request Body (from Xendit):**
```json
{
  "id": "xendit-invoice-123",
  "external_id": "sub-uuid",
  "status": "PAID",
  "amount": 149000,
  "paid_at": "2026-01-05T14:30:00Z"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Subscription activated"
}
```

---

## 4. Property & Unit Management API

### 4.1 Create Property
**Endpoint:** `POST /properties`  
**Auth Required:** Yes (Merchant)

**Request Body:**
```json
{
  "type": "kosan",
  "name": "Kosan Sejahtera Blok A",
  "description": "Kosan nyaman dekat kampus",
  "address": "Jl. Sudirman No. 123, Jakarta",
  "city": "Jakarta",
  "province": "DKI Jakarta",
  "postal_code": "12190",
  "latitude": -6.2088,
  "longitude": 106.8456,
  "photos": ["s3://bucket/photo1.jpg"],
  "facilities": ["wifi", "ac", "parking", "laundry"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "property-uuid",
    "name": "Kosan Sejahtera Blok A",
    "created_at": "2025-12-22T10:00:00Z"
  }
}
```

---

### 4.2 Add Unit to Property
**Endpoint:** `POST /properties/{property_id}/units`

**Request Body:**
```json
{
  "unit_number": "A101",
  "type": "1br",
  "size_sqm": 24,
  "floor": 1,
  "price_monthly": 1500000,
  "price_yearly": 16200000,
  "description": "Kamar luas dengan AC",
  "photos": ["s3://bucket/unit-photo.jpg"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "unit-uuid",
    "unit_number": "A101",
    "status": "available"
  }
}
```

---

## 5. Tenant Management API

### 5.1 Merchant: Generate Tenant Invitation
**Endpoint:** `POST /tenants/invitations`  
**Auth Required:** Yes (Merchant)

**Request Body:**
```json
{
  "email": "tenant@example.com", // optional
  "phone": "+6281234567890", // optional
  "unit_id": "unit-uuid" // pre-assign unit (optional)
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "invitation_token": "INV-ABC123XYZ",
    "invitation_link": "https://app.sihuni.com/tenant/register?token=INV-ABC123XYZ",
    "expires_at": "2026-01-05T00:00:00Z"
  }
}
```

---

### 5.2 Tenant: Register via Invitation
**Endpoint:** `POST /tenants/register`

**Request Body:**
```json
{
  "invitation_token": "INV-ABC123XYZ",
  "email": "tenant@example.com",
  "phone": "+6281234567890",
  "password": "SecurePass123!",
  "full_name": "Jane Doe",
  "ktp_number": "3201234567890002",
  "ktp_photo_url": "s3://bucket/ktp.jpg",
  "date_of_birth": "1995-05-15",
  "address": "Jl. Melati No. 45",
  "emergency_contact_name": "John Doe",
  "emergency_contact_phone": "+6281234567891"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "tenant_id": "tenant-uuid",
    "user_id": "user-uuid",
    "assigned_unit": "A101",
    "message": "Registration successful. Please sign digital contract."
  }
}
```

---

### 5.3 Merchant: Assign Tenant to Unit (Create Contract)
**Endpoint:** `POST /tenants/{tenant_id}/contracts`  
**Auth Required:** Yes (Merchant)

**Request Body:**
```json
{
  "unit_id": "unit-uuid",
  "start_date": "2026-01-01",
  "end_date": "2026-12-31",
  "monthly_rent": 1500000,
  "deposit": 1500000,
  "additional_fees": {
    "utility": 150000,
    "parking": 50000
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "contract_id": "contract-uuid",
    "contract_url": "https://esign.sihuni.com/contract/...",
    "status": "pending_signature",
    "message": "Contract created. Waiting for tenant signature."
  }
}
```

---

## 6. Escrow & Payment API

### 6.1 Tenant: Get Invoices
**Endpoint:** `GET /invoices?status=pending`  
**Auth Required:** Yes (Tenant)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "id": "invoice-uuid",
        "invoice_number": "INV-2026-001",
        "amount": 1700000,
        "due_date": "2026-01-05",
        "billing_period": "2026-01",
        "status": "pending",
        "line_items": [
          {"description": "Sewa Januari 2026", "amount": 1500000},
          {"description": "Utility", "amount": 150000},
          {"description": "Parking", "amount": 50000}
        ]
      }
    ]
  }
}
```

---

### 6.2 Tenant: Create Payment (Xendit)
**Endpoint:** `POST /payments/create`  
**Auth Required:** Yes (Tenant)

**Request Body:**
```json
{
  "invoice_id": "invoice-uuid", // for rent payment
  "payment_method": "va", // or "qris", "ewallet", "credit_card"
  "payment_channel": "BCA" // if VA
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "payment_id": "payment-uuid",
    "xendit_transaction_id": "xendit-12345",
    "payment_method": "va",
    "payment_channel": "BCA",
    "virtual_account_number": "1234567890123",
    "amount": 1700000,
    "status": "pending",
    "expired_at": "2026-01-05T23:59:59Z",
    "fee_breakdown": {
      "subtotal": 1700000,
      "platform_fee": 17000,
      "xendit_fee": 42500,
      "merchant_receives": 1640500
    }
  }
}
```

---

### 6.3 Webhook: Payment Success → Escrow
**Endpoint:** `POST /webhooks/xendit/payment`

**Request Body (from Xendit):**
```json
{
  "id": "xendit-12345",
  "external_id": "payment-uuid",
  "amount": 1700000,
  "status": "PAID",
  "paid_at": "2026-01-03T14:30:00Z"
}
```

**Backend Logic:**
```
1. Update payment status = "success"
2. Credit merchant escrow_account:
   - available_balance += 1640500 (after 3.5% fee)
3. Update invoice status = "paid"
4. Send notification ke merchant & tenant
5. Trigger auto-disbursement (if scheduled)
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment processed to escrow"
}
```

---

## 7. Disbursement API

### 7.1 Merchant: Get Escrow Balance
**Endpoint:** `GET /escrow/balance`  
**Auth Required:** Yes (Merchant/Vendor)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "escrow_account_id": "escrow-uuid",
    "available_balance": 15450000,
    "pending_balance": 2300000,
    "total_received": 45000000,
    "total_disbursed": 27250000,
    "disbursement_settings": {
      "schedule": "weekly", // daily, weekly, monthly, on_demand
      "bank_account": {
        "bank_name": "BCA",
        "account_number": "1234567890",
        "account_holder": "John Doe"
      }
    }
  }
}
```

---

### 7.2 Merchant: Set Disbursement Schedule
**Endpoint:** `POST /escrow/disbursement/settings`  
**Auth Required:** Yes (Merchant/Vendor)

**Request Body:**
```json
{
  "schedule": "weekly", // daily(0.25%), weekly(FREE), monthly(FREE)
  "bank_account_number": "1234567890",
  "bank_name": "BCA",
  "account_holder_name": "John Doe"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "schedule": "weekly",
    "next_disbursement_date": "2026-01-06T14:00:00Z",
    "fee_percentage": 0,
    "message": "Weekly disbursement activated (FREE)"
  }
}
```

---

### 7.3 Merchant: Request On-Demand Disbursement
**Endpoint:** `POST /escrow/disbursement/on-demand`  
**Auth Required:** Yes (Merchant/Vendor)

**Request Body:**
```json
{
  "amount": 5000000 // max: available_balance
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "disbursement_id": "disb-uuid",
    "amount": 5000000,
    "fee_amount": 25000,
    "fee_percentage": 0.5,
    "net_amount": 4975000,
    "status": "processing",
    "estimated_arrival": "2026-01-03T18:00:00Z",
    "xendit_disbursement_id": "xendit-disb-123"
  }
}
```

---

### 7.4 Webhook: Disbursement Completed (Xendit)
**Endpoint:** `POST /webhooks/xendit/disbursement`

**Request Body (from Xendit):**
```json
{
  "id": "xendit-disb-123",
  "external_id": "disb-uuid",
  "amount": 4975000,
  "status": "COMPLETED",
  "disbursement_description": "Weekly disbursement"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Disbursement completed"
}
```

---

## 8. Vendor Marketplace API

### 8.1 Vendor: Register
**Endpoint:** `POST /auth/register` (with role="vendor")

Same as merchant registration, but with vendor-specific fields.

---

### 8.2 Vendor: Submit Verification
**Endpoint:** `POST /vendors/verification`  
**Auth Required:** Yes (Vendor)

**Request Body:**
```json
{
  "ktp_number": "3201234567890003",
  "ktp_photo_url": "s3://bucket/ktp.jpg",
  "nib_siup_number": "1234567890",
  "nib_photo_url": "s3://bucket/nib.jpg",
  "business_photos": ["s3://bucket/shop1.jpg", "s3://bucket/shop2.jpg"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "verification_id": "verif-uuid",
    "status": "pending"
  }
}
```

---

### 8.3 Tenant: Browse Vendors
**Endpoint:** `GET /vendors?category=laundry&verified=true&sort=rating`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "vendors": [
      {
        "id": "vendor-uuid",
        "business_name": "Laundry Express",
        "category": "laundry",
        "rating": 4.8,
        "total_reviews": 120,
        "verification_status": "verified",
        "distance_km": 0.5,
        "photos": ["url1"],
        "price_range": "8000-15000/kg"
      }
    ]
  }
}
```

---

### 8.4 Vendor: Add Product/Service
**Endpoint:** `POST /vendors/products`  
**Auth Required:** Yes (Vendor)

**Request Body:**
```json
{
  "name": "Cuci Kering Setrika",
  "description": "Laundry express 24 jam",
  "category": "laundry",
  "price": 12000,
  "unit": "kg",
  "photos": ["s3://bucket/product.jpg"],
  "stock": null,
  "tags": ["express", "24jam"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "product_id": "product-uuid",
    "name": "Cuci Kering Setrika",
    "is_available": true
  }
}
```

---

### 8.5 Tenant: Place Order
**Endpoint:** `POST /orders`  
**Auth Required:** Yes (Tenant)

**Request Body:**
```json
{
  "product_id": "product-uuid",
  "quantity": 3,
  "notes": "Pakai pewangi lavender"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "order_id": "order-uuid",
    "order_number": "ORD-2026-0001",
    "product": "Cuci Kering Setrika",
    "vendor": "Laundry Express",
    "quantity": 3,
    "unit_price": 12000,
    "total_price": 36000,
    "payment_required": true,
    "xendit_payment_url": "https://checkout.xendit.co/..."
  }
}
```

---

### 8.6 Tenant: Pay for Order (Same flow as rent payment)
**Endpoint:** `POST /payments/create` (with order_id instead of invoice_id)

After payment success → Escrow → Vendor gets notified → Complete order → Disbursement

---

### 8.7 Vendor: Update Order Status
**Endpoint:** `PATCH /orders/{order_id}/status`  
**Auth Required:** Yes (Vendor)

**Request Body:**
```json
{
  "status": "completed", // confirmed, processing, completed, cancelled
  "notes": "Laundry sudah selesai, bisa diambil"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "order_id": "order-uuid",
    "status": "completed",
    "completed_at": "2026-01-03T16:00:00Z",
    "message": "Order completed. Waiting for tenant review."
  }
}
```

---

## 9. Referral System API

### 9.1 Get Referral Dashboard
**Endpoint:** `GET /referrals/dashboard`  
**Auth Required:** Yes (All roles)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "referral_code": "KOSAN-SEJAHTERA-ABC123",
    "referral_link": "https://app.sihuni.com/register?ref=ABC123",
    "total_referrals": 5,
    "completed_referrals": 3,
    "pending_referrals": 2,
    "total_earned": 250000, // credit/cashback
    "referrals": [
      {
        "referee_name": "Merchant B",
        "referee_type": "merchant",
        "status": "completed",
        "reward_amount": 100000,
        "registered_at": "2025-12-01",
        "completed_at": "2025-12-15"
      }
    ]
  }
}
```

---

### 9.2 Track Referral Progress
**Endpoint:** `GET /referrals/{referral_id}/progress`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "referral_id": "ref-uuid",
    "referee_name": "Merchant B",
    "milestones": [
      {"step": "registered", "completed": true, "completed_at": "2025-12-01"},
      {"step": "verified", "completed": true, "completed_at": "2025-12-03"},
      {"step": "subscribed", "completed": true, "completed_at": "2025-12-05"},
      {"step": "first_payment", "completed": true, "completed_at": "2025-12-05"},
      {"step": "3_months_retention", "completed": false, "progress": "1/3 months"}
    ],
    "reward_status": "issued",
    "reward_amount": 100000
  }
}
```

---

## 10. AI Chatbot API (Google Gemini)

### 10.1 Start Conversation
**Endpoint:** `POST /chatbot/conversations`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "initial_message": "Cara bayar sewa gimana?"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "conversation_id": "conv-uuid",
    "session_id": "session-123",
    "bot_response": {
      "message": "Halo! Untuk bayar sewa, kamu bisa:\n1. Klik menu Payment\n2. Pilih invoice yang belum dibayar\n3. Pilih metode pembayaran (VA/QRIS/E-Wallet)\n4. Selesaikan pembayaran\n\nApakah kamu butuh bantuan langkah-langkah detail?",
      "intent": "payment_inquiry",
      "confidence": 0.95,
      "suggested_actions": [
        {"label": "Lihat Tagihan Saya", "action": "view_invoices"},
        {"label": "Tutorial Lengkap", "action": "show_tutorial"}
      ]
    }
  }
}
```

---

### 10.2 Send Message (Continue Conversation)
**Endpoint:** `POST /chatbot/conversations/{conversation_id}/messages`

**Request Body:**
```json
{
  "message": "Cari laundry terdekat yang bagus dong"
}
```

**Backend Logic (Gemini Integration):**
```javascript
// 1. Get user context (property location, past orders)
const context = await getUserContext(user_id);

// 2. Call Gemini API
const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-goog-api-key': process.env.GEMINI_API_KEY
  },
  body: JSON.stringify({
    contents: [{
      parts: [{
        text: `Context: User is tenant at property ${context.property_name} located at ${context.address}.
        
User query: "Cari laundry terdekat yang bagus dong"

Instructions:
- Recommend top 3 laundry vendors within 2km radius
- Sort by rating (min 4.0)
- Include price range, distance, and key features

Available vendors data:
${JSON.stringify(context.nearby_vendors)}

Response format:
{
  "intent": "vendor_recommendation",
  "recommendations": [
    {"vendor_id": "...", "name": "...", "rating": 4.8, "distance_km": 0.5, "price_range": "8k-15k/kg"}
  ],
  "message": "Friendly response in Bahasa Indonesia"
}`
      }]
    }]
  })
});

// 3. Parse Gemini response and return to user
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message_id": "msg-uuid",
    "bot_response": {
      "message": "Oke, saya rekomendasikan 3 laundry terdekat dengan rating tinggi:",
      "intent": "vendor_recommendation",
      "confidence": 0.92,
      "recommendations": [
        {
          "vendor_id": "vendor-uuid-1",
          "vendor_name": "Laundry Express",
          "rating": 4.8,
          "distance_km": 0.5,
          "price_range": "8k-12k/kg",
          "features": ["24 jam", "Express 3 jam"]
        },
        {
          "vendor_id": "vendor-uuid-2",
          "vendor_name": "Clean & Fresh",
          "rating": 4.7,
          "distance_km": 0.8,
          "price_range": "10k-15k/kg",
          "features": ["Eco-friendly", "Gratis antar jemput"]
        }
      ],
      "suggested_actions": [
        {"label": "Lihat Detail Laundry Express", "action": "view_vendor", "vendor_id": "vendor-uuid-1"},
        {"label": "Pesan Sekarang", "action": "create_order", "vendor_id": "vendor-uuid-1"}
      ]
    }
  }
}
```

---

## 11. Community Forum API

### 11.1 Create Post
**Endpoint:** `POST /forum/posts`  
**Auth Required:** Yes (Tenant)

**Request Body:**
```json
{
  "forum_type": "global", // or "property" for private forum
  "property_id": null, // required if forum_type="property"
  "title": "Rekomendasi tempat makan enak",
  "content": "Ada yang tau tempat makan enak di sekitar sini?",
  "photos": ["s3://bucket/photo.jpg"],
  "tags": ["food", "recommendation"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "post_id": "post-uuid",
    "forum_type": "global",
    "created_at": "2025-12-22T13:00:00Z"
  }
}
```

---

### 11.2 Get Forum Feed
**Endpoint:** `GET /forum/posts?forum_type=global&sort=latest&page=1`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "post-uuid",
        "tenant_name": "Jane Doe",
        "tenant_avatar": "https://...",
        "forum_type": "global",
        "title": "Rekomendasi tempat makan enak",
        "content": "Ada yang tau tempat makan enak di sekitar sini?",
        "photos": ["url1"],
        "tags": ["food", "recommendation"],
        "views_count": 42,
        "likes_count": 5,
        "comments_count": 3,
        "is_pinned": false,
        "created_at": "2025-12-22T13:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 120
    }
  }
}
```

---

### 11.3 Comment on Post
**Endpoint:** `POST /forum/posts/{post_id}/comments`  
**Auth Required:** Yes (Tenant)

**Request Body:**
```json
{
  "content": "Coba ke Warung Makan Bu Siti, enak dan murah!",
  "parent_comment_id": null
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "comment_id": "comment-uuid",
    "created_at": "2025-12-22T13:30:00Z"
  }
}
```

---

### 11.4 Report Post/Comment
**Endpoint:** `POST /forum/reports`  
**Auth Required:** Yes (Tenant)

**Request Body:**
```json
{
  "post_id": "post-uuid",
  "reason": "spam",
  "description": "Promosi produk berlebihan"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Report submitted. Admin will review within 24 hours."
}
```

---

## 12. Analytics & Reports API

### 12.1 Merchant: Dashboard Summary
**Endpoint:** `GET /analytics/merchant/dashboard`  
**Auth Required:** Yes (Merchant)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "period": "current_month",
    "summary": {
      "total_properties": 3,
      "total_units": 45,
      "occupied_units": 42,
      "occupancy_rate": 93.3,
      "total_revenue": 63000000,
      "avg_revenue_per_unit": 1500000,
      "pending_invoices": 3,
      "overdue_invoices": 1
    },
    "trends": {
      "occupancy_rate_change": 2.5,
      "revenue_change": 5.2,
      "payment_on_time_rate": 95.2
    },
    "escrow": {
      "available_balance": 15450000,
      "pending_balance": 2300000,
      "next_disbursement_date": "2026-01-06T14:00:00Z"
    }
  }
}
```

---

### 12.2 Merchant: Revenue Report
**Endpoint:** `GET /analytics/merchant/revenue?start_date=2025-01-01&end_date=2025-12-31`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total_revenue": 756000000,
    "breakdown_by_property": [
      {
        "property_id": "property-1",
        "property_name": "Kosan Sejahtera A",
        "revenue": 360000000,
        "units": 20,
        "avg_per_unit": 1500000
      }
    ],
    "breakdown_by_month": [
      {
        "month": "2025-01",
        "revenue": 63000000,
        "paid_invoices": 42,
        "occupancy_rate": 93.3
      }
    ],
    "payment_performance": {
      "on_time": 92.5,
      "late_1_7_days": 5.0,
      "late_7_plus_days": 2.5
    }
  }
}
```

---

### 12.3 Vendor: Sales Analytics
**Endpoint:** `GET /analytics/vendor/sales?period=last_30_days`  
**Auth Required:** Yes (Vendor)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "period": "last_30_days",
    "summary": {
      "total_orders": 150,
      "completed_orders": 142,
      "completion_rate": 94.7,
      "total_revenue": 7500000,
      "avg_order_value": 50000,
      "avg_rating": 4.7
    },
    "top_products": [
      {
        "product_id": "product-1",
        "product_name": "Cuci Kering Setrika",
        "total_sold": 450,
        "revenue": 5400000,
        "avg_rating": 4.8
      }
    ],
    "customer_insights": {
      "new_customers": 25,
      "repeat_customers": 35,
      "repeat_rate": 58.3
    }
  }
}
```

---

### 12.4 Admin: Platform Analytics
**Endpoint:** `GET /analytics/admin/platform?period=last_30_days`  
**Auth Required:** Yes (Admin)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "period": "last_30_days",
    "revenue": {
      "subscription": 36000000,
      "transaction_fees_rent": 15000000,
      "transaction_fees_vendor": 4500000,
      "disbursement_fees": 2250000,
      "total": 57750000
    },
    "gmv": {
      "rent": 1500000000,
      "vendor_orders": 150000000,
      "total": 1650000000
    },
    "users": {
      "merchants": {
        "total": 100,
        "paying": 75,
        "trial": 15,
        "free": 10,
        "churn_rate": 3.5
      },
      "tenants": {
        "total": 1200,
        "active": 1050,
        "mau": 980
      },
      "vendors": {
        "total": 50,
        "verified": 35,
        "active": 42
      }
    },
    "transactions": {
      "rent_payments": 1000,
      "rent_success_rate": 96.5,
      "vendor_orders": 800,
      "vendor_completion_rate": 92.0,
      "disbursements": 120,
      "disbursement_success_rate": 99.2
    },
    "escrow": {
      "total_balance": 385000000,
      "pending_disbursements": 45000000
    }
  }
}
```

---

## 13. Notification API

### 13.1 Get Notifications
**Endpoint:** `GET /notifications?unread=true&page=1`  
**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif-uuid",
        "type": "payment",
        "title": "Payment Received",
        "message": "Tenant Jane Doe paid Rp 1,500,000 for January rent",
        "data": {
          "payment_id": "payment-uuid",
          "amount": 1500000
        },
        "is_read": false,
        "created_at": "2025-12-22T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total_unread": 5
    }
  }
}
```

---

### 13.2 Mark as Read
**Endpoint:** `PATCH /notifications/{notification_id}/read`

**Response (200):**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### 13.3 Get Notification Preferences
**Endpoint:** `GET /notifications/preferences`  
**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": {
    "channels": {
      "email": true,
      "whatsapp": true,
      "push": true
    },
    "types": {
      "payment": true,
      "maintenance": true,
      "order": true,
      "promo": false,
      "community": true,
      "referral": true
    }
  }
}
```

---

### 13.4 Update Preferences
**Endpoint:** `PUT /notifications/preferences`

**Request Body:**
```json
{
  "channels": {
    "email": true,
    "whatsapp": false,
    "push": true
  },
  "types": {
    "promo": false,
    "community": false
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Notification preferences updated"
}
```

---

## 14. Search API

### 14.1 Global Search (Elasticsearch)
**Endpoint:** `GET /search?q=laundry&type=vendor&page=1`  
**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "type": "vendor",
        "id": "vendor-uuid",
        "business_name": "Laundry Express",
        "category": "laundry",
        "rating": 4.8,
        "distance_km": 0.5,
        "highlight": "<mark>Laundry</mark> express 24 jam"
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 15
    }
  }
}
```

---

## 15. File Upload API

### 15.1 Generate Presigned URL (S3)
**Endpoint:** `POST /uploads/presigned-url`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "file_type": "image/jpeg",
  "file_name": "ktp.jpg",
  "upload_type": "ktp"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "upload_url": "https://s3.amazonaws.com/...",
    "file_url": "https://cdn.sihuni.com/uploads/ktp-uuid.jpg",
    "expires_in": 3600
  }
}
```

---

## 16. Admin Specific API

### 16.1 System Health Check
**Endpoint:** `GET /admin/health`  
**Auth Required:** Yes (Admin)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "services": {
      "api": "up",
      "database": "up",
      "redis": "up",
      "queue": "up",
      "xendit": "up",
      "gemini": "up"
    },
    "metrics": {
      "api_response_time_p95": 250,
      "db_connections": 45,
      "queue_jobs_pending": 12,
      "redis_memory_usage_mb": 256
    }
  }
}
```

---

### 16.2 Manual Reconciliation
**Endpoint:** `POST /admin/escrow/reconcile`  
**Auth Required:** Yes (Admin)

**Request Body:**
```json
{
  "start_date": "2025-12-01",
  "end_date": "2025-12-31"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "reconciliation_id": "recon-uuid",
    "total_transactions": 1500,
    "total_amount": 1500000000,
    "discrepancies": [
      {
        "transaction_id": "tx-123",
        "issue": "Xendit callback not received",
        "action": "Manual sync required"
      }
    ],
    "status": "completed"
  }
}
```

---

## 17. Error Response Format

All API errors follow this format:

**Example Error (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

**Common Error Codes:**
- `INVALID_INPUT` (400): Validation error
- `UNAUTHORIZED` (401): Missing/invalid token
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `CONFLICT` (409): Duplicate resource
- `RATE_LIMIT` (429): Too many requests
- `SERVER_ERROR` (500): Internal server error
- `SERVICE_UNAVAILABLE` (503): External service down

---

## 18. Rate Limiting

**Standard Limits:**
- Anonymous: 10 req/minute
- Free tier: 60 req/minute
- Basic: 120 req/minute
- Pro: 300 req/minute
- Enterprise: 1000 req/minute

**Endpoints with Special Limits:**
- `/chatbot/*`: Based on subscription tier quota
- `/uploads/*`: 10 uploads/minute (all tiers)
- `/webhooks/*`: No limit (Xendit callbacks)

**Rate Limit Headers:**
```
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1703260800
```

---

## 19. Webhook Signature Verification

All Xendit webhooks must be verified:

```javascript
const crypto = require('crypto');

function verifyXenditSignature(payload, signature, webhookToken) {
  const hash = crypto
    .createHmac('sha256', webhookToken)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return hash === signature;
}

// Usage in webhook endpoint
app.post('/webhooks/xendit/payment', (req, res) => {
  const signature = req.headers['x-callback-token'];
  
  if (!verifyXenditSignature(req.body, signature, process.env.XENDIT_WEBHOOK_TOKEN)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook...
});
```

---

## 20. API Versioning Strategy

**Current Version:** v1  
**Base URL:** `https://api.sihuni.com/v1`

**Versioning Rules:**
- Breaking changes require new version (v2, v3, etc.)
- Non-breaking changes (new fields, endpoints) added to current version
- Old versions supported for 12 months after deprecation notice
- Deprecation announced via:
  - API changelog
  - Email to all merchants
  - Dashboard banner
  - Response header: `X-API-Deprecation: v1 will be deprecated on 2027-01-01`

---

## Appendix A: Xendit Integration Checklist

✅ **Setup:**
- [ ] Create Xendit account (sandbox)
- [ ] Get API keys (secret key, webhook token)
- [ ] Configure webhooks (payment, disbursement)
- [ ] Test payment methods (VA, QRIS, E-Wallet, CC)
- [ ] Test disbursement flow
- [ ] Test failure scenarios

✅ **Production:**
- [ ] Switch to production keys
- [ ] Configure IP whitelist
- [ ] Set up monitoring (callback failures)
- [ ] Test reconciliation process
- [ ] Document incident response

---

## Appendix B: Gemini API Integration

**Initialization:**
```javascript
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function getChatbotResponse(userMessage, context) {
  const prompt = `
Context: ${JSON.stringify(context)}

User query: "${userMessage}"

Instructions:
- Respond in friendly Bahasa Indonesia
- If vendor recommendation: return top 3 with rating >4.0
- If FAQ: give clear answer + relevant links
- If uncertain: ask clarification

Response format:
{
  "intent": "vendor_recommendation|faq|data_query|unknown",
  "confidence": 0.0-1.0,
  "message": "User-facing response",
  "data": {...}
}
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  return JSON.parse(text);
}
```

**Cost Optimization:**
- Cache frequent queries (Redis, TTL 1 hour)
- Rate limit per user (tier-based)
- Fallback to pre-defined responses for low confidence
- Monitor token usage (alert at 80% monthly quota)

---

**Document Version:** 2.0  
**Last Updated:** December 22, 2025  
**Next Review:** After MVP Launch (Q2 2026)