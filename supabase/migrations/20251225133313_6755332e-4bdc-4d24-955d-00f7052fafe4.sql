-- Create provinces table for Indonesia
CREATE TABLE IF NOT EXISTS public.provinces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

-- Create cities table for Indonesia  
CREATE TABLE IF NOT EXISTS public.cities (
    id TEXT PRIMARY KEY,
    province_id TEXT NOT NULL REFERENCES public.provinces(id) ON DELETE CASCADE,
    name TEXT NOT NULL
);

-- Enable RLS on provinces and cities
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read provinces and cities (reference data)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'provinces' AND policyname = 'Anyone can view provinces') THEN
    CREATE POLICY "Anyone can view provinces" ON public.provinces FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cities' AND policyname = 'Anyone can view cities') THEN
    CREATE POLICY "Anyone can view cities" ON public.cities FOR SELECT USING (true);
  END IF;
END $$;

-- Create index for cities lookup
CREATE INDEX IF NOT EXISTS idx_cities_province_id ON public.cities(province_id);

-- Insert Indonesia Provinces
INSERT INTO public.provinces (id, name) VALUES
('11', 'Aceh'),
('12', 'Sumatera Utara'),
('13', 'Sumatera Barat'),
('14', 'Riau'),
('15', 'Jambi'),
('16', 'Sumatera Selatan'),
('17', 'Bengkulu'),
('18', 'Lampung'),
('19', 'Kepulauan Bangka Belitung'),
('21', 'Kepulauan Riau'),
('31', 'DKI Jakarta'),
('32', 'Jawa Barat'),
('33', 'Jawa Tengah'),
('34', 'DI Yogyakarta'),
('35', 'Jawa Timur'),
('36', 'Banten'),
('51', 'Bali'),
('52', 'Nusa Tenggara Barat'),
('53', 'Nusa Tenggara Timur'),
('61', 'Kalimantan Barat'),
('62', 'Kalimantan Tengah'),
('63', 'Kalimantan Selatan'),
('64', 'Kalimantan Timur'),
('65', 'Kalimantan Utara'),
('71', 'Sulawesi Utara'),
('72', 'Sulawesi Tengah'),
('73', 'Sulawesi Selatan'),
('74', 'Sulawesi Tenggara'),
('75', 'Gorontalo'),
('76', 'Sulawesi Barat'),
('81', 'Maluku'),
('82', 'Maluku Utara'),
('91', 'Papua'),
('92', 'Papua Barat')
ON CONFLICT (id) DO NOTHING;

-- Insert Major Cities
INSERT INTO public.cities (id, province_id, name) VALUES
-- DKI Jakarta
('3101', '31', 'Kepulauan Seribu'),
('3171', '31', 'Jakarta Selatan'),
('3172', '31', 'Jakarta Timur'),
('3173', '31', 'Jakarta Pusat'),
('3174', '31', 'Jakarta Barat'),
('3175', '31', 'Jakarta Utara'),
-- Jawa Barat
('3201', '32', 'Kabupaten Bogor'),
('3204', '32', 'Kabupaten Bandung'),
('3215', '32', 'Kabupaten Karawang'),
('3216', '32', 'Kabupaten Bekasi'),
('3271', '32', 'Kota Bogor'),
('3273', '32', 'Kota Bandung'),
('3275', '32', 'Kota Bekasi'),
('3276', '32', 'Kota Depok'),
('3277', '32', 'Kota Cimahi'),
-- Banten
('3603', '36', 'Kabupaten Tangerang'),
('3671', '36', 'Kota Tangerang'),
('3674', '36', 'Kota Tangerang Selatan'),
-- DI Yogyakarta
('3404', '34', 'Kabupaten Sleman'),
('3471', '34', 'Kota Yogyakarta'),
('3402', '34', 'Kabupaten Bantul'),
-- Jawa Tengah
('3374', '33', 'Kota Semarang'),
('3372', '33', 'Kota Surakarta'),
-- Jawa Timur
('3578', '35', 'Kota Surabaya'),
('3573', '35', 'Kota Malang'),
('3515', '35', 'Kabupaten Sidoarjo'),
-- Bali
('5171', '51', 'Kota Denpasar'),
('5103', '51', 'Kabupaten Badung'),
('5104', '51', 'Kabupaten Gianyar')
ON CONFLICT (id) DO NOTHING;