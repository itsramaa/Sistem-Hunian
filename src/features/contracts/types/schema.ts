import { z } from 'zod';

export const contractSchema = z.object({
  unit_id: z.string().min(1, 'Please select a unit'),
  tenant_user_id: z.string().min(1, 'Please select a tenant'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  rent_amount: z.coerce.number().positive('Rent must be positive'),
  deposit_amount: z.coerce.number().min(0, 'Deposit cannot be negative'),
  billing_day: z.coerce.number().min(1).max(28).optional(),
  terms: z.string().max(10000, 'Terms cannot exceed 10,000 characters').optional(),
}).refine((data) => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return end > start;
}, {
  message: 'End date must be after start date',
  path: ['end_date'],
}).refine((data) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(data.start_date);
  return start >= today;
}, {
  message: 'Start date cannot be in the past',
  path: ['start_date'],
});

export type ContractFormData = z.infer<typeof contractSchema>;
