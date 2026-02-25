import { z } from 'zod';

export const addTenantSchema = z.object({
  // Step 1: Create Account
  full_name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  email: z.string().email('Email tidak valid').max(255),
  password: z.string().min(12, 'Password minimal 12 karakter'),
  phone: z.string().max(20).optional(),
  
  // Step 2: Unit Selection
  property_id: z.string().uuid('Pilih properti'),
  unit_id: z.string().uuid('Pilih unit'),
  
  // Step 3: Contract Details
  start_date: z.string().min(1, 'Tanggal mulai wajib diisi'),
  end_date: z.string().min(1, 'Tanggal selesai wajib diisi'),
  rent_amount: z.number().min(1, 'Harga sewa harus lebih dari 0'),
  deposit_amount: z.number().min(0).default(0),
  billing_day: z.number().min(1).max(28).default(1),
}).refine((data) => {
  if (data.start_date && data.end_date) {
    return new Date(data.end_date) > new Date(data.start_date);
  }
  return true;
}, {
  message: 'Tanggal selesai harus setelah tanggal mulai',
  path: ['end_date'],
});

export type AddTenantFormData = z.infer<typeof addTenantSchema>;
