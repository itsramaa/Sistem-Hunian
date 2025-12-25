
-- =============================================
-- SEED DATA: Reference Tables (No User Dependencies)
-- =============================================

-- 1. SUBSCRIPTION TIERS
-- Clear existing and insert fresh data
DELETE FROM subscription_tiers WHERE name IN ('free', 'basic', 'pro', 'enterprise');

INSERT INTO subscription_tiers (id, name, display_name, description, price_monthly, price_yearly, max_properties, max_units, max_tenants, features, is_active, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'free', 'Free', 'Paket gratis untuk memulai', 0, 0, 1, 5, 5, 
   '["1 properti", "5 unit maksimal", "5 tenant maksimal", "Laporan dasar", "Email support"]'::jsonb, 
   true, 1),
  ('00000000-0000-0000-0000-000000000002', 'basic', 'Basic', 'Cocok untuk pemilik kost kecil', 99000, 990000, 3, 20, 30, 
   '["3 properti", "20 unit maksimal", "30 tenant maksimal", "Laporan lengkap", "Marketplace access", "Priority email support"]'::jsonb, 
   true, 2),
  ('00000000-0000-0000-0000-000000000003', 'pro', 'Pro', 'Untuk bisnis properti berkembang', 249000, 2490000, 10, 100, 150, 
   '["10 properti", "100 unit maksimal", "150 tenant maksimal", "Analytics dashboard", "AI Assistant", "Disbursement otomatis", "WhatsApp notifications", "Phone support"]'::jsonb, 
   true, 3),
  ('00000000-0000-0000-0000-000000000004', 'enterprise', 'Enterprise', 'Solusi lengkap untuk perusahaan besar', 499000, 4990000, -1, -1, -1, 
   '["Unlimited properti", "Unlimited unit", "Unlimited tenant", "Custom branding", "API access", "Dedicated account manager", "SLA guarantee", "Custom integrations"]'::jsonb, 
   true, 4)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  max_properties = EXCLUDED.max_properties,
  max_units = EXCLUDED.max_units,
  max_tenants = EXCLUDED.max_tenants,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- 2. CHATBOT KNOWLEDGE BASE
DELETE FROM chatbot_knowledge;

INSERT INTO chatbot_knowledge (category, question, answer, keywords, is_active) VALUES
-- Pembayaran
('payment', 'Bagaimana cara membayar sewa?', 
 'Anda dapat membayar sewa melalui beberapa metode:\n1. Transfer Bank (BCA, Mandiri, BNI, BRI)\n2. Virtual Account\n3. E-Wallet (GoPay, OVO, DANA)\n4. QRIS\n\nKunjungi menu Invoices, pilih tagihan yang ingin dibayar, lalu klik "Bayar Sekarang".', 
 ARRAY['bayar', 'sewa', 'transfer', 'payment', 'tagihan'], true),

('payment', 'Kapan jatuh tempo pembayaran sewa?', 
 'Jatuh tempo pembayaran sewa biasanya tanggal 1 setiap bulan, kecuali ditentukan lain dalam kontrak Anda. Anda akan menerima notifikasi H-7 dan H-3 sebelum jatuh tempo.', 
 ARRAY['jatuh tempo', 'deadline', 'tanggal bayar', 'due date'], true),

('payment', 'Apa yang terjadi jika telat bayar?', 
 'Jika pembayaran melewati jatuh tempo:\n1. H+1 - H+7: Grace period (tidak ada denda)\n2. H+8 dst: Dikenakan denda keterlambatan sesuai ketentuan kontrak\n\nJika mengalami kesulitan, hubungi pemilik properti untuk diskusi payment plan.', 
 ARRAY['telat', 'denda', 'late', 'terlambat', 'penalty'], true),

-- Maintenance
('maintenance', 'Bagaimana cara melaporkan kerusakan?', 
 'Untuk melaporkan kerusakan:\n1. Buka menu Maintenance\n2. Klik "Lapor Kerusakan Baru"\n3. Pilih kategori (listrik, air, AC, dll)\n4. Jelaskan masalah dan upload foto\n5. Pilih tingkat urgensi\n\nTim maintenance akan merespons sesuai SLA.', 
 ARRAY['rusak', 'maintenance', 'lapor', 'kerusakan', 'perbaikan'], true),

('maintenance', 'Berapa lama maintenance ditangani?', 
 'Waktu penanganan berdasarkan prioritas:\n- Urgent (darurat): 4 jam\n- High (penting): 24 jam\n- Medium (normal): 72 jam\n- Low (tidak mendesak): 7 hari\n\nAnda dapat memantau status di menu Maintenance.', 
 ARRAY['lama', 'waktu', 'sla', 'proses', 'handling'], true),

-- Kontrak
('contract', 'Bagaimana cara memperpanjang kontrak?', 
 'Untuk perpanjangan kontrak:\n1. Buka menu Contracts\n2. Pilih kontrak yang akan berakhir\n3. Klik "Ajukan Perpanjangan"\n4. Pemilik akan mengirim kontrak baru untuk ditandatangani\n\nDisarankan mengajukan 1 bulan sebelum kontrak berakhir.', 
 ARRAY['perpanjang', 'extend', 'renewal', 'kontrak baru'], true),

('contract', 'Bagaimana jika ingin pindah sebelum kontrak habis?', 
 'Untuk early termination:\n1. Buka menu Contracts\n2. Klik "Ajukan Pengakhiran Dini"\n3. Isi alasan dan tanggal pindah\n4. Tunggu persetujuan pemilik\n\nPerhatikan: Mungkin dikenakan penalti sesuai ketentuan kontrak.', 
 ARRAY['pindah', 'keluar', 'early termination', 'batal kontrak'], true),

-- Marketplace
('marketplace', 'Apa itu Marketplace?', 
 'Marketplace adalah fitur untuk memesan layanan dari vendor terpercaya:\n- Laundry\n- Cleaning service\n- Catering/makanan\n- Jasa perbaikan\n\nSemua vendor sudah diverifikasi dan pembayaran dijamin aman melalui sistem escrow.', 
 ARRAY['marketplace', 'vendor', 'layanan', 'service'], true),

('marketplace', 'Bagaimana cara memesan di Marketplace?', 
 'Cara memesan:\n1. Buka menu Marketplace\n2. Pilih kategori layanan\n3. Pilih vendor dan produk/jasa\n4. Tentukan jadwal (jika diperlukan)\n5. Konfirmasi pesanan\n\nAnda akan menerima notifikasi status pesanan.', 
 ARRAY['pesan', 'order', 'beli', 'booking'], true),

-- Deposit
('deposit', 'Kapan deposit dikembalikan?', 
 'Deposit dikembalikan setelah:\n1. Kontrak berakhir\n2. Move-out inspection selesai\n3. Tidak ada kerusakan atau tunggakan\n\nProses refund: 7-14 hari kerja setelah inspection. Potongan (jika ada) akan dijelaskan secara detail.', 
 ARRAY['deposit', 'refund', 'uang jaminan', 'kembalikan'], true),

-- Forum
('forum', 'Apa itu Forum Komunitas?', 
 'Forum adalah tempat untuk:\n- Berdiskusi dengan penghuni lain\n- Berbagi informasi & tips\n- Mengajukan pertanyaan\n- Koordinasi kegiatan bersama\n\nGunakan dengan bijak dan patuhi aturan komunitas.', 
 ARRAY['forum', 'komunitas', 'diskusi', 'chat'], true),

-- Referral
('referral', 'Bagaimana program referral bekerja?', 
 'Program referral:\n1. Bagikan kode referral Anda\n2. Teman mendaftar dengan kode tersebut\n3. Teman mendapat diskon sewa\n4. Anda mendapat reward/komisi\n\nCek kode referral Anda di menu Referrals.', 
 ARRAY['referral', 'ajak teman', 'kode', 'reward', 'bonus'], true),

-- Account
('account', 'Bagaimana cara update profil?', 
 'Untuk update profil:\n1. Buka menu Profile\n2. Klik "Edit"\n3. Update informasi yang diinginkan\n4. Klik "Simpan"\n\nPastikan nomor telepon dan email selalu up-to-date untuk menerima notifikasi.', 
 ARRAY['profil', 'update', 'edit', 'ubah data'], true),

('account', 'Bagaimana cara ganti password?', 
 'Untuk ganti password:\n1. Buka menu Settings\n2. Pilih "Keamanan"\n3. Klik "Ubah Password"\n4. Masukkan password lama dan baru\n5. Konfirmasi perubahan', 
 ARRAY['password', 'kata sandi', 'ganti', 'lupa'], true);

-- 3. PLATFORM CONFIGURATION (if table exists)
-- This seeds default platform settings
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'platform_config') THEN
    INSERT INTO platform_config (key, value, description) VALUES
      ('platform_fee_percentage', '2.5', 'Platform fee percentage for rent payments'),
      ('gateway_fee_percentage', '1.5', 'Payment gateway fee percentage'),
      ('min_disbursement_amount', '100000', 'Minimum amount for disbursement (IDR)'),
      ('grace_period_days', '7', 'Default grace period for rent payments'),
      ('late_fee_percentage', '5', 'Default late fee percentage'),
      ('referral_reward_amount', '50000', 'Referral reward amount (IDR)'),
      ('referral_discount_amount', '100000', 'Referral discount for new users (IDR)'),
      ('trial_period_days', '14', 'Trial period for new merchants')
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
  END IF;
END $$;
