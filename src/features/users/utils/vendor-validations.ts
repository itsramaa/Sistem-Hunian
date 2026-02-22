import { z } from 'zod';
import {
  VENDOR_JOB_STATUS_TRANSITIONS,
  ORDER_STATUS_TRANSITIONS,
  isValidTransition,
} from '@/shared/constants/state-machines';

// Phone number validation
export const validatePhoneNumber = (phone: string): { isValid: boolean; error?: string } => {
  if (!phone) return { isValid: true };
  
  // Indonesian phone format: +62xxx or 08xxx
  const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{7,10}$/;
  const cleanPhone = phone.replace(/[\s-]/g, '');
  
  if (!phoneRegex.test(cleanPhone)) {
    return { isValid: false, error: 'Invalid phone format. Use +62xxxxxxxxxx or 08xxxxxxxxxx' };
  }
  return { isValid: true };
};

// Password validation
export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain a lowercase letter' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain an uppercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain a number' };
  }
  return { isValid: true };
};

// Product form data type
export interface ProductFormData {
  name: string;
  description: string;
  category: string;
  price: string;
  unit: string;
  is_available: boolean;
  min_order: string;
  estimated_duration: string;
  photos: string[];
  stock: string;
  promo_price: string;
  promo_start: string;
  promo_end: string;
}

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

// Re-export centralized state machine constants
export const validJobStatusTransitions = VENDOR_JOB_STATUS_TRANSITIONS;
export const validOrderStatusTransitions = ORDER_STATUS_TRANSITIONS;

export const isValidJobStatusTransition = (currentStatus: string, newStatus: string): boolean => {
  return isValidTransition(VENDOR_JOB_STATUS_TRANSITIONS, currentStatus, newStatus);
};

export const isValidOrderStatusTransition = (currentStatus: string, newStatus: string): boolean => {
  return isValidTransition(ORDER_STATUS_TRANSITIONS, currentStatus, newStatus);
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
