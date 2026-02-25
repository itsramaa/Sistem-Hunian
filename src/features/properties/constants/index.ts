export const PROPERTY_TYPES = [
  { value: 'kost', label: 'Kost' },
  { value: 'kontrakan', label: 'Kontrakan / Ruko' },
] as const;

export const BUILDING_CONDITIONS = [
  { value: 'baru', label: 'Baru' },
  { value: 'baik', label: 'Baik' },
  { value: 'cukup', label: 'Cukup Baik' },
  { value: 'perlu_renovasi', label: 'Perlu Renovasi' },
] as const;

export const LAND_OWNERSHIP_OPTIONS = [
  { value: 'milik_sendiri', label: 'Milik Sendiri' },
  { value: 'sewa_tanah', label: 'Sewa Tanah' },
] as const;

export const OCCUPANCY_TYPE_OPTIONS = [
  { value: 'single', label: 'Single (1 orang)' },
  { value: 'sharing', label: 'Sharing (2+ orang)' },
] as const;

export const COST_TYPE_OPTIONS = [
  { value: 'flat', label: 'Flat / Bulanan' },
  { value: 'per_usage', label: 'Per Pemakaian' },
  { value: 'bayar_sendiri', label: 'Bayar Sendiri' },
] as const;

export const WIFI_SHARING_OPTIONS = [
  { value: 'included', label: 'Sudah Termasuk Sewa' },
  { value: 'patungan', label: 'Patungan' },
] as const;

export const SALARY_FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Bulanan' },
  { value: 'weekly', label: 'Mingguan' },
  { value: 'daily', label: 'Harian' },
] as const;
