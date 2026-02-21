# Product Requirements Document (PRD)
## Sistem Pendukung Keputusan (DSS) Manajemen Kosan Terintegrasi OCR dan Machine Learning

**Versi:** 2.0 | **Status:** Professional Draft | **Tanggal:** 21 Februari 2026  
**Scope Pilot:** 20 Kosan | **Timeline:** 6 Bulan | **Target Users:** 5-10 Active Users

---

## EXECUTIVE SUMMARY

Sistem DSS Manajemen Kosan adalah platform B2B berbasis cloud yang mengotomatisasi dan mengoptimalkan operasional properti kosan melalui digitalisasi dokumen (OCR), analitik prediktif (ML), dan decision support berbasis AI. Sistem ini dirancang untuk meningkatkan revenue per-unit sebesar **8-15%** dan mengurangi risiko tunggakan pembayaran sebesar **20-30%** melalui data-driven insights.

### Target Business Outcomes
| Metrik | Target | Timeline |
|--------|--------|----------|
| Revenue Optimization | +8-15% | Month 6 |
| Payment Default Risk Reduction | -20-30% | Month 4 |
| OCR Processing Time | <2 min/dokumen | Month 3 |
| ML Prediction Accuracy | MAPE <10% | Month 4 |
| User Adoption Rate | >80% | Month 5 |

---

## 1. PRODUCT VISION & CONTEXT

### 1.1 Problem Statement

**Masalah Operasional yang Dihadapi:**

1. **Dokumentasi Manual & Data Fragmentation**
   - **Current State:** Data penyewa tersimpan dalam dokumen kertas (KTP, kontrak, kuitansi)
   - **Impact:** Waktu pencarian dokumen rata-rata 15-30 menit per transaksi; hilang/rusak ~5% dokumen per tahun
   - **Cost:** Estimasi Rp 2-5 juta/tahun per kosan untuk administrative overhead

2. **Pricing Strategy Tidak Optimal**
   - **Current State:** Harga sewa ditetapkan intuitif berdasarkan harga kompetitor lokal
   - **Gap:** 40% pengelola tidak mempertimbangkan biaya operasional aktual dalam penetapan harga
   - **Opportunity:** Revenue gap 8-15% jika pricing berbasis data

3. **Prediksi Hunian Lemah**
   - **Current State:** Manajemen kapasitas bergantung pada pengalaman subjektif
   - **Pain Point:** Kosong bertubi-tubi (seasonal low) tidak terduga; overpricing di low-demand period
   - **Data Gap:** Tidak ada historical data hunian untuk trend analysis

4. **Risk Assessment Informal**
   - **Current State:** Seleksi penyewa hanya berdasarkan wawancara dan referral
   - **Risk:** Tunggakan pembayaran 15-25% per bulan; damage claim tidak terdokumentasi
   - **Need:** Scoring system berbasis data untuk meminimalkan default risk

### 1.2 Proposed Solution

Platform web terintegrasi yang menghubungkan tiga pilar utama:

```
┌─────────────────────────────────────────────────────────────┐
│         Sistem DSS Manajemen Kosan (Web Platform)          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│  │   OCR    │    │    ML    │    │ Decision │             │
│  │ Module   │───→│ Analytics│───→│ Support  │             │
│  │ (Layer 1)│    │(Layer 2) │    │(Layer 3) │             │
│  └──────────┘    └──────────┘    └──────────┘             │
│       ↓                ↓                ↓                   │
│   Document        Prediction         Dashboard &            │
│   Processing      Engine             Reporting              │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │         Database Layer (PostgreSQL)                  │ │
│  │  ├─ Tenants | ├─ Properties | ├─ Transactions       │ │
│  │  ├─ Documents| ├─ Predictions| ├─ ML Models         │ │
│  │  └─ Audit Log│                                       │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. STAKEHOLDER ANALYSIS

### 2.1 Stakeholder Map

| Stakeholder | Role | Needs | Impact |
|-------------|------|-------|--------|
| **Pemilik Kosan** | Decision Maker | Revenue optimization, risk visibility | High |
| **Pengelola Kosan** | Primary User | Daily operational efficiency, quick reports | High |
| **Surveyor/Enumerator** | Data Collector | Easy data entry, photo/document upload | Medium |
| **Finance Team** | Data Analyst | Payment tracking, financial reports | Medium |
| **Calon Penyewa** | External User | Room availability, payment terms | Low |
| **IT Support** | Technical Maintainer | System uptime, security | High |

### 2.2 User Personas

**Persona 1: Hendra, 45 - Pemilik Kosan Pengalaman (10 tahun)**
- Pain Point: Tidak tahu harga optimal; sering sepi musiman
- Goal: Maksimalkan ROI dengan minimal effort
- Tech Proficiency: Sedang (bisa email, WhatsApp)
- Usage Pattern: 15-30 menit/hari untuk monitoring

**Persona 2: Siti, 28 - Pengelola Kosan Full-time**
- Pain Point: Dokumen berantakan; sulit track pembayaran tertunda
- Goal: Operasi lancar, laporan cepat ke owner
- Tech Proficiency: Tinggi (smartphone-native)
- Usage Pattern: 2-3 jam/hari untuk admin tasks

**Persona 3: Budi, 35 - Surveyor/Enumerator**
- Pain Point: Keributan di lapangan saat input data manual
- Goal: Input data cepat, akurat, minimal error
- Tech Proficiency: Sedang
- Usage Pattern: 4-5 jam/hari saat pengumpulan data

---

## 3. REQUIREMENTS SPECIFICATION

### 3.1 Functional Requirements (FR)

#### FR-1: MODUL DIGITALISASI DOKUMEN (OCR)

**FR-1.1: Document Upload & Storage**
- **Requirement:** Sistem harus mendukung upload dokumen dalam format JPG, PNG, PDF dengan ukuran maksimal 10 MB
- **Acceptance Criteria:**
  - File upload berhasil dalam <5 detik (over 4G connection)
  - File tersimpan di cloud storage terenkripsi (AWS S3 encrypted)
  - Timestamp upload dan user ID tercatat di audit log
  - Error handling: Reject file >10 MB dengan pesan jelas

**FR-1.2: Document Classification**
- **Requirement:** Sistem secara otomatis mengklasifikasi dokumen (KTP, Kontrak, Kuitansi, Surat Kuasa) sebelum OCR
- **Acceptance Criteria:**
  - Akurasi klasifikasi ≥ 95%
  - Processing time <1 detik per dokumen
  - Manual reclassification option tersedia jika confidence <80%

**FR-1.3: Text Extraction (OCR Engine)**
- **Requirement:** Ekstrak teks dari dokumen menggunakan Tesseract OCR v5.0+
- **Acceptance Criteria:**
  - Character accuracy >85% untuk dokumen cetak berkualitas baik
  - Output format: JSON dengan confidence score per field
  - Field extracted: Nama, Nomor Identitas, Nominal, Tanggal, Durasi, Periode Pembayaran
  - Confidence threshold: Automatic accept jika confidence >80%; require manual review jika <80%

**FR-1.4: Data Validation & Entity Extraction**
- **Requirement:** Validasi ekstrak data menggunakan NLP-based entity recognition dan regex patterns
- **Acceptance Criteria:**
  - Validasi format (e.g., nomor KTP 16 digit, tanggal format DD/MM/YYYY)
  - Cross-check nominal pembayaran dengan range historis (flagging outliers)
  - Extract structured data: `{nama, nik, nominal, tanggal_mulai, tanggal_akhir, tipe_dokumen}`
  - Flag inconsistencies untuk manual review
- **Example Output:**
  ```json
  {
    "document_id": "doc_20260221_001",
    "document_type": "contract",
    "confidence": 0.92,
    "extracted_data": {
      "tenant_name": "Ahmad Rizki",
      "tenant_id": "3271234567891234",
      "room_number": "102",
      "rent_amount": 1500000,
      "start_date": "2026-02-01",
      "end_date": "2026-04-30",
      "currency": "IDR"
    },
    "validation_status": "approved",
    "requires_review": false,
    "ocr_confidence_score": 0.92,
    "processing_time_ms": 1847
  }
  ```

**FR-1.5: Manual Review & Correction Interface**
- **Requirement:** User interface untuk review & koreksi manual ekstrak data yang confidence <80%
- **Acceptance Criteria:**
  - Tampil highlight field dengan confidence score rendah
  - Allow in-line edit dengan validation
  - Save correction history untuk ML model retraining
  - Bulk operation: Approve/Reject multiple documents sekaligus

---

#### FR-2: MODUL MACHINE LEARNING ANALYTICS

**FR-2.1: Price Optimization Model**

**Requirement:** Prediksi harga sewa optimal berdasarkan atribut properti dan market conditions

**Inputs:**
```
Property Features:
├─ Room Size (m²)
├─ Furnishing Level (Unfurnished=1, Semi=2, Furnished=3)
├─ Amenities (WiFi, AC, Water Tank, etc.)
├─ Floor Level (Ground=1, Mid=2, Top=3)
├─ Proximity to Campus (meter)
├─ Proximity to Transit (meter)
├─ Age of Building (years)

Market Context:
├─ Location Cluster (Downtown/Suburban/Campus Area)
├─ Competitor Avg Price (last 30 days)
├─ Occupancy Rate (historical avg)
├─ Seasonality Factor (month of year)
├─ Competition Density (competing kosans within 1km)
```

**Algorithm:** Random Forest Regression + Gradient Boosting

**Acceptance Criteria:**
- Mean Absolute Percentage Error (MAPE) < 10%
- Mean Absolute Error (MAE) < Rp 150,000
- Model stability: Retraining monthly dengan data baru tanpa performance degradation >5%
- Prediction confidence interval: 95% CI output untuk setiap rekomendasi
- Bias check: No systematic bias per location cluster

**Output Format:**
```json
{
  "prediction_id": "pred_20260221_room102",
  "room_id": "room_102",
  "recommended_price": 1750000,
  "price_range": {
    "minimum": 1550000,
    "maximum": 1950000,
    "confidence_interval_95": [1650000, 1850000]
  },
  "pricing_factors": {
    "room_size_impact": "+10%",
    "location_premium": "+15%",
    "competitor_pressure": "-5%",
    "seasonality_adjustment": "+8%"
  },
  "model_confidence": 0.87,
  "current_price": 1500000,
  "price_change_recommended": "+16.7%",
  "recommendation_validity_days": 30,
  "generated_date": "2026-02-21T14:30:00Z"
}
```

**FR-2.2: Occupancy Prediction Model**

**Requirement:** Prediksi persentase hunian untuk bulan mendatang

**Inputs:**
```
Historical Data (24 bulan minimum):
├─ Monthly occupancy rate (%)
├─ Check-in/Check-out dates
├─ Marketing spend (if tracked)
├─ Room characteristics
├─ Seasonal patterns

External Factors:
├─ Academic calendar (if near campus)
├─ Weather/Climate data
├─ Local events/holidays
├─ Competitor occupancy (if available)
```

**Algorithm:** ARIMA + Seasonal Decomposition, XGBoost

**Acceptance Criteria:**
- MAPE < 15% untuk prediksi 1 bulan ke depan
- MAPE < 20% untuk prediksi 2-3 bulan ke depan
- Capture seasonal trends dengan akurasi >80%
- Output confidence interval dan trend direction (up/down/stable)

**Output Format:**
```json
{
  "prediction_id": "occ_20260221_kosan001",
  "property_id": "kosan_001",
  "forecast_month": "2026-03",
  "predicted_occupancy_rate": 0.78,
  "confidence_interval_95": [0.72, 0.84],
  "trend": "increasing",
  "trend_strength": "moderate",
  "seasonal_factor": 1.05,
  "historical_avg": 0.74,
  "expected_rooms_empty": 2,
  "risk_assessment": {
    "low_occupancy_probability": 0.12,
    "threshold_80pct": true
  },
  "recommendation": "Maintain current marketing efforts; slight price increase possible",
  "model_accuracy_mape": 0.14
}
```

**FR-2.3: Tenant Scoring & Risk Assessment**

**Requirement:** Generate skor risiko (0-100) untuk calon penyewa & tenant existing

**Scoring Components:**

| Component | Weight | Data Source | Calculation |
|-----------|--------|-------------|-------------|
| Payment History | 35% | Transaction records | % on-time / total payments |
| Tenure Stability | 25% | Contract history | Avg stay duration; early termination count |
| Documentation Quality | 15% | Document verification | KTP valid; No conflicting info |
| Complaint Record | 15% | Landlord notes | Weighted complaint count |
| Financial Capacity | 10% | Income verification* | Monthly rent / claimed income ratio |

*Optional field with consent

**Scoring Formula:**
```
Risk Score = 100 - (
  0.35 × (on_time_payment_pct × 100) +
  0.25 × (min(tenure_months / 36, 1) × 100) +
  0.15 × (doc_quality_score × 100) +
  0.15 × (max(0, 100 - complaint_weighted_count × 5)) +
  0.10 × (min(monthly_rent / monthly_income, 0.5) × 100)
)

Interpretation:
- Score 0-25: LOW RISK (GREEN) → Approve readily
- Score 25-50: MODERATE RISK (YELLOW) → Approve with deposit guarantee
- Score 50-75: HIGH RISK (ORANGE) → Require co-signer or higher deposit
- Score 75-100: CRITICAL RISK (RED) → Recommend rejection or trial period
```

**Acceptance Criteria:**
- Scoring consistency: Same historical data should produce same score (deterministic)
- Fairness audit: No systematic bias per demographic segment
- Historical backtesting: Score <40 should have <5% default rate; Score >75 should have >50% default rate
- Interpretability: Every score component should be explainable in dashboard
- Score update frequency: Daily (as new payment/complaint data arrives)

**Output Format:**
```json
{
  "score_id": "score_20260221_tenant456",
  "tenant_id": "tenant_456",
  "overall_risk_score": 32,
  "risk_category": "MODERATE",
  "component_scores": {
    "payment_history": 85,
    "tenure_stability": 78,
    "documentation_quality": 95,
    "complaint_record": 92,
    "financial_capacity": 60
  },
  "recommendation": "Approve with 1x monthly deposit guarantee",
  "confidence": 0.82,
  "last_updated": "2026-02-21T14:30:00Z",
  "data_completeness": 0.95,
  "red_flags": [
    "Payment 3 days late in Dec 2025",
    "Income-to-rent ratio at edge of safety threshold"
  ]
}
```

**FR-2.4: Model Monitoring & Retraining Pipeline**

**Requirement:** Automated monitoring dan retraining untuk semua ML models

**Acceptance Criteria:**
- Weekly performance monitoring: MAPE tracking, prediction error distribution
- Monthly retraining trigger jika: MAPE degradation >5% OR new data >500 samples
- Automated A/B testing: Candidate model vs production model validation sebelum deployment
- Rollback capability: Automatic rollback jika new model MAPE >5% worse
- Data drift detection: Alert jika input distribution berubah significantly (Kolmogorov-Smirnov test p-value <0.05)
- Model version control: Tracking semua model versions dengan exact code commit + dataset snapshot

---

#### FR-3: MODUL INTERPRETASI AI (GENAI LAYER)

**FR-3.1: Automated Report Generation**

**Requirement:** Generate narasi laporan bulanan dalam bahasa Indonesia natural

**Inputs:** ML predictions, OCR processed documents, performance metrics dari bulan sebelumnya

**Output Types:**
1. **Executive Summary (500 words)**: Performa bulanan, key recommendations, risks
2. **Pricing Analysis Report (300 words)**: Price movement recommendations per room, justification
3. **Tenant Risk Alert (200 words)**: High-risk tenants, recommended actions
4. **Occupancy Forecast Brief (250 words)**: Next month prediction, marketing suggestions

**Example Output:**
```
LAPORAN OPERASIONAL BULANAN - FEBRUARI 2026
Properti: Kosan "Rumah Nyaman" (ID: kosan_001)

RINGKASAN EKSEKUTIF:
Bulan Februari mencatat tingkat hunian 76%, turun 4 poin dari target 80%. 
Prediksi model menunjukkan recovery ke 82% pada Maret dengan seasonal adjustment 
positif dari libur akhir semester. Rekomendasi: Pertahankan harga saat ini (Rp 1.5jt) 
di 8 kamar utama, naikkan 5% untuk 2 kamar premium.

ANALISIS KEUANGAN:
- Total pendapatan Feb: Rp 21.6 juta (est. vs Rp 22.5jt target)
- Payment on-time: 94% (↑2% from Jan)
- Default rate: 1 tenant (2%), dalam normal range

REKOMENDASI AKSI PRIORITAS:
1. [HIGH] Tingkatkan kamar A3 (vakum 3 bulan) dengan price adjustment -8% + marketing push
2. [MEDIUM] Monitor tenant D2 (score 48, MODERATE risk) - pembayaran tepat waktu Apr 2026
3. [LOW] Rencanakan maintenance preventif kamar B1-B3 (occupancy dropping trend)
```

**Acceptance Criteria:**
- Report generation time: <2 menit
- Readability score: Flesch-Kincaid Grade Level < 8 (mudah dibaca non-technical users)
- Factual accuracy: 100% cite dari real data (no hallucination)
- Actionability: Minimum 3 specific, priority-ranked recommendations per report
- Customization: Allow user to select report type, date range, focus areas

**FR-3.2: Prediction Explanation Interface**

**Requirement:** Generate penjelasan interaktif mengapa model memberikan rekomendasi tertentu

**Features:**
- SHAP (SHapley Additive exPlanations) value visualization
- "What-if" scenario: User input perubahan satu parameter, lihat dampak pada harga/risk score
- Feature importance ranking: Tampilkan top 5 faktor yang paling berpengaruh per prediksi

**Example Explanation:**
```
Mengapa Kamar 102 Direkomendasikan Harga Rp 1.75 juta (↑16.7%)?

📊 ANALISIS FAKTOR-FAKTOR:

1. Lokasi Premium (⬆️ +15%)
   Kamar 102 berada di lantai 2 dekat tangga utama.
   Tetangga terdekat 2.5km jaraknya. Ini faktor terbesar.

2. Amenities Lengkap (⬆️ +10%)
   AC, WiFi, Water tank termasuk. Kompetitor hanya 60% punya semua.

3. Kompetitor Pressure (⬇️ -5%)
   3 kosan kompetitor dalam radius 1km menawarkan Rp 1.5-1.6jt.
   Tapi kualitas 15% lebih rendah berdasarkan analisis.

4. Tren Musiman (⬆️ +8%)
   Maret adalah high-demand season (masuk semester baru).
   Historical data: Price dapat naik 8% di bulan ini.

KESIMPULAN:
Dengan confidence 87%, harga Rp 1.75jt adalah optimal.
Worst-case (5th percentile): Rp 1.65jt | Best-case (95th): Rp 1.85jt

❓ WHAT-IF SCENARIOS:
- Jika Anda naik ke Rp 1.8jt → Expected demand drop 8-12%
- Jika kompetitor turun Rp 100rb → Rekomendasi akan turun menjadi Rp 1.7jt
```

**Acceptance Criteria:**
- Explanation generation time: <1 detik per prediksi
- Explanation clarity: Non-technical user harus paham 80% content tanpa additional learning
- What-if scenario compute time: <2 detik
- Visual representation: Include simple charts/graphs untuk feature importance

---

#### FR-4: DASHBOARD & REPORTING

**FR-4.1: Property Overview Dashboard**

**Layout & Components:**

```
┌─────────────────────────────────────────────────────────────┐
│ 🏠 DASHBOARD - Kosan "Rumah Nyaman"        [📅 Feb 2026]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────┬───────────┬───────────┬──────────────────┐ │
│  │ Hunian    │ Pendapatan│ Tenant    │ Avg Rating       │ │
│  │ 76% ↓     │ 21.6M ✓   │ Risk Med  │ 4.2/5 ⭐        │ │
│  │ (-4% MTM) │ (-4% MTM) │ 48       │ (+0.3 MTM)      │ │
│  └───────────┴───────────┴───────────┴──────────────────┘ │
│                                                             │
│  ┌──────────────────────┐   ┌──────────────────────────┐  │
│  │ Hunian per Kamar     │   │ Revenue Trend (6 bulan) │  │
│  │ [Interactive Chart]  │   │ [Line Chart]            │  │
│  │ - Terisi: 19 kamar   │   │ Target vs Actual        │  │
│  │ - Kosong: 6 kamar    │   │ Forecast: ↑             │  │
│  │ - Maintenance: 1     │   │                         │  │
│  └──────────────────────┘   └──────────────────────────┘  │
│                                                             │
│  ┌──────────────────┐   ┌────────────────────────────────┐│
│  │ ALERTS & ACTIONS │   │ UPCOMING (Next 30 Days)        ││
│  ├──────────────────┤   ├────────────────────────────────┤│
│  │ 🔴 HIGH          │   │ • 2 lease ending (Mar 15, 20) ││
│  │ - Kamar A3: Vakum│   │ • 1 payment overdue (+12 days)││
│  │   3 bulan        │   │ • Maintenance schedule: B1    ││
│  │                  │   │ • Predicted occupancy ↑ 6%   ││
│  │ 🟡 MEDIUM        │   │                                ││
│  │ - D2: Risk 48    │   │ [See Full Calendar]            ││
│  │                  │   │                                ││
│  └──────────────────┘   └────────────────────────────────┘│
│                                                             │
│  [🔄 Refresh] [📊 Reports] [⚙️ Settings] [❓ Help]        │
└─────────────────────────────────────────────────────────────┘
```

**Dashboard Components:**

| Component | Type | Refresh | Key Metrics |
|-----------|------|---------|------------|
| KPI Cards | Real-time | Every 5 min | Occupancy %, Revenue, Risk Score |
| Occupancy Chart | Monthly trend | Daily | Room utilization, forecast |
| Revenue Tracking | Financial | Real-time | Actual vs Budget, MTM change |
| Tenant Status | List | Real-time | Name, Room, Score, Days Left |
| Payment Status | Table | Real-time | On-time, Late, Overdue counts |
| Alerts Panel | Notification | Real-time | Critical, Medium, Low priority |

**Acceptance Criteria:**
- Load time <3 detik untuk first paint
- Real-time data update: <5 detik latency untuk payment/status changes
- Responsive design: Works on desktop (1920x1080), tablet (iPad), mobile (iPhone 12+)
- Accessibility: WCAG 2.1 AA compliance (color contrast, keyboard nav)
- Drill-down capability: Click on any chart untuk detail view

**FR-4.2: Detailed Financial Report**

**Report Sections:**

1. **Monthly Summary**
   - Total revenue, expected vs actual
   - Occupancy-adjusted revenue metric
   - ROI vs industry benchmark

2. **Per-Room Analysis**
   - Revenue per room, trend, forecast
   - Occupancy days per room
   - Pricing vs competitor comparison

3. **Tenant Ledger**
   - Payment history: on-time, late, overdue breakdown
   - Aging analysis: amount overdue >30/60/90 days
   - Churn analysis: contract endings, early terminations

4. **Predictive Insights**
   - Revenue forecast 3-6 bulan ke depan
   - Risk exposure: High-risk tenants financial impact
   - Recommendation implementation impact

**Acceptance Criteria:**
- Report exportable as PDF, Excel, CSV
- Data accuracy 100% terhadap source database
- Audit trail: Report generator, timestamp, data version
- Customization: Allow user select date range, metrics, filtering
- Generation time: <30 detik untuk 6-bulan historical report

**FR-4.3: Room Availability & Booking Interface** (Optional for Tenant Facing)

**Requirement:** Display available rooms untuk calon penyewa dengan minimal info

**Acceptance Criteria:**
- Show only unoccupied rooms
- Display basic amenities, price, floor plan (images)
- Allow booking request (nama, contact, preferred move-in date)
- Generate inquiry notification ke property manager
- No personal data displayed (full name redacted untuk existing tenants)

---

#### FR-5: DATA MANAGEMENT & MASTER DATA

**FR-5.1: Property Master Data Management**

**Data Structure:**
```json
{
  "property_id": "kosan_001",
  "property_name": "Kosan Rumah Nyaman",
  "address": "Jl. Raya Bogor No. 123, Depok",
  "coordinates": {
    "latitude": -6.3857,
    "longitude": 106.8138
  },
  "property_type": "Kosan (Student Housing)",
  "building_info": {
    "total_floors": 3,
    "total_rooms": 26,
    "year_built": 2015,
    "last_renovation": "2024-06-15",
    "condition_rating": 4.2
  },
  "amenities": [
    "WiFi 50Mbps",
    "Gated Entry",
    "24h Security",
    "Water Tank 10k L",
    "Common Kitchen",
    "Laundry Service"
  ],
  "area_info": {
    "urban_classification": "suburban",
    "proximity_campus_meters": 2500,
    "proximity_transit_meters": 800,
    "neighborhood_density": "medium"
  }
}
```

**Acceptance Criteria:**
- CRUD operations (Create, Read, Update, Delete) dengan proper authorization
- Bulk import dari CSV dengan validation
- Change history logging (who changed what, when)
- Data validation: Duplicate check, coordinate validation, amenity standardization
- Photo upload: Support 5-10 photos per property (min 1 required)

**FR-5.2: Tenant Master Data**

**Data Fields:**
```json
{
  "tenant_id": "tenant_456",
  "personal_info": {
    "full_name": "Ahmad Rizki",
    "id_type": "KTP",
    "id_number": "3271234567891234",
    "date_of_birth": "1998-05-15",
    "phone": "+62812345678"
  },
  "occupancy": {
    "property_id": "kosan_001",
    "room_number": "102",
    "start_date": "2025-11-01",
    "expected_end_date": "2026-04-30",
    "actual_end_date": null,
    "contract_type": "semester"
  },
  "financial": {
    "monthly_rent": 1500000,
    "deposit_amount": 1500000,
    "payment_method": "Bank Transfer",
    "bank_account": "hidden"
  },
  "risk_profile": {
    "risk_score": 32,
    "risk_category": "MODERATE",
    "flagged_items": ["Payment 3 days late in Dec 2025"]
  }
}
```

**Acceptance Criteria:**
- Personal data encryption at rest (AES-256)
- PII access controlled dan audited
- Data retention: Comply dengan local regulations (assume 7 tahun archive)
- Deletion workflow: Soft-delete (anonymization) atau hard-delete per regulation
- GDPR-compliant if expand ke EU operations

**FR-5.3: Document Management**

**Requirement:** Centralized storage untuk semua dokumen tenant/property

**Features:**
- Organize by: Property → Room → Tenant → Document Type
- Search: Full-text search on OCR extracted data
- Version control: Keep all versions (original + corrections)
- Retention policy: Auto-archive expired contracts (2+ years)
- Encryption: All documents encrypted at rest

**Acceptance Criteria:**
- Storage: AWS S3 dengan encryption enabled
- File access: Download, view, print (watermark + user ID)
- Audit trail: Track who accessed what document, when
- Backup: Daily incremental backup, weekly full backup; 30-day retention

---

### 3.2 Non-Functional Requirements (NFR)

#### NFR-1: PERFORMANCE

| Metric | Target | Measurement |
|--------|--------|------------|
| Page Load Time | <3 detik (First Contentful Paint) | Lighthouse, WebPageTest |
| API Response Time (95th percentile) | <500 ms | CloudWatch / APM tools |
| OCR Processing | <2 min/dokumen | End-to-end timing |
| ML Prediction | <1 detik per prediction | Endpoint latency |
| Database Query | <100 ms (95th percentile) | Query logs |
| Concurrent Users Support | 50 active users | Load testing |

**Performance Testing Requirements:**
- Load test: 50 concurrent users, 5-minute sustained load
- Spike test: 50 → 200 users dalam 30 detik
- Soak test: Run 8 jam dengan 30 concurrent users, memory stable
- OCR batch processing: 1000 documents dalam <33 menit

#### NFR-2: RELIABILITY & AVAILABILITY

| Aspect | Target | Details |
|--------|--------|---------|
| Uptime SLA | 99.5% | ~3.6 jam downtime/bulan acceptable |
| Mean Time To Recovery (MTTR) | <15 min | For critical services |
| Data Durability | 99.999999999% (11 nines) | Standard cloud storage |
| Backup Frequency | Daily incremental, Weekly full | Recovery Point Objective (RPO): 24 hours |

**Disaster Recovery Plan:**
- RTO (Recovery Time Objective): <4 hours untuk critical services
- RPO: <24 hours (acceptable data loss)
- Backup storage: Separate region dari primary (disaster-proof)
- Failover testing: Quarterly DR drills

#### NFR-3: SECURITY

**Data Security:**
- Encryption in transit: TLS 1.3 untuk semua API calls
- Encryption at rest: AES-256 untuk database fields (PII), S3 objects
- PII fields: name, phone, ID number, financial data (masked access)
- Database backups: Encrypted dengan separate key management

**Authentication & Authorization:**
- Authentication: Email + Password (+ TOTP 2FA optional for admin)
- Session management: JWT token (24-hour expiry), refresh token (7-day expiry)
- Authorization: Role-Based Access Control (RBAC) dengan 3 roles:
  - Admin: Full system access, user management, model retraining
  - Manager: Property/tenant CRUD, reports, pricing decisions
  - Surveyor: Document upload, tenant data entry only
- API Keys: For programmatic access, rotation every 90 days

**Compliance & Audit:**
- Audit Log: All user actions logged (who, what, when, result)
- Data Privacy: Comply dengan GDPR (if EU) + assume Indonesia privacy regulation
- Retention: Audit logs kept 2 years, encrypted, immutable
- Vulnerability Management: Quarterly penetration testing, monthly dependency scanning

**Acceptance Criteria:**
- No SQL injection vulnerabilities (OWASP Top 10)
- CSRF protection on state-changing endpoints
- Rate limiting: API 100 req/min per user (prevent abuse)
- DDoS mitigation: CloudFlare WAF enabled

#### NFR-4: SCALABILITY

**Horizontal Scaling:**
- Stateless backend services: Deploy multiple instances behind load balancer
- Database scaling: Read replicas untuk analytics queries; write primary untuk transactions
- Caching layer: Redis untuk session storage, frequently-accessed master data
- File storage: S3 auto-scales; OCR lambda functions auto-spawn

**Growth Projections (Assuming Linear):**
| Metric | Month 3 | Month 6 |
|--------|---------|---------|
| Properties | 20 | 40-50 |
| Tenants | 300 | 600 |
| Documents | 1,200 | 2,400 |
| Daily API calls | 50k | 100k |
| Database size | ~2 GB | ~5 GB |

**Acceptance Criteria:**
- Scaling should be transparent (no service interruption)
- Auto-scaling triggers: CPU >70%, RAM >80%, Request rate >50/sec
- Cost scaling: Linear growth in cloud costs (no surprises)

#### NFR-5: USABILITY & ACCESSIBILITY

**Usability:**
- Task completion time: Primary workflows <5 minutes (pricing update, payment mark)
- Error rate: Trained user error rate <2%
- User satisfaction: SUS (System Usability Scale) ≥70
- Help/Documentation: Integrated help tooltips, video tutorials available

**Accessibility (WCAG 2.1 AA):**
- Color contrast ratio: ≥4.5:1 untuk text
- Keyboard navigation: All functions accessible via keyboard
- Screen reader support: Semantic HTML, ARIA labels
- Font size: Scalable (minimum 12px)

#### NFR-6: MAINTAINABILITY

**Code Quality:**
- Unit test coverage: ≥80% untuk business logic
- Code review: All PRs reviewed oleh minimum 1 senior developer
- Documentation: Inline comments untuk complex logic; API docs auto-generated (Swagger)
- Linting: SonarQube for Python/JavaScript code quality

**Dependency Management:**
- Pinned versions: All dependencies dalam requirements.txt / package.json
- Security updates: Monthly scanning dengan Snyk / Dependabot
- Breaking change testing: Pre-production staging environment

#### NFR-7: COST OPTIMIZATION

**Cloud Infrastructure Cost** (Estimated pilot 6 bulan, 20 kosans):

| Component | Quantity | Monthly Cost |
|-----------|----------|--------------|
| Compute (Backend) | 1 t3.medium EC2 instance | $30 |
| Database | PostgreSQL RDS db.t3.small | $40 |
| Storage | S3 (2GB) + data transfer | $15 |
| OCR Lambda | ~1000 invocations/month | $10 |
| ML Training | GPU (p3.2xlarge, 2 hours/month) | $20 |
| Monitoring | CloudWatch, Datadog | $20 |
| **Total** | | **~$135/month** |

**Cost per property:** ~$6.75/bulan (pilot phase) → ~$1.35/bulan (production scale 100 kosans)

**Cost Optimization Strategies:**
- Spot instances for batch processing (OCR, model training)
- Reserved instances untuk stable baseline load
- S3 lifecycle policies: Move old documents to Glacier after 2 years

---

## 4. TECHNOLOGY STACK & ARCHITECTURE

### 4.1 Recommended Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│  ┌────────────────┬───────────────┬───────────────────────┐ │
│  │  React.js 18   │  Tailwind CSS  │  Redux Toolkit        │ │
│  │  (Interactive  │  (Styling)     │  (State Management)   │ │
│  │   dashboard)   │                │                       │ │
│  └────────────────┴───────────────┴───────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    API GATEWAY LAYER                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  AWS API Gateway / Kong                              │  │
│  │  (Rate limiting, authentication, request routing)    │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                        │
│  ┌────────────────────────┬───────────────────────────────┐ │
│  │ Flask / FastAPI        │ Node.js + Express (Optional) │ │
│  │ (Python - ML friendly) │ (For real-time features)     │ │
│  │                        │                              │ │
│  │ Modules:              │ Modules:                       │ │
│  │ ├─ User Auth          │ ├─ WebSocket handler          │ │
│  │ ├─ OCR Pipeline       │ ├─ Real-time notifications    │ │
│  │ ├─ ML Inference       │ └─ File upload orchestration  │ │
│  │ ├─ Data Validation    │                              │ │
│  │ └─ Business Logic     │                              │ │
│  └────────────────────────┴───────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    DATA PROCESSING LAYER                    │
│  ┌────────────────┬──────────────┬───────────────────────┐ │
│  │ Apache Airflow │ AWS Lambda   │ Celery                │ │
│  │ (ML pipeline   │ (OCR batch   │ (Async tasks)         │ │
│  │  orchestration)│  processing) │                       │ │
│  └────────────────┴──────────────┴───────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    ML/AI LAYER                              │
│  ┌────────────┬──────────────┬──────────┬──────────────┐   │
│  │ Scikit-learn│ XGBoost      │ SHAP     │ Tesseract    │   │
│  │ (Regression,│ (Ensemble    │ (Model  │ OCR + Pytho  │   │
│  │ Classification)│ models)    │ explain)│ n-tesseract  │   │
│  └────────────┴──────────────┴──────────┴──────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Google Gemini API (1.5 Pro)                          │  │
│  │ (Report generation, prediction explanation)         │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    DATA LAYER                              │
│  ┌────────────────────┬──────────────────────────────────┐ │
│  │ PostgreSQL 15      │ Redis 7                         │ │
│  │ (Primary DB,       │ (Caching, session store)        │ │
│  │  ACID transactions) │                                │ │
│  │                    │                                 │ │
│  │ ├─ Tables: users   │ ├─ Cache keys:                 │ │
│  │ ├─ properties      │ │  property:${id}              │ │
│  │ ├─ tenants         │ │  predictions:${model}:${id}  │ │
│  │ ├─ transactions    │ │  user:${id}:session          │ │
│  │ ├─ documents       │ └─ TTL: 24 hours for data       │ │
│  │ ├─ ml_predictions  │                                │ │
│  │ └─ audit_log       │                                │ │
│  └────────────────────┴──────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    STORAGE LAYER                            │
│  ┌──────────────────┬─────────────────────────────────────┐│
│  │ AWS S3           │ MongoDB (Optional, for logs)       ││
│  │ ├─ documents/    │ (Time-series data, audit logs)    ││
│  │ ├─ models/       │                                    ││
│  │ ├─ backups/      │                                    ││
│  │ └─ exports/      │                                    ││
│  └──────────────────┴─────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│                    MONITORING & LOGGING                    │
│  ┌──────────────┬──────────────┬──────────────────────────┐│
│  │ CloudWatch   │ ELK Stack    │ Sentry                 ││
│  │ (Metrics,    │ (Logs,       │ (Error tracking)       ││
│  │  alarms)     │  searches)   │                        ││
│  └──────────────┴──────────────┴──────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                      USER TIER                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Web Browser (React SPA)          Mobile App (React Native)   │
│  PC/Laptop/Tablet                 iOS/Android                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────┐
                    │  CloudFlare CDN │  ← Static assets caching
                    └────────┬────────┘
                             ↓
┌────────────────────────────────────────────────────────────────┐
│                  LOAD BALANCER TIER (ALB)                      │
│                   AWS Application LB                           │
└────────────────────────────────────────────────────────────────┘
         ↓                    ↓                    ↓
      ┌──────────────────────────────────────────────────┐
      │         COMPUTE TIER (Auto-scaling)              │
      │  3x EC2 Instances (t3.medium) + RDS proxy       │
      │                                                   │
      │  ┌─────────────────────────────────────────────┐│
      │  │  Instance 1: Backend API (Flask)            ││
      │  │  ├─ Users, Auth                             ││
      │  │  ├─ Properties, Tenants                      ││
      │  │  ├─ Transactions, Documents                  ││
      │  │  └─ Dashboard endpoints                      ││
      │  └─────────────────────────────────────────────┘│
      │  ┌─────────────────────────────────────────────┐│
      │  │  Instance 2: ML Service (Python)            ││
      │  │  ├─ Price prediction inference               ││
      │  │  ├─ Occupancy forecast                       ││
      │  │  ├─ Tenant scoring                           ││
      │  │  └─ Model versioning endpoint                ││
      │  └─────────────────────────────────────────────┘│
      │  ┌─────────────────────────────────────────────┐│
      │  │  Instance 3: Worker (Async Tasks)           ││
      │  │  ├─ OCR processing (Celery)                 ││
      │  │  ├─ Report generation                        ││
      │  │  ├─ Model retraining triggers                ││
      │  │  └─ Batch data exports                       ││
      │  └─────────────────────────────────────────────┘│
      └──────────────────────────────────────────────────┘
           ↓          ↓             ↓            ↓
    ┌────────────────────────────────────────────────────┐
    │             CACHE LAYER (Redis)                    │
    │  Session store | Query cache | ML prediction cache │
    └────────────────────────────────────────────────────┘
           ↓          ↓                      ↓
    ┌────────────────────────────────────────────────────┐
    │          DATA LAYER (Managed Services)            │
    │  ┌─────────────────┐    ┌──────────────────────┐ │
    │  │  RDS PostgreSQL │    │  S3 (Documents,      │ │
    │  │  15.x           │    │   Models, Backups)   │ │
    │  │  Multi-AZ       │    │                      │ │
    │  │  Read replica   │    │  ├─ Versioning      │ │
    │  │  Automated      │    │  ├─ Encryption      │ │
    │  │  backup         │    │  └─ Lifecycle       │ │
    │  └─────────────────┘    └──────────────────────┘ │
    └────────────────────────────────────────────────────┘
           ↓                                    ↓
    ┌────────────────────────────────────────────────────┐
    │        EXTERNAL SERVICES & APIs                    │
    │  ├─ Google Gemini API (Report generation)         │
    │  ├─ AWS Lambda (OCR batch processing)             │
    │  ├─ Tesseract Service (OCR inference)             │
    │  └─ Email Service (SES / SendGrid)                │
    └────────────────────────────────────────────────────┘

Backup & DR:
┌────────────────────────────────────────────────────────┐
│  Daily: RDS backup snapshot → S3 (separate region)    │
│  Weekly: Full system snapshot                          │
│  Recovery test: Quarterly                              │
└────────────────────────────────────────────────────────┘

Monitoring & Logging:
┌────────────────────────────────────────────────────────┐
│  CloudWatch (metrics) → Dashboard                       │
│  ELK Stack (application logs) → Visualization          │
│  Sentry (errors) → Alerting                            │
└────────────────────────────────────────────────────────┘
```

### 4.3 Database Schema (Simplified)

**Key Tables:**

```sql
-- Users & Access Control
TABLE users (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role ENUM('admin', 'manager', 'surveyor'),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- Properties
TABLE properties (
  property_id SERIAL PRIMARY KEY,
  owner_id INTEGER REFERENCES users(user_id),
  property_name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  total_floors INTEGER,
  total_rooms INTEGER,
  year_built INTEGER,
  amenities JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Rooms
TABLE rooms (
  room_id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(property_id),
  room_number VARCHAR(50) NOT NULL,
  floor_level INTEGER,
  size_sqm DECIMAL(8, 2),
  furnishing_level ENUM('unfurnished', 'semi', 'furnished'),
  current_status ENUM('occupied', 'vacant', 'maintenance'),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tenants
TABLE tenants (
  tenant_id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  id_type VARCHAR(50),
  id_number VARCHAR(50) UNIQUE,
  phone VARCHAR(20),
  email VARCHAR(255),
  date_of_birth DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Occupancy
TABLE occupancies (
  occupancy_id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES rooms(room_id),
  tenant_id INTEGER REFERENCES tenants(tenant_id),
  start_date DATE NOT NULL,
  expected_end_date DATE,
  actual_end_date DATE,
  monthly_rent DECIMAL(12, 2),
  deposit_amount DECIMAL(12, 2),
  contract_type VARCHAR(50),
  status ENUM('active', 'ended', 'terminated'),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transactions (Payments)
TABLE transactions (
  transaction_id SERIAL PRIMARY KEY,
  occupancy_id INTEGER REFERENCES occupancies(occupancy_id),
  amount DECIMAL(12, 2) NOT NULL,
  transaction_date DATE NOT NULL,
  due_date DATE,
  payment_date DATE,
  status ENUM('pending', 'paid', 'overdue', 'failed'),
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Documents
TABLE documents (
  document_id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(property_id),
  tenant_id INTEGER REFERENCES tenants(tenant_id),
  document_type ENUM('ktp', 'contract', 'receipt', 'other'),
  file_path VARCHAR(500),
  file_size_kb INTEGER,
  ocr_status ENUM('pending', 'processing', 'completed', 'failed'),
  ocr_confidence DECIMAL(3, 2),
  extracted_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ML Predictions
TABLE ml_predictions (
  prediction_id SERIAL PRIMARY KEY,
  prediction_type ENUM('price', 'occupancy', 'tenant_score'),
  subject_id INTEGER,  -- room_id or tenant_id
  predicted_value DECIMAL(12, 2),
  confidence DECIMAL(3, 2),
  model_version VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP
);

-- Audit Log
TABLE audit_logs (
  log_id BIGSERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id),
  action VARCHAR(255) NOT NULL,
  table_name VARCHAR(100),
  record_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45)
);

-- Indices for performance
CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_occupancies_room ON occupancies(room_id);
CREATE INDEX idx_occupancies_tenant ON occupancies(tenant_id);
CREATE INDEX idx_transactions_occupancy ON transactions(occupancy_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_documents_property ON documents(property_id);
CREATE INDEX idx_predictions_created ON ml_predictions(created_at);
```

### 4.4 API Design (RESTful)

**Base URL:** `https://api.dss-kosan.com/v1`

**Authentication:** Bearer token (JWT)

**Key Endpoints:**

```
AUTH
POST   /auth/register                    Register new user
POST   /auth/login                       Login (returns JWT token)
POST   /auth/refresh                     Refresh token
POST   /auth/logout                      Logout

PROPERTIES
GET    /properties                       List all properties (with pagination)
GET    /properties/{property_id}         Get property details
POST   /properties                       Create new property
PUT    /properties/{property_id}         Update property
DELETE /properties/{property_id}         Soft delete property

ROOMS
GET    /properties/{property_id}/rooms   List rooms in property
GET    /rooms/{room_id}                  Get room details + occupancy status
PUT    /rooms/{room_id}                  Update room details

TENANTS
GET    /tenants                          List all tenants
GET    /tenants/{tenant_id}              Get tenant details + risk score
POST   /tenants                          Create new tenant
PUT    /tenants/{tenant_id}              Update tenant info

OCCUPANCIES
GET    /occupancies                      List all occupancies
POST   /occupancies                      Create new occupancy (check-in)
PUT    /occupancies/{occupancy_id}       Extend/modify occupancy
POST   /occupancies/{occupancy_id}/end   End occupancy (check-out)

TRANSACTIONS
GET    /transactions                     List transactions (filterable by status, date)
POST   /transactions                     Record new payment
PUT    /transactions/{transaction_id}    Update transaction status

DOCUMENTS
POST   /documents/upload                 Upload document for OCR processing
GET    /documents/{document_id}          Get document details + extracted data
PUT    /documents/{document_id}/verify   Verify/correct OCR extraction
GET    /documents/bulk-status            Check status of batch upload

ML PREDICTIONS
GET    /predictions/price                Get price recommendations
  Query params: room_id, property_id
  Response: Recommended price + confidence interval

GET    /predictions/occupancy            Get occupancy forecast
  Query params: property_id, months_ahead (1-6)
  Response: Predicted occupancy % + confidence

GET    /predictions/tenant-score         Get tenant risk score
  Query params: tenant_id
  Response: Risk score (0-100) + component breakdown

DASHBOARD
GET    /dashboard/summary                KPI snapshot (occupancy, revenue, alerts)
GET    /dashboard/property/{property_id} Property-specific dashboard data
GET    /dashboard/reports/monthly        Monthly financial report

ADMIN
GET    /admin/users                      Manage system users
POST   /admin/users                      Create user account
PUT    /admin/users/{user_id}/role       Update user role
GET    /admin/system-health              System uptime, performance metrics
POST   /admin/models/retrain             Trigger ML model retraining
```

**Response Format (Success):**
```json
{
  "status": "success",
  "data": { ... },
  "timestamp": "2026-02-21T14:30:00Z",
  "request_id": "req_abc123"
}
```

**Response Format (Error):**
```json
{
  "status": "error",
  "error_code": "INVALID_INPUT",
  "message": "Room ID tidak ditemukan",
  "details": { "room_id": "Invalid format" },
  "timestamp": "2026-02-21T14:30:00Z",
  "request_id": "req_abc123"
}
```

---

## 5. DATA & ML SPECIFICATIONS

### 5.1 Data Collection Strategy (Phase 2)

**Target:** 20 Kosan, ~300 Tenants, 1,200+ Documents

**Data Collection Timeline:**

| Week | Activity | Output |
|------|----------|--------|
| 1-2 | Surveyor training + property walkthrough | Property master data (20 properties), photos |
| 2-3 | Document digitization (scan/photo all contracts, receipts, KTPs) | 1,200+ documents, 60% OCR accuracy baseline |
| 3-4 | Data entry: Historical transactions (past 12 months) | Payment history dataset |
| 4-5 | Data quality check + cleaning | Clean dataset, 90%+ completeness |
| 5-6 | Train/test split + initial model training | Baseline models, performance benchmarks |

**Data Quality Standards:**

| Field | Completeness | Validation |
|-------|--------------|-----------|
| Tenant Name | 100% | Regex pattern, no special chars |
| ID Number | 95% | 16-digit KTP format check |
| Room Size | 80% | Numeric, range 10-50 m² |
| Monthly Rent | 99% | Numeric, Rp 500k - Rp 5jt range |
| Payment Date | 95% | Date format validation |
| Occupancy Duration | 85% | Logical end date > start date |

**Handling Missing Data:**
- If <5% missing: Imputation with mean/mode per property cluster
- If 5-20% missing: Mark as "not applicable" but include in analysis
- If >20% missing: Exclude from model training (flag as data quality issue)

### 5.2 ML Model Specifications

#### Model 1: Price Prediction

**Problem Type:** Regression (Continuous numeric output)

**Training Data:**
- Input: 500-1,000 room occupancy records (historical 12-24 months)
- Features: Room size, amenities, floor, location, competitor price, seasonality
- Target: Monthly rental price

**Algorithm Justification:**

| Algorithm | Pros | Cons | Choice? |
|-----------|------|------|---------|
| Linear Regression | Simple, interpretable | Assumes linear relationships, poor with high-dimensional data | Secondary |
| Random Forest | Robust, handles non-linearity, feature importance | Black-box, slower inference | **PRIMARY** |
| XGBoost | High accuracy, handles missing data | Complex tuning, risk of overfitting | Alternative |
| Neural Network | Flexible, can learn complex patterns | Needs large data (not available), harder to interpret | No |

**Random Forest Config:**
```python
RandomForestRegressor(
  n_estimators=200,           # 200 trees balance accuracy vs speed
  max_depth=15,               # Prevent overfitting
  min_samples_split=5,        # At least 5 samples per split
  min_samples_leaf=2,         # At least 2 samples in leaf
  max_features='sqrt',        # Feature randomness
  random_state=42,            # Reproducible
  n_jobs=-1                   # Parallel processing
)
```

**Training Process:**
1. Collect 500+ room-month price samples
2. Feature engineering: room size × furnishing, seasonality index, location score
3. Train/test split: 80% train, 20% test
4. Cross-validation: 5-fold CV to estimate generalization error
5. Hyperparameter tuning: GridSearchCV for best params
6. Evaluation: MAPE < 10%, MAE < Rp 150k
7. Monthly retraining: Feed new data (30-50 samples/month) to improve

**Feature Importance Example Output:**
```
Feature Importance Ranking:
1. Room Size (m²):                31%
2. Location Proximity to Campus:   22%
3. Competitor Average Price:       18%
4. Amenities Count:                15%
5. Furnishing Level:               10%
6. Floor Level:                    4%
```

**Model Serving:**
- Inference latency target: <100ms per prediction
- Batch inference: 1,000 predictions/sec capacity (for scenario analysis)
- Model versioning: Keep last 3 versions for A/B testing

#### Model 2: Occupancy Forecast

**Problem Type:** Time Series Forecasting

**Training Data:**
- Input: 24-month historical occupancy rates per property
- Features: Previous month occupancy, seasonality (month), trend
- Target: Next month occupancy rate (%)

**Algorithm Selection:**

| Approach | Use Case | Choice? |
|----------|----------|---------|
| ARIMA/SARIMA | Traditional, stable patterns | Primary for trend |
| Exponential Smoothing | Captures trend + seasonality | Combined approach |
| Prophet (Facebook) | Handles missing data, holidays | Alternative |
| LSTM Neural Network | Non-linear patterns | Only if >100 months data |

**Hybrid Approach:**
```
Step 1: Decompose time series → Trend + Seasonality + Residual
Step 2: ARIMA(1,1,1) for trend component
Step 3: Seasonal pattern (manual, from historical data)
Step 4: XGBoost on residuals (capture non-linearity)
Final Forecast = Trend + Seasonality + Residual Prediction
```

**Expected Output:**
```
March 2026 Occupancy Forecast:
- Point estimate: 78%
- 95% confidence interval: [72%, 84%]
- Trend: Increasing (+4% from Feb)
- Seasonal factor: +5% (spring semester)
- Risk probability (occupancy <70%): 8%
```

**Retraining Frequency:** Monthly (every 25th of month with latest data)

#### Model 3: Tenant Risk Scoring

**Problem Type:** Classification (Risk category) + Ranking (Risk score 0-100)

**Training Data:**
- Input: Historical tenant payment/behavior records (300-500 samples)
- Features: Payment history, tenure, complaints, income ratio
- Target: Whether tenant defaulted/caused damage (binary label)

**Labeling Strategy:**
```
Positive (High Risk) = True if:
- 3+ late payments (>30 days) in 12 months, OR
- 1+ complete default (90+ days unpaid), OR
- 1+ damage claim >Rp 1 juta, OR
- Early termination due to breach

Negative (Low Risk) = All payments on-time + no complaints
```

**Algorithm:** Logistic Regression + Random Forest

```python
# Pipeline
1. Logistic Regression: Quick baseline, probability output
2. Random Forest: Capture non-linear risk patterns
3. Ensemble: Average both models for robustness

score = 100 × (1 - ensemble_probability_safe)
```

**Feature Engineering:**
```
Feature: Payment Timeliness Score
= (on_time_payments / total_payments) × 100
Output range: 0-100 (higher is better)

Feature: Tenure Stability
= min(avg_stay_months / 12, 1.0) × 100
(Normalize to 0-100, capped at 36 months = 100)

Feature: Complaint Weighted Index
= max(0, 100 - complaint_count × 5 - damage_incidents × 15)

Feature: Income-to-Rent Ratio
= 100 × max(0, 1 - (monthly_rent / monthly_income))
(Safe if rent <50% income)
```

**Model Validation:**
- Backtesting: Score 8 months historical data, check if high-score tenants actually defaulted less
- Fairness audit: Ensure no bias against certain demographics
- ROC-AUC: Target >0.80 (good discriminative power)

---

### 5.3 Model Monitoring & Drift Detection

**Weekly Monitoring Dashboard:**

```
Week of Feb 17-23, 2026:

PRICE MODEL:
├─ MAPE (test set): 8.2% ✓ (Target <10%)
├─ MAE: Rp 142,500 ✓ (Target <150k)
├─ Predictions served: 5,847
├─ Avg inference time: 78ms ✓
└─ Data drift detected: NO (KS-test p=0.23)

OCCUPANCY MODEL:
├─ MAPE (1-month ahead): 12.1% ✓ (Target <15%)
├─ MAPE (3-month ahead): 18.5% ✓ (Target <20%)
├─ Direction accuracy (up/down/stable): 87% ✓
└─ Data drift detected: NO

TENANT SCORE MODEL:
├─ ROC-AUC: 0.82 ✓ (Target >0.80)
├─ Precision (high-risk flagging): 85% ✓
├─ Recall: 78% ✓
└─ Data drift detected: NO
```

**Monthly Retraining Workflow:**

```
Day 25 of each month (automated Airflow DAG):

1. Extract new data: Previous 30 days transactions + documents
2. Quality check: Missing value, outlier detection
3. Data versioning: Save dataset snapshot to S3
4. Model training: Train candidate model on 80% new+old data
5. Validation: Evaluate on 20% holdout set
6. Comparison: Candidate vs Production model performance
7. Decision: If MAPE diff <5% AND no fairness regression → Deploy
8. Monitoring: Run post-deployment A/B test (10% traffic to new model)
9. Rollback: Auto-revert if new model degrades >5%
```

**Triggering Full Model Retraining:**
- MAPE increases >10% for 2 consecutive weeks
- Data drift detected (KS-test p < 0.01)
- New feature becomes available (expand feature set)
- Business rule change (e.g., price cap regulation)

---

## 6. DATA PRIVACY & COMPLIANCE

### 6.1 Data Protection

**Personal Data Classification:**

| Data Type | Classification | Encryption | Access |
|-----------|---------------|------------|--------|
| Tenant Name | PII | At rest (AES-256) | Owner + Admin |
| ID Number (KTP) | Sensitive PII | At rest + in transit (TLS) | Owner only |
| Phone Number | PII | At rest | Owner + Manager |
| Email | PII | At rest | Owner + Surveyor (read-only) |
| Payment Amount | Financial | At rest + audit | Owner + Finance |
| Address | Non-sensitive | Standard | Anyone |

**Data Retention Policy:**

| Data Type | Retention Period | Reason | Deletion Method |
|-----------|-----------------|--------|-----------------|
| Tenant Personal Info | 7 years after contract end | Tax/legal requirement | Soft-delete (anonymize) |
| Transaction Records | 10 years | Financial audit trail | Archive to cold storage after 5 years |
| Documents (OCR) | 5 years | Contract verification | Hard delete after expiration |
| System Audit Logs | 2 years | Security compliance | Hard delete, encrypted |

**Soft Deletion (Anonymization):**
```sql
UPDATE tenants 
SET 
  full_name = 'ANONYMIZED_' || md5(full_name),
  id_number = NULL,
  phone = NULL,
  email = NULL,
  is_active = false,
  anonymized_at = NOW()
WHERE contract_end_date < NOW() - INTERVAL '7 years';
```

### 6.2 Compliance Standards

**Indonesia Local Regulations:**
- **UU No. 8 Tahun 1997** (Consumer Protection): Tenant rights, dispute resolution
- **UU No. 27 Tahun 2007** (Property Management): Property registration, maintenance standards
- **PDP (Data Privacy Law)** - If enacted during project: Comply with notification requirements

**International Standards (if future expansion):**
- GDPR (EU): Data subject rights, consent management, DPA
- CCPA (California): Opt-out rights, data sale disclosure

**Within-App Compliance Features:**
- **Consent Management:** Tenant explicitly consents to data collection (checkbox during check-in)
- **Data Subject Rights:** Users can request data export (GDPR Art. 20) → automated JSON export
- **Data Deletion Request:** Formal deletion request flow (30-day review period)
- **Privacy Policy:** Displayed in-app, updated annually

### 6.3 Security Measures

**Implemented Security Controls:**

| Layer | Control | Implementation |
|-------|---------|-----------------|
| **Transport** | TLS 1.3 | AWS API Gateway, all endpoints HTTPS only |
| **Storage** | AES-256 encryption | Database & S3 encryption enabled by default |
| **Key Management** | AWS KMS | Master key rotated annually, automatic key derivation |
| **Access Control** | RBAC | 3 roles: Admin, Manager, Surveyor with least privilege |
| **Authentication** | JWT + TOTP | Access tokens 24h, refresh 7d, optional 2FA for admin |
| **Audit Trail** | Immutable logs | All CRUD ops logged, encrypted, separate storage |
| **API Security** | Rate limiting | 100 req/min per user; 1000 req/min per IP |
| **DDoS Protection** | CloudFlare WAF | Automatic mitigation, geo-blocking if needed |
| **Dependency Scanning** | Snyk/Dependabot | Monthly scans, alerts on vulnerabilities |
| **Penetration Testing** | Third-party pentest | Quarterly, focus on OWASP Top 10 |

**Incident Response Plan:**
```
1. Detection: Sentry alerts + CloudWatch alarms
2. Triage: Classify by severity (P1-P4)
3. Response: Incident commander assigned, team assembled
4. Mitigation: Isolate affected systems if needed
5. Recovery: Restore from backup if data corruption
6. Post-mortem: Root cause analysis within 48h, publish learnings
```

---

## 7. PRODUCT ROADMAP & TIMELINE

### 7.1 Phase-Gate Development Plan

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: SETUP & ARCHITECTURE (Month 1-2)                    │
├─────────────────────────────────────────────────────────────────┤
│ Goals:                                                          │
│  ✓ Team assembly & training                                   │
│  ✓ Infrastructure setup (AWS, GitHub, CI/CD)                  │
│  ✓ Database schema design & initialization                    │
│  ✓ API skeleton & authentication framework                    │
│  ✓ Frontend boilerplate (React + Tailwind)                    │
│                                                                │
│ Deliverables:                                                  │
│  • Architecture Design Document (finalized)                    │
│  • API OpenAPI specification (Swagger)                         │
│  • ER diagram & database schema DDL                            │
│  • Development environment (local + staging)                   │
│  • CI/CD pipeline (GitHub Actions → AWS)                       │
│                                                                │
│ Success Criteria:                                              │
│  ✓ All team trained & productive                              │
│  ✓ Staging environment working end-to-end                     │
│  ✓ API response <500ms on localhost                           │
│  ✓ Basic auth flow tested                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 2: DATA & OCR (Month 2-3)                               │
├─────────────────────────────────────────────────────────────────┤
│ Goals:                                                          │
│  ✓ Collect & digitize 20 kosan baseline data                   │
│  ✓ Build OCR pipeline (document upload → extraction)           │
│  ✓ Create manual review UI for OCR corrections                 │
│  ✓ Establish data quality standards                            │
│                                                                │
│ Sprint Breakdown:                                              │
│  Sprint 1 (Week 1-2):                                          │
│    • Surveyor recruitment & training (5 surveyors)            │
│    • Property walkthrough & data collection starts             │
│    • S3 bucket setup, document classification model training  │
│                                                                │
│  Sprint 2 (Week 3-4):                                          │
│    • OCR module implementation (Tesseract integration)         │
│    • Document upload API (FR-1.1)                             │
│    • Entity extraction NLP (FR-1.4)                           │
│    • Manual review UI (FR-1.5)                               │
│                                                                │
│  Sprint 3 (Week 5-6):                                          │
│    • Bulk OCR processing (1,200+ documents)                   │
│    • Data quality audit & cleaning                            │
│    • Prepare training dataset for ML models                   │
│                                                                │
│ Deliverables:                                                  │
│  • 20 properties fully digitized (property master)             │
│  • 1,200+ documents processed with OCR                         │
│  • Document database populated & indexed                       │
│  • OCR pipeline documentation                                  │
│                                                                │
│ Success Criteria:                                              │
│  ✓ OCR confidence >80% for 90% of documents                    │
│  ✓ Processing time <2 min per document                         │
│  ✓ 95% data completeness in core fields                        │
│  ✓ Manual review cycle time <5 min per document                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 3: ML MODELS & ANALYTICS (Month 3-4)                   │
├─────────────────────────────────────────────────────────────────┤
│ Goals:                                                          │
│  ✓ Train & validate 3 core ML models                          │
│  ✓ Build ML inference API endpoints                            │
│  ✓ Implement model monitoring & retraining pipeline           │
│  ✓ Create decision support dashboard                           │
│                                                                │
│ Sprint Breakdown:                                              │
│  Sprint 4 (Week 7-8):                                          │
│    • Price prediction model training (FR-2.1)                 │
│    • Feature engineering & validation                          │
│    • MAPE benchmarking                                         │
│    • Price API endpoint (FR-4 API)                            │
│                                                                │
│  Sprint 5 (Week 9-10):                                         │
│    • Occupancy forecast model (FR-2.2)                        │
│    • Time series decomposition + validation                    │
│    • Occupancy API endpoint                                   │
│                                                                │
│  Sprint 6 (Week 11-12):                                        │
│    • Tenant risk scoring model (FR-2.3)                       │
│    • Logistic regression + RF ensemble                        │
│    • Fairness audit & bias testing                            │
│    • Monitoring infrastructure (Airflow + CloudWatch)        │
│                                                                │
│ Deliverables:                                                  │
│  • 3 trained ML models (files + versions stored)               │
│  • Model cards (documentation per model)                       │
│  • ML inference service deployment                             │
│  • Monitoring dashboard (weekly metrics)                       │
│  • Feature store (reusable feature definitions)                │
│                                                                │
│ Success Criteria:                                              │
│  ✓ Price MAPE <10%, MAE <Rp 150k                             │
│  ✓ Occupancy MAPE <15% (1-month), <20% (3-month)            │
│  ✓ Tenant score ROC-AUC >0.80                                 │
│  ✓ Inference latency <1 sec for all models                    │
│  ✓ No data drift detected in baseline period                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 4: INTEGRATION & SYSTEM TESTING (Month 4-5)             │
├─────────────────────────────────────────────────────────────────┤
│ Goals:                                                          │
│  ✓ Integrate OCR → ML → Dashboard end-to-end                  │
│  ✓ Build admin & user dashboards                              │
│  ✓ GenAI layer for report generation                          │
│  ✓ Comprehensive system testing (UAT ready)                   │
│                                                                │
│ Sprint Breakdown:                                              │
│  Sprint 7 (Week 13-14):                                        │
│    • Dashboard UI development (FR-4.1, 4.2)                   │
│    • Data visualization (charts, alerts)                       │
│    • Real-time notification system                             │
│                                                                │
│  Sprint 8 (Week 15-16):                                        │
│    • GenAI integration (Gemini API)                           │
│    • Report generation (FR-3.1)                               │
│    • Prediction explanation UI (FR-3.2)                       │
│    • What-if scenario builder                                 │
│                                                                │
│  Sprint 9 (Week 17-18):                                        │
│    • System integration testing                                │
│    • Load testing (50 concurrent users)                        │
│    • Security audit & penetration testing                      │
│    • UAT environment preparation                               │
│                                                                │
│  Sprint 10 (Week 19-20):                                       │
│    • User acceptance testing with real users (pilots)          │
│    • Bug fixes & refinement                                    │
│    • Documentation finalization                                │
│    • Training material preparation                             │
│                                                                │
│ Deliverables:                                                  │
│  • Integrated system (all modules working together)            │
│  • Comprehensive dashboard UI                                  │
│  • Admin & reporting features                                  │
│  • Security audit report (signed off)                          │
│  • System & User Documentation                                 │
│  • Training videos (30-60 min total)                          │
│                                                                │
│ Success Criteria:                                              │
│  ✓ E2E workflow tested: Upload doc → OCR → DB → ML → Report  │
│  ✓ Load test: 50 users, 5-min sustained, <5% error rate      │
│  ✓ UAT: 80% of test cases passed, critical bugs zero         │
│  ✓ Security: No critical/high findings from pentest           │
│  ✓ Documentation: All APIs, workflows, troubleshooting covered│
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 5: LAUNCH & OPTIMIZATION (Month 5-6)                    │
├─────────────────────────────────────────────────────────────────┤
│ Goals:                                                          │
│  ✓ Production launch to 20 pilot kosans                        │
│  ✓ Monitor system health & user adoption                       │
│  ✓ Gather feedback & iterate                                   │
│  ✓ Prepare for scale-up roadmap                                │
│                                                                │
│ Sprint Breakdown:                                              │
│  Sprint 11 (Week 21-22):                                       │
│    • Production deployment (blue-green strategy)               │
│    • Pilot rollout to 5 kosans (Week 1)                       │
│    • Monitor metrics: uptime, error rate, latency              │
│    • Gather user feedback (interviews + surveys)              │
│                                                                │
│  Sprint 12 (Week 23-24):                                       │
│    • Expand to remaining 15 kosans                             │
│    • Train property managers (group + 1-on-1)                  │
│    • Monitor adoption rate, usage patterns                     │
│    • Document lessons learned                                  │
│    • Plan scale-up (100+ kosans)                               │
│                                                                │
│ Deliverables:                                                  │
│  • System running in production (stable)                       │
│  • 20 property managers trained & productive                   │
│  • Monitoring dashboard (uptime, performance, errors)          │
│  • User feedback report & iteration backlog                    │
│  • Lessons learned document                                    │
│  • Scale-up plan for next phase (100+ kosans)                 │
│                                                                │
│ Success Criteria:                                              │
│  ✓ System uptime >99.5%                                       │
│  ✓ User adoption >80% (active daily usage)                    │
│  ✓ Feature usage: 70%+ users using price recommendations      │
│  ✓ CSAT (Customer Satisfaction) ≥4.0/5.0                     │
│  ✓ No critical issues in first 30 days                        │
│  ✓ ROI visible: 5%+ revenue lift in pilot kosans               │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Milestone & Release Schedule

```
TIMELINE VIEW:
┌─────────────────────────────────────────────────────────────────┐
│ Month 1    │ Month 2    │ Month 3    │ Month 4    │ Month 5-6 │
│ SETUP      │ DATA+OCR   │ ML MODELS  │ INTEGRATE  │ LAUNCH    │
├─────────────────────────────────────────────────────────────────┤
│  Feb-21    │  Mar-15    │  Apr-15    │  May-15    │  Jun-30   │
│  to        │  to        │  to        │  to        │           │
│  Mar-14    │  Apr-14    │  May-14    │  Jun-14    │           │
├─────────────────────────────────────────────────────────────────┤
│ ✓ Infra    │ ✓ Data     │ ✓ Models   │ ✓ System   │ ✓ Live    │
│   ready    │   ready    │   ready    │   ready    │   Ops     │
│ ✓ Team     │ ✓ OCR OK   │ ✓ ML APIs  │ ✓ Dashboard│ ✓ +20     │
│   up       │ ✓ 1.2K     │ ✓ Monitor  │ ✓ Reports  │   kosans  │
│ ✓ API      │   docs     │ ✓ Bench    │ ✓ Testing  │ ✓ Viable  │
│   skeleton │   OCR'd    │   pass     │ ✓ UAT OK   │   ROI     │
└─────────────────────────────────────────────────────────────────┘

DELIVERY MILESTONES:
1. M1: Infra ready (Feb 28)          → Go/NoGo decision for Phase 2
2. M2: Data collection complete (Mar 31) → 20 properties baseline
3. M3: ML models validated (Apr 30)   → MAPE targets achieved
4. M4: UAT passed (May 30)            → 80% test cases OK
5. M5: Production launch (Jun 15)     → 20 kosans live
6. M6: Full adoption (Jun 30)         → 80% active users
```

---

## 8. RESOURCE PLAN & BUDGET

### 8.1 Team Composition

```
┌─────────────────────────────────────────────────────────────────┐
│ TEAM STRUCTURE (6-month pilot project)                         │
├─────────────────────────────────────────────────────────────────┤

LEADERSHIP (2 people)
├─ 1 × Project Manager (Full-time)
│  Role: Timeline, resources, stakeholder communication
│  Skills: Agile, risk management
│  
└─ 1 × Technical Lead / Solutions Architect (Full-time)
   Role: System design, code review, technology decisions
   Skills: Cloud architecture, ML, database design

BACKEND DEVELOPMENT (3 people)
├─ 1 × Senior Backend Engineer (Full-time)
│  Focus: Auth, APIs, integration, system design
│  Stack: Flask/FastAPI, PostgreSQL
│
├─ 1 × ML Engineer (Full-time)
│  Focus: Model training, feature engineering, monitoring
│  Stack: Python, Scikit-learn, XGBoost
│
└─ 1 × Junior Backend Engineer (Full-time)
   Focus: CRUD APIs, database maintenance, testing
   Stack: Flask, PostgreSQL

FRONTEND DEVELOPMENT (2 people)
├─ 1 × Senior Frontend Engineer (Full-time)
│  Focus: Dashboard, UX/UI, responsive design
│  Stack: React, TypeScript, Tailwind
│
└─ 1 × Junior Frontend Engineer (Full-time)
   Focus: Component library, styling, testing
   Stack: React, CSS

OCR & DATA SPECIALIST (2 people)
├─ 1 × Data Engineer (Full-time)
│  Focus: Data pipeline, OCR implementation, data quality
│  Stack: Python, Tesseract, Airflow
│
└─ 1 × Domain Expert (Part-time, 50%)
   Focus: Business rules, data validation, mapping

QA & TESTING (2 people)
├─ 1 × QA Engineer (Full-time)
│  Focus: Test planning, manual testing, UAT coordination
│
└─ 1 × Automation Engineer (Part-time, 50%)
   Focus: E2E tests, CI/CD, performance testing

OPERATIONS & DEPLOYMENT (1 person)
└─ 1 × DevOps Engineer (Part-time, 50%)
   Focus: CI/CD, monitoring, infrastructure scaling
   Stack: AWS, Docker, Kubernetes

SURVEYOR / DATA COLLECTORS (5 people)
└─ 5 × Field Surveyors (Contract, 2 months)
   Focus: Property data collection, document digitization

TOTAL: 14 FTE (6 months)
```

### 8.2 Budget Estimate

**Development Costs:**

| Category | Unit | Qty | Monthly | 6-Month |
|----------|------|-----|---------|---------|
| **Personnel** | | | | |
| PM + Tech Lead | FTE | 2 | Rp 40M | Rp 240M |
| Backend Engineers | FTE | 3 | Rp 60M | Rp 360M |
| Frontend Engineers | FTE | 2 | Rp 40M | Rp 240M |
| Data/OCR Specialist | FTE | 1.5 | Rp 30M | Rp 180M |
| QA Engineers | FTE | 1.5 | Rp 25M | Rp 150M |
| DevOps (part-time) | FTE | 0.5 | Rp 10M | Rp 60M |
| Field Surveyors | person-month | 10 | Rp 15M | Rp 15M |
| **Subtotal Personnel** | | | | **Rp 1,245M** |
| **Infrastructure** | | | | |
| Cloud (AWS) | month | 6 | Rp 1.2M | Rp 7.2M |
| Tools & Services (GitHub, Slack, etc.) | month | 6 | Rp 2M | Rp 12M |
| Third-party APIs (Gemini) | month | 6 | Rp 0.5M | Rp 3M |
| Security & Compliance (pentest, audit) | - | 2 | Rp 5M | Rp 10M |
| **Subtotal Infrastructure** | | | | **Rp 32.2M** |
| **Miscellaneous** | | | | |
| Equipment (laptops, monitors) | - | - | - | Rp 20M |
| Training & Documentation | - | - | - | Rp 10M |
| Contingency (10%) | - | - | - | Rp 126.7M |
| **Subtotal Misc** | | | | **Rp 156.7M** |
| **TOTAL** | | | | **Rp 1,433.9M** |

**Per-Property Cost (Pilot):** Rp 1,433.9M ÷ 20 = **Rp 71.7M per kosan** (~$4,800 USD)

**Production Cost Projection (100 kosans):**
- Development: Amortized (already spent)
- Infrastructure: Rp 12M/month (~$800 USD/month total)
- **Cost per property:** ~$8-10 USD/month
- **Annual revenue target:** Rp 10-15 juta per kosan (8-15% efficiency gain)
- **ROI breakeven:** 8-10 months

---

## 9. RISK MANAGEMENT

### 9.1 Risk Register

| # | Risk | Probability | Impact | Mitigation |
|---|------|-------------|--------|-----------|
| R1 | Data quality issues (incomplete/incorrect OCR) | HIGH | HIGH | Early pilot with 5 kosans; implement data quality gates; manual review process |
| R2 | Delayed model training (insufficient historical data) | MEDIUM | MEDIUM | Start with available data; use synthetic data if needed; monthly retraining |
| R3 | User adoption resistance | MEDIUM | HIGH | Early user involvement; training; support hotline; CSAT tracking |
| R4 | Security/privacy breach (PII exposure) | LOW | CRITICAL | Encryption at rest/transit; audit logs; quarterly pentest; incident response plan |
| R5 | Key person dependency (ML engineer, PM) | MEDIUM | HIGH | Cross-training; documentation; knowledge transfer sessions |
| R6 | Scope creep (feature requests) | MEDIUM | MEDIUM | Strict change control; prioritize by impact; defer to Phase 2 |
| R7 | Infrastructure cost overrun | LOW | MEDIUM | AWS budgeting alerts; auto-scaling limits; cost optimization review |
| R8 | Model drift / degrading accuracy | MEDIUM | MEDIUM | Weekly monitoring; automated alerts; monthly retraining; fallback rules |
| R9 | Vendor lock-in (AWS dependency) | LOW | MEDIUM | Container-based deployment; multi-cloud capable architecture |
| R10 | Regulatory/compliance issues | LOW | HIGH | Privacy audit; legal review; data handling procedures; GDPR-ready |

### 9.2 Contingency Plans

**Scenario 1: ML Models Not Meeting MAPE Targets**
- Trigger: MAPE >12% after Month 4
- Action: 
  - Expand feature engineering (add external market data)
  - Switch to ensemble models (RF + XGBoost + Neural Network)
  - Collect more historical data (extend data collection)
  - Timeline impact: 2-3 week delay

**Scenario 2: Major Data Quality Issues Discovered**
- Trigger: >20% of OCR extractions require manual correction
- Action:
  - Halt OCR batch processing
  - Audit current data quality
  - Retrain OCR model or switch provider
  - Re-process documents
  - Timeline impact: 2-4 week delay

**Scenario 3: Key Team Member Departure**
- Trigger: Critical role person leaves
- Action:
  - Activate knowledge transfer process (documentation review)
  - Hire contractor/freelancer as interim
  - Redistribute workload to team
  - Timeline impact: 1-2 week disruption

**Scenario 4: Security Incident / Data Breach**
- Trigger: Unauthorized access detected
- Action:
  - Activate incident response (isolate systems, notify users)
  - Forensic analysis
  - System hardening
  - Public disclosure (if required)
  - Timeline impact: 1-2 week delay + potential reputation damage

---

## 10. SUCCESS METRICS & KPI

### 10.1 Business KPIs

| KPI | Baseline | Target | Timeline | Measurement |
|-----|----------|--------|----------|------------|
| **Revenue Uplift** | Rp 0 | +8-15% | Month 6 | Total revenue (20 kosans) vs forecast |
| **Occupancy Rate** | 74% | 78%+ | Month 6 | Avg occupancy %, all properties |
| **Payment Default Rate** | 18% | <8% | Month 6 | Late/overdue payments / total |
| **User Adoption Rate** | 0% | >80% | Month 5 | Active daily users / total users |
| **Time Saved (Admin)** | ~2 hrs/week | ~0.5 hrs/week | Month 4 | Hours spent on manual tasks |

### 10.2 Technical KPIs

| KPI | Target | Measurement |
|-----|--------|-------------|
| **System Uptime** | 99.5% | CloudWatch monitoring |
| **API Response Time (95th %-ile)** | <500ms | APM tools (Datadog) |
| **OCR Accuracy** | >85% character-level | Manual spot-check samples |
| **ML Model MAPE** | Price <10%, Occupancy <15% | Weekly model evaluation |
| **Load Test Result** | 50 users, <5% error rate | JMeter / LoadRunner |
| **Page Load Time** | <3 sec (First Paint) | Lighthouse score |
| **Database Query Time** | <100ms (95th %-ile) | Query performance logs |

### 10.3 User Experience KPIs

| KPI | Target | Measurement |
|-----|--------|-------------|
| **Task Completion Time** | <5 minutes | User testing sessions |
| **Error Rate (trained users)** | <2% | Tracked via analytics |
| **CSAT (Customer Satisfaction)** | ≥4.0/5.0 | Post-task surveys |
| **NPS (Net Promoter Score)** | >40 | Monthly survey |
| **Help Ticket Volume** | <10/month | Support system tracking |

---

## 11. GLOSSARY & DEFINITIONS

| Term | Definition |
|------|-----------|
| **Kosan** | Boarding house / student housing property (Indonesia context) |
| **DSS** | Decision Support System - software that aids decision-making |
| **OCR** | Optical Character Recognition - converting scanned documents to digital text |
| **ML** | Machine Learning - algorithms that learn patterns from data |
| **MAPE** | Mean Absolute Percentage Error - accuracy metric for predictions (lower is better) |
| **MAE** | Mean Absolute Error - average prediction error in absolute terms |
| **Occupancy Rate** | Percentage of occupied rooms out of total rooms |
| **ROI** | Return on Investment - net profit / initial investment |
| **MTTR** | Mean Time To Recovery - average time to fix a system failure |
| **RTO** | Recovery Time Objective - max acceptable downtime |
| **RPO** | Recovery Point Objective - max acceptable data loss |
| **RBAC** | Role-Based Access Control - permission system based on user roles |
| **JWT** | JSON Web Token - secure authentication token format |
| **A/B Test** | Experiment comparing two versions to measure impact |
| **Feature Drift** | When input data distribution changes significantly over time |
| **Soft Delete** | Marking data as deleted without physically removing it (data retention) |
| **Hard Delete** | Permanently removing data from database |
| **UAT** | User Acceptance Testing - testing by actual end-users |
| **SUS** | System Usability Scale - 10-question survey measuring usability (0-100 score) |

---

## 12. APPENDIX & REFERENCES

### 12.1 External Data Sources (Potential Future Integration)

| Data Source | Type | Use Case | Status |
|-------------|------|----------|--------|
| Google Maps API | Location/Distance | Proximity scoring | Possible integration |
| Weather API | Climate data | Seasonal adjustment factor | Future enhancement |
| University Academic Calendar | Holiday/Event | Occupancy seasonality (if near campus) | Manual input initially |
| Competitor Listing Sites | Market pricing | Competitive intelligence | Manual/web scraping |
| Bank Interest Rates | Economic indicator | ROI calculation | Manual input |

### 12.2 Tools & Software References

```
Development:
├─ VS Code (free)
├─ PyCharm Community Edition (free for some)
├─ Git / GitHub (free tier)
├─ Docker Desktop (free)
└─ Postman (free tier)

Testing:
├─ Pytest (unit testing, Python)
├─ Jest (unit testing, JavaScript)
├─ Selenium (E2E testing)
├─ JMeter (load testing)
└─ Burp Suite Community (security scanning, free)

Monitoring & Analytics:
├─ CloudWatch (AWS native)
├─ Datadog (free tier limited)
├─ Sentry (error tracking, free tier)
├─ ELK Stack (Elasticsearch, Logstash, Kibana, open-source)
└─ Grafana (visualization, open-source)

Collaboration:
├─ Slack (free limited tier)
├─ Jira / Linear (project management)
├─ Confluence / Notion (documentation)
└─ Figma (design, free tier)
```

### 12.3 Further Reading & Best Practices

- **ML Model Governance:** MLOps best practices (continuous training, monitoring)
  Reference: https://cloud.google.com/architecture/mlops
  
- **Data Privacy:** GDPR & data protection
  Reference: https://ec.europa.eu/info/law/law-topic/data-protection
  
- **Cloud Architecture:** AWS Well-Architected Framework
  Reference: https://aws.amazon.com/architecture/well-architected/
  
- **API Design:** RESTful API best practices
  Reference: https://restfulapi.net/
  
- **UI/UX:** Human-Centered Design for fintech
  Reference: Nielsen Norman Group research

---

**END OF DOCUMENT**

**Document Status:** ✅ Professional Draft v2.0  
**Last Updated:** 21 Februari 2026  
**Next Review:** Month 2 (Mar 2026) - Phase gate decision  
**Approval Sign-Off:** [Awaiting stakeholder review]
