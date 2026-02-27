
-- ===== UTILITY BILLING TABLES =====

-- Utility settings per property
CREATE TABLE public.utility_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  utility_type text NOT NULL,
  allocation_method text NOT NULL DEFAULT 'equal_split',
  rate_per_unit numeric,
  fixed_monthly numeric,
  weight_config jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(property_id, utility_type)
);

CREATE INDEX idx_utility_settings_merchant ON public.utility_settings(merchant_id);
CREATE INDEX idx_utility_settings_property ON public.utility_settings(property_id);

CREATE TRIGGER update_utility_settings_updated_at
  BEFORE UPDATE ON public.utility_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.utility_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants manage own utility settings"
  ON public.utility_settings FOR ALL
  TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- Meter readings per unit
CREATE TABLE public.utility_meter_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  utility_type text NOT NULL,
  reading_date date NOT NULL,
  previous_reading numeric NOT NULL DEFAULT 0,
  current_reading numeric NOT NULL DEFAULT 0,
  usage numeric GENERATED ALWAYS AS (current_reading - previous_reading) STORED,
  rate_per_unit numeric NOT NULL DEFAULT 0,
  photo_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_meter_readings_merchant ON public.utility_meter_readings(merchant_id);
CREATE INDEX idx_meter_readings_property ON public.utility_meter_readings(property_id);
CREATE INDEX idx_meter_readings_unit ON public.utility_meter_readings(unit_id);
CREATE INDEX idx_meter_readings_date ON public.utility_meter_readings(reading_date);

ALTER TABLE public.utility_meter_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants manage own meter readings"
  ON public.utility_meter_readings FOR ALL
  TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- Utility charges per tenant per period
CREATE TABLE public.utility_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES public.contracts(id),
  tenant_user_id uuid,
  billing_period text NOT NULL,
  utility_type text NOT NULL,
  allocation_method text NOT NULL,
  total_cost numeric NOT NULL DEFAULT 0,
  unit_share numeric NOT NULL DEFAULT 0,
  quantity numeric,
  rate numeric,
  invoice_id uuid REFERENCES public.invoices(id),
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_utility_charges_merchant ON public.utility_charges(merchant_id);
CREATE INDEX idx_utility_charges_property ON public.utility_charges(property_id);
CREATE INDEX idx_utility_charges_unit ON public.utility_charges(unit_id);
CREATE INDEX idx_utility_charges_period ON public.utility_charges(billing_period);
CREATE INDEX idx_utility_charges_invoice ON public.utility_charges(invoice_id);

ALTER TABLE public.utility_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants manage own utility charges"
  ON public.utility_charges FOR ALL
  TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Tenants read own utility charges"
  ON public.utility_charges FOR SELECT
  TO authenticated
  USING (tenant_user_id = auth.uid());

-- ===== DOCUMENT TEMPLATES TABLE =====

CREATE TABLE public.document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid REFERENCES public.merchants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  content text NOT NULL DEFAULT '',
  variables jsonb DEFAULT '[]'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  is_system boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_document_templates_merchant ON public.document_templates(merchant_id);
CREATE INDEX idx_document_templates_category ON public.document_templates(category);

CREATE TRIGGER update_document_templates_updated_at
  BEFORE UPDATE ON public.document_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants manage own templates"
  ON public.document_templates FOR ALL
  TO authenticated
  USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
    OR is_system = true
  );

CREATE POLICY "System templates readable by all"
  ON public.document_templates FOR SELECT
  TO authenticated
  USING (is_system = true);

-- Seed system templates
INSERT INTO public.document_templates (merchant_id, name, description, category, content, variables, is_system, is_default) VALUES
(NULL, 'Kontrak Sewa Kost Standar', 'Template kontrak sewa kost standar Indonesia', 'lease_contract',
'PERJANJIAN SEWA MENYEWA KAMAR KOST

Yang bertanda tangan di bawah ini:

Pihak Pertama (Pemilik):
Nama: {{owner_name}}
Alamat: {{property_address}}

Pihak Kedua (Penyewa):
Nama: {{tenant_name}}
No. KTP: {{tenant_id_number}}
No. HP: {{tenant_phone}}

Telah sepakat mengadakan perjanjian sewa kamar kost dengan ketentuan sebagai berikut:

Pasal 1 - OBJEK SEWA
Kamar nomor {{unit_number}} di {{property_name}}, beralamat di {{property_address}}.

Pasal 2 - JANGKA WAKTU
Mulai: {{start_date}}
Berakhir: {{end_date}}

Pasal 3 - BIAYA SEWA
Biaya sewa sebesar {{rent_amount}} per bulan.
Deposit sebesar {{deposit_amount}}.

Pasal 4 - PEMBAYARAN
Pembayaran dilakukan setiap tanggal {{billing_day}} setiap bulannya.

Pasal 5 - PERATURAN
{{house_rules}}

Demikian perjanjian ini dibuat dalam rangkap 2 (dua) yang masing-masing mempunyai kekuatan hukum yang sama.

{{city}}, {{current_date}}

Pihak Pertama                    Pihak Kedua
{{owner_name}}                   {{tenant_name}}',
'[{"name":"owner_name","label":"Nama Pemilik"},{"name":"tenant_name","label":"Nama Penyewa"},{"name":"tenant_id_number","label":"No KTP Penyewa"},{"name":"tenant_phone","label":"No HP Penyewa"},{"name":"property_name","label":"Nama Properti"},{"name":"property_address","label":"Alamat Properti"},{"name":"unit_number","label":"Nomor Kamar"},{"name":"start_date","label":"Tanggal Mulai"},{"name":"end_date","label":"Tanggal Berakhir"},{"name":"rent_amount","label":"Biaya Sewa"},{"name":"deposit_amount","label":"Deposit"},{"name":"billing_day","label":"Tanggal Bayar"},{"name":"house_rules","label":"Peraturan Kost"},{"name":"city","label":"Kota"},{"name":"current_date","label":"Tanggal Hari Ini"}]'::jsonb,
true, false),

(NULL, 'Peraturan Kost', 'Template peraturan umum kost', 'house_rules',
'PERATURAN PENGHUNI KOST
{{property_name}}

1. Jam malam: {{curfew_time}}
2. Tamu menginap harus izin pengelola, maksimal {{max_guest_nights}} malam/bulan
3. Dilarang membawa hewan peliharaan kecuali mendapat izin tertulis
4. Menjaga kebersihan kamar dan area bersama
5. Dilarang merusak fasilitas, kerusakan ditanggung penyewa
6. Pembayaran tepat waktu, keterlambatan dikenakan denda {{late_fee}}
7. Penghuni wajib melapor jika ada kerusakan fasilitas
8. Dilarang merokok di dalam kamar dan area tertutup
9. Volume musik/suara dijaga agar tidak mengganggu penghuni lain
10. Parkir kendaraan di area yang disediakan

Pengelola: {{guardian_name}} ({{guardian_phone}})',
'[{"name":"property_name","label":"Nama Properti"},{"name":"curfew_time","label":"Jam Malam"},{"name":"max_guest_nights","label":"Maks Tamu Menginap"},{"name":"late_fee","label":"Denda Keterlambatan"},{"name":"guardian_name","label":"Nama Pengelola"},{"name":"guardian_phone","label":"No HP Pengelola"}]'::jsonb,
true, false),

(NULL, 'Checklist Move-In', 'Checklist kondisi kamar saat masuk', 'move_in_checklist',
'CHECKLIST MOVE-IN
{{property_name}} - Kamar {{unit_number}}
Tanggal: {{inspection_date}}
Penyewa: {{tenant_name}}

KONDISI KAMAR:
[ ] Dinding - Kondisi: ___
[ ] Lantai - Kondisi: ___
[ ] Pintu & Kunci - Kondisi: ___
[ ] Jendela - Kondisi: ___
[ ] Lampu - Kondisi: ___
[ ] AC/Kipas - Kondisi: ___
[ ] Kamar Mandi - Kondisi: ___
[ ] Furniture - Kondisi: ___

METER AWAL:
Listrik: {{electricity_meter}} kWh
Air: {{water_meter}} m3

CATATAN TAMBAHAN:
___

Pemilik: ___          Penyewa: ___',
'[{"name":"property_name","label":"Nama Properti"},{"name":"unit_number","label":"Nomor Kamar"},{"name":"inspection_date","label":"Tanggal Inspeksi"},{"name":"tenant_name","label":"Nama Penyewa"},{"name":"electricity_meter","label":"Meter Listrik"},{"name":"water_meter","label":"Meter Air"}]'::jsonb,
true, false),

(NULL, 'Surat Peringatan Pembayaran', 'Template surat peringatan pembayaran', 'payment_reminder',
'SURAT PERINGATAN PEMBAYARAN

Kepada Yth,
{{tenant_name}}
Penghuni Kamar {{unit_number}}
{{property_name}}

Dengan hormat,

Melalui surat ini kami mengingatkan bahwa pembayaran sewa kamar Anda untuk periode {{billing_period}} sebesar {{amount_due}} telah jatuh tempo pada tanggal {{due_date}}.

Hingga saat ini, kami belum menerima pembayaran tersebut. Mohon segera melakukan pembayaran paling lambat {{deadline_date}}.

Apabila terdapat kendala, silakan menghubungi pengelola untuk diskusi lebih lanjut.

Hormat kami,
{{owner_name}}
{{property_name}}',
'[{"name":"tenant_name","label":"Nama Penyewa"},{"name":"unit_number","label":"Nomor Kamar"},{"name":"property_name","label":"Nama Properti"},{"name":"billing_period","label":"Periode Tagihan"},{"name":"amount_due","label":"Jumlah Tagihan"},{"name":"due_date","label":"Tanggal Jatuh Tempo"},{"name":"deadline_date","label":"Batas Pembayaran"},{"name":"owner_name","label":"Nama Pemilik"}]'::jsonb,
true, false),

(NULL, 'Surat Pemberitahuan Pengakhiran', 'Template surat pemberitahuan pengakhiran kontrak', 'eviction_notice',
'SURAT PEMBERITAHUAN PENGAKHIRAN SEWA

Kepada Yth,
{{tenant_name}}
Penghuni Kamar {{unit_number}}
{{property_name}}

Dengan hormat,

Melalui surat ini kami memberitahukan bahwa perjanjian sewa kamar kost Anda akan berakhir pada tanggal {{end_date}}.

Alasan: {{termination_reason}}

Mohon untuk melakukan pengosongan kamar paling lambat tanggal {{move_out_date}}.

Prosedur move-out:
1. Bersihkan kamar dan kembalikan kunci
2. Inspeksi bersama pengelola
3. Pengembalian deposit setelah inspeksi (dikurangi biaya kerusakan jika ada)

Hormat kami,
{{owner_name}}',
'[{"name":"tenant_name","label":"Nama Penyewa"},{"name":"unit_number","label":"Nomor Kamar"},{"name":"property_name","label":"Nama Properti"},{"name":"end_date","label":"Tanggal Berakhir"},{"name":"termination_reason","label":"Alasan"},{"name":"move_out_date","label":"Tanggal Move-Out"},{"name":"owner_name","label":"Nama Pemilik"}]'::jsonb,
true, false);
