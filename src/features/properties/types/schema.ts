import { z } from 'zod';

export const propertySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  property_type: z.enum(['kost', 'apartment', 'house', 'kontrakan', 'ruko']),
  address: z.string().min(5, 'Address is required').max(255),
  city: z.string().min(2, 'City is required').max(100),
  province: z.string().min(2, 'Province is required').max(100),
  postal_code: z.string().max(10).optional(),
  description: z.string().max(1000).optional(),
  amenities: z.array(z.string()).optional(),
});

export type PropertyFormData = z.infer<typeof propertySchema>;

export const propertyTypes = [
  { value: 'kost', label: 'Kost' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'kontrakan', label: 'Kontrakan' },
  { value: 'ruko', label: 'Ruko' },
] as const;

export const unitSchema = z.object({
  property_id: z.string().min(1, 'Please select a property'),
  unit_number: z.string().min(1, 'Unit number is required'),
  unit_type: z.string().min(1, 'Unit type is required'),
  floor: z.coerce.number().int().min(0).nullable().optional(),
  size_sqm: z.coerce.number().min(0).max(10000).nullable().optional(),
  rent_amount: z.coerce.number().min(0, 'Rent amount cannot be negative'),
  deposit_amount: z.coerce.number().min(0).nullable().optional(),
  status: z.enum(['available', 'occupied', 'maintenance', 'reserved']),
  description: z.string().optional().nullable(),
  photos: z.array(z.string()).default([]),
});

export type UnitFormData = z.infer<typeof unitSchema>;

