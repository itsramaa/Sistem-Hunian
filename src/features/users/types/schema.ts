import { z } from 'zod';

const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;

export const invitationSchema = z.object({
  unit_id: z.string().min(1, 'Please select a unit'),
  email: z.string().email('Invalid email address').max(255, 'Email too long'),
  phone: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true;
    return phoneRegex.test(val.replace(/\s|-/g, ''));
  }, 'Invalid Indonesian phone number (e.g., +628123456789)'),
});

export type InvitationFormData = z.infer<typeof invitationSchema>;
