/**
 * Centralized validation utilities for merchant features
 */
import { z } from 'zod';
import {
  CONTRACT_STATUS_TRANSITIONS,
  INVOICE_STATUS_TRANSITIONS,
  MAINTENANCE_STATUS_TRANSITIONS,
  isValidTransition,
} from '@/shared/constants/state-machines';

// Re-export centralized state machine constants for backward compatibility
export { CONTRACT_STATUS_TRANSITIONS, INVOICE_STATUS_TRANSITIONS, MAINTENANCE_STATUS_TRANSITIONS };
export { isValidTransition as isValidStatusTransition };

// Contract validation schema
export const contractSchema = z.object({
  unit_id: z.string().uuid('Please select a valid unit'),
  tenant_email: z.string().email('Please enter a valid email address'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  rent_amount: z.number().min(0, 'Rent amount must be positive'),
  deposit_amount: z.number().min(0, 'Deposit amount must be positive'),
  billing_day: z.number().min(1).max(28, 'Billing day must be between 1 and 28'),
  terms: z.string().max(5000, 'Terms must be less than 5000 characters').optional(),
  grace_period_days: z.number().min(0).max(30, 'Grace period must be between 0 and 30 days').optional(),
  late_payment_penalty_rate: z.number().min(0).max(0.1, 'Penalty rate must be between 0% and 10%').optional(),
}).refine((data) => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return end > start;
}, {
  message: 'End date must be after start date',
  path: ['end_date'],
}).refine((data) => {
  const start = new Date(data.start_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return start >= today;
}, {
  message: 'Start date cannot be in the past',
  path: ['start_date'],
});

// Property validation schema
export const propertySchema = z.object({
  name: z.string().min(1, 'Property name is required').max(100, 'Name must be less than 100 characters'),
  address: z.string().min(1, 'Address is required').max(255, 'Address must be less than 255 characters'),
  city: z.string().min(1, 'City is required'),
  province: z.string().min(1, 'Province is required'),
  postal_code: z.string().regex(/^\d{5}$/, 'Postal code must be 5 digits'),
  type: z.string().min(1, 'Property type is required'),
});

// Unit validation schema
export const unitSchema = z.object({
  property_id: z.string().uuid('Please select a valid property'),
  unit_number: z.string().min(1, 'Unit number is required').max(20, 'Unit number must be less than 20 characters'),
  floor: z.number().int().min(-5, 'Floor must be at least -5').max(200, 'Floor must be at most 200').optional(),
  size_sqm: z.number().min(1, 'Size must be at least 1 sqm').max(10000, 'Size must be less than 10,000 sqm').optional(),
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().int().min(0).max(20).optional(),
  base_rent: z.number().min(0, 'Rent must be positive'),
  amenities: z.array(z.string()).optional(),
});

// Invoice validation schema
export const invoiceSchema = z.object({
  contract_id: z.string().uuid('Please select a valid contract'),
  amount: z.number().min(0, 'Amount must be positive'),
  due_date: z.string().min(1, 'Due date is required'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
}).refine((data) => {
  const due = new Date(data.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due >= today;
}, {
  message: 'Due date cannot be in the past',
  path: ['due_date'],
});

// Payment validation schema
export const paymentSchema = z.object({
  invoice_id: z.string().uuid('Please select a valid invoice'),
  amount: z.number().min(0, 'Amount must be positive'),
  payment_method: z.enum(['cash', 'bank_transfer', 'credit_card', 'e_wallet'], {
    errorMap: () => ({ message: 'Please select a valid payment method' }),
  }),
  reference: z.string().max(100, 'Reference must be less than 100 characters').optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

// Move-out inspection validation
export const moveOutInspectionSchema = z.object({
  scheduled_date: z.string().min(1, 'Inspection date is required'),
  deductions: z.number().min(0, 'Deductions must be positive'),
  deduction_details: z.array(z.object({
    description: z.string().min(1, 'Description required'),
    amount: z.number().min(0, 'Amount must be positive'),
  })).optional(),
});

// Validation error helpers
export const formatValidationErrors = (errors: z.ZodError): string => {
  return errors.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
};

// Email validation for tenant invitations
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone number validation (Indonesian format)
export const isValidIndonesianPhone = (phone: string): boolean => {
  const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
};

// Format phone for display
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/[\s-]/g, '');
  if (cleaned.startsWith('+62')) {
    return cleaned;
  }
  if (cleaned.startsWith('62')) {
    return '+' + cleaned;
  }
  if (cleaned.startsWith('0')) {
    return '+62' + cleaned.slice(1);
  }
  return cleaned;
};
