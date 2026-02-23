import { z } from 'zod';

export const addTenantSchema = z.object({
  // Step 1: Tenant Info
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().max(20).optional(),
  
  // Step 2: Unit Selection
  property_id: z.string().uuid('Select a property'),
  unit_id: z.string().uuid('Select a unit'),
  
  // Step 3: Contract Details
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
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
