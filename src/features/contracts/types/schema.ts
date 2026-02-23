import { z } from 'zod';

export const paymentFrequencyOptions = [
  { value: 'monthly', label: 'Bulanan' },
  { value: 'semester', label: 'Per Semester (6 Bulan)' },
  { value: 'annual', label: 'Tahunan' },
] as const;

export const contractSchema = z.object({
  unit_id: z.string().min(1, 'Pilih unit terlebih dahulu'),
  tenant_user_id: z.string().min(1, 'Pilih penyewa terlebih dahulu'),
  start_date: z.string().min(1, 'Tanggal mulai wajib diisi'),
  end_date: z.string().min(1, 'Tanggal berakhir wajib diisi'),
  rent_amount: z.coerce.number().positive('Harga sewa harus lebih dari 0'),
  deposit_amount: z.coerce.number().min(0, 'Deposit tidak boleh negatif'),
  payment_frequency: z.enum(['monthly', 'semester', 'annual']).default('monthly'),
  billing_day: z.coerce.number().min(1).max(28).optional(),
  terms: z.string().max(10000, 'Syarat & ketentuan tidak boleh lebih dari 10.000 karakter').optional(),
}).refine((data) => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return end > start;
}, {
  message: 'Tanggal berakhir harus setelah tanggal mulai',
  path: ['end_date'],
}).refine((data) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(data.start_date);
  return start >= today;
}, {
  message: 'Tanggal mulai tidak boleh di masa lalu',
  path: ['start_date'],
});

export type ContractFormData = z.infer<typeof contractSchema>;
