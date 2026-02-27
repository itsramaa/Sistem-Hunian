import { z } from 'zod';

// Common weak passwords that should be rejected
const COMMON_PASSWORDS = [
  'password', 'password1', 'password123', '123456', '12345678', '123456789',
  'qwerty', 'qwerty123', 'abc123', 'admin', 'letmein', 'welcome', 'monkey',
  'dragon', 'master', 'login', 'passw0rd', 'Password1', 'iloveyou', 'sunshine',
  'princess', 'football', 'baseball', 'shadow', 'ashley', 'michael', 'superman',
  'qazwsx', 'trustno1', '!@#$%^&*', 'password!', 'sihuni', 'sihuni123',
];

// Check if password is in common passwords list
export function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.some(common => 
    password.toLowerCase() === common.toLowerCase()
  );
}

// Indonesian phone number validation
export const phoneSchema = z.string()
  .optional()
  .refine((val) => {
    if (!val || val.trim() === '') return true;
    return /^(\+62|62|0)[0-9]{9,13}$/.test(val.replace(/\s|-/g, ''));
  }, {
    message: 'Format nomor telepon tidak valid. Gunakan format Indonesia (contoh: 08123456789)',
  });

// Strong password schema with common password check
export const strongPasswordSchema = z.string()
  .min(12, 'Password minimal 12 karakter')
  .regex(/[A-Z]/, 'Password harus mengandung minimal 1 huruf besar')
  .regex(/[a-z]/, 'Password harus mengandung minimal 1 huruf kecil')
  .regex(/[0-9]/, 'Password harus mengandung minimal 1 angka')
  .regex(/[^A-Za-z0-9]/, 'Password harus mengandung minimal 1 karakter spesial (!@#$%^&*)')
  .refine((val) => !isCommonPassword(val), {
    message: 'Password terlalu umum dan mudah ditebak. Gunakan kombinasi yang lebih unik.',
  });

// Simple password for login (keep backward compatible)
export const loginPasswordSchema = z.string()
  .min(6, 'Password minimal 6 karakter');

// Business name validation
export const businessNameSchema = z.string()
  .min(3, 'Nama bisnis minimal 3 karakter')
  .max(100, 'Nama bisnis maksimal 100 karakter')
  .regex(/^[a-zA-Z0-9\s\-.,&]+$/, 'Nama bisnis hanya boleh mengandung huruf, angka, spasi, dan tanda baca umum');

// Merchant code validation (6 chars alphanumeric uppercase)
export const merchantCodeSchema = z.string()
  .transform(val => val.toUpperCase().trim())
  .refine(val => /^[A-Z0-9]{6}$/.test(val), {
    message: 'Kode merchant harus 6 karakter alfanumerik',
  });

// Full name validation
export const fullNameSchema = z.string()
  .min(2, 'Nama minimal 2 karakter')
  .max(100, 'Nama maksimal 100 karakter');

// Email validation
export const emailSchema = z.string()
  .email('Masukkan email yang valid');

// Password strength calculator
export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

export function calculatePasswordStrength(password: string): {
  strength: PasswordStrength;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 12) {
    score += 1;
  } else {
    feedback.push('Minimal 12 karakter');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Tambahkan huruf besar');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Tambahkan huruf kecil');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Tambahkan angka');
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Tambahkan karakter spesial');
  }

  let strength: PasswordStrength;
  if (score <= 2) {
    strength = 'weak';
  } else if (score === 3) {
    strength = 'fair';
  } else if (score === 4) {
    strength = 'good';
  } else {
    strength = 'strong';
  }

  return { strength, score, feedback };
}

// Role validation
export const appRoleSchema = z.enum(['admin', 'merchant', 'vendor', 'tenant']);
export const selectableRoleSchema = z.enum(['merchant', 'vendor']);
