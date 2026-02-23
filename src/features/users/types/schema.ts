import { z } from 'zod';

const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;

export const invitationSchema = z.object({
  property_id: z.string().min(1, 'Pilih properti'),
  email: z.string().email('Alamat email tidak valid').max(255, 'Email terlalu panjang'),
  phone: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true;
    return phoneRegex.test(val.replace(/\s|-/g, ''));
  }, 'Nomor telepon tidak valid (contoh: +628123456789)'),
});

export type InvitationFormData = z.infer<typeof invitationSchema>;
