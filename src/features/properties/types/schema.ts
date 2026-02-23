import { z } from 'zod';

export const propertySchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100).transform(v => v.trim()),
  property_type: z.enum(['kost', 'kontrakan']),
  address: z.string().min(5, 'Alamat wajib diisi').max(255).transform(v => v.trim()),
  city: z.string().min(2, 'Kota wajib diisi').max(100),
  province: z.string().min(2, 'Provinsi wajib diisi').max(100),
  postal_code: z.string().max(10).optional(),
  description: z.string().max(1000).optional(),
  amenities: z.array(z.string()).optional(),
  guardian_name: z.string().max(100).optional().nullable(),
  guardian_phone: z.string().max(20).optional().nullable(),
  marketing_cost: z.coerce.number().min(0).optional().nullable(),
  construction_year: z.coerce.number().min(1900).max(2100).optional().nullable(),
  floor_count: z.coerce.number().int().min(1).max(100).default(1),
  building_condition: z.string().optional().nullable(),
  land_ownership: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

export type PropertyFormData = z.infer<typeof propertySchema>;

export const propertyTypes = [
  { value: 'kost', label: 'Kost' },
  { value: 'kontrakan', label: 'Kontrakan / Ruko' },
] as const;

export const additionalCostSchema = z.object({
  name: z.string().min(1),
  amount: z.coerce.number().min(0),
});

export const unitSchema = z.object({
  property_id: z.string().min(1, 'Pilih properti'),
  unit_number: z.string().min(1, 'Nomor unit wajib diisi').transform(v => v.trim()),
  unit_type: z.string().min(1, 'Tipe unit wajib diisi'),
  floor: z.coerce.number().int().min(0).nullable().optional(),
  size_sqm: z.coerce.number().min(0).max(10000).nullable().optional(),
  rent_amount: z.coerce.number().min(1, 'Harga sewa harus lebih dari 0'),
  deposit_amount: z.coerce.number().min(0).nullable().optional(),
  status: z.enum(['available', 'occupied', 'maintenance', 'reserved']),
  description: z.string().optional().nullable(),
  photos: z.array(z.string()).default([]),
  amenities: z.array(z.string()).optional().default([]),
  occupancy_type: z.string().default('single'),
  electricity_included: z.boolean().default(false),
  electricity_cost: z.coerce.number().min(0).default(0),
  electricity_cost_type: z.string().default('flat'),
  water_included: z.boolean().default(false),
  water_cost: z.coerce.number().min(0).default(0),
  water_cost_type: z.string().default('flat'),
  wifi_included: z.boolean().default(false),
  wifi_speed_mbps: z.coerce.number().min(0).nullable().optional(),
  wifi_cost_sharing: z.string().default('included'),
  additional_costs: z.array(additionalCostSchema).default([]),
});

export type UnitFormData = z.infer<typeof unitSchema>;
