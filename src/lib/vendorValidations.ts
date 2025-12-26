import { z } from 'zod';

/**
 * Vendor-specific validation schemas
 */

// Product validation schema
export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional().nullable(),
  category: z.string().min(1, 'Category is required'),
  price: z.number().min(1, 'Price must be greater than 0'),
  unit: z.string().default('unit'),
  is_available: z.boolean().default(true),
  min_order: z.number().min(1).default(1),
  estimated_duration: z.string().optional().nullable(),
  photos: z.array(z.string()).optional().nullable(),
  stock: z.number().min(0).optional().nullable(),
  promo_price: z.number().min(0).optional().nullable(),
  promo_start: z.string().optional().nullable(),
  promo_end: z.string().optional().nullable(),
}).refine((data) => {
  // Promo price must be less than regular price
  if (data.promo_price != null && data.promo_price >= data.price) {
    return false;
  }
  return true;
}, {
  message: 'Promo price must be less than regular price',
  path: ['promo_price'],
}).refine((data) => {
  // If promo_end and promo_start exist, end must be after start
  if (data.promo_start && data.promo_end) {
    return new Date(data.promo_end) > new Date(data.promo_start);
  }
  return true;
}, {
  message: 'Promo end date must be after start date',
  path: ['promo_end'],
});

// Bank account validation schema
export const bankAccountSchema = z.object({
  bank_name: z.string().min(1, 'Bank name is required'),
  account_name: z.string().min(1, 'Account holder name is required'),
  account_number: z.string()
    .min(8, 'Account number must be at least 8 digits')
    .max(20, 'Account number too long')
    .regex(/^\d+$/, 'Account number must contain only digits'),
  branch_code: z.string().optional().nullable(),
});

// Password validation schema with strength requirements
export const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required').optional(),
  new_password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

// Phone number validation (Indonesian format)
export const phoneSchema = z.string()
  .regex(/^(\+62|62|0)?8[1-9][0-9]{7,10}$/, 'Invalid Indonesian phone number format')
  .optional()
  .nullable()
  .or(z.literal(''));

// Cancel reason validation
export const cancelReasonSchema = z.string()
  .min(10, 'Please provide a detailed reason (at least 10 characters)')
  .max(500, 'Reason is too long');

// Decline reason validation for jobs
export const declineReasonSchema = z.string()
  .min(10, 'Please provide a reason for declining (at least 10 characters)')
  .max(500, 'Reason is too long');

// Status transition validation for jobs
export const validJobStatusTransitions: Record<string, string[]> = {
  pending: ['accepted', 'rejected'],
  accepted: ['in_progress', 'rejected'],
  in_progress: ['completed'],
  completed: [],
  rejected: [],
};

export const isValidJobStatusTransition = (currentStatus: string, newStatus: string): boolean => {
  const allowedTransitions = validJobStatusTransitions[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
};

// Status transition validation for orders
export const validOrderStatusTransitions: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['ready', 'cancelled'],
  ready: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export const isValidOrderStatusTransition = (currentStatus: string, newStatus: string): boolean => {
  const allowedTransitions = validOrderStatusTransitions[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
};

// Helper to mask sensitive data
export const maskAccountNumber = (accountNumber: string): string => {
  if (!accountNumber || accountNumber.length < 4) return '****';
  return '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4);
};

export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return '***@***.***';
  const [local, domain] = email.split('@');
  const maskedLocal = local.length > 2 
    ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
    : '*'.repeat(local.length);
  return `${maskedLocal}@${domain}`;
};

export const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 4) return '****';
  return phone.slice(0, 4) + '*'.repeat(phone.length - 8) + phone.slice(-4);
};
