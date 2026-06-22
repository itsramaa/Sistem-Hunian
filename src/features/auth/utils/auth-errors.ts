import { getApiErrorMessage } from '@/shared/utils/api-errors';

// Map auth-specific error strings to user-friendly Indonesian messages
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // Login
  'Invalid login credentials': 'Email atau password salah. Periksa kembali dan coba lagi.',
  'Invalid email or password': 'Email atau password salah. Periksa kembali dan coba lagi.',
  'Email not confirmed': 'Email Anda belum diverifikasi. Silakan cek inbox atau folder spam.',
  'account locked': 'Akun Anda dikunci sementara karena terlalu banyak percobaan login. Coba lagi dalam 15 menit.',
  'account disabled': 'Akun ini telah dinonaktifkan. Hubungi administrator untuk bantuan.',

  // Signup
  'User already registered': 'Email ini sudah terdaftar. Silakan gunakan email lain atau login.',
  'Password should be at least 6 characters': 'Password terlalu pendek. Gunakan minimal 8 karakter.',
  'Signup requires a valid password': 'Password tidak valid. Gunakan minimal 8 karakter dengan kombinasi huruf dan angka.',
  'Unable to validate email address: invalid format': 'Format email tidak valid. Contoh: nama@domain.com',

  // Password reset
  'Email not found': 'Jika email ini terdaftar, Anda akan menerima instruksi reset password.',
  'Rate limit exceeded': 'Terlalu banyak percobaan. Tunggu beberapa menit sebelum mencoba lagi.',
  'Token has expired or is invalid': 'Link reset password sudah kedaluwarsa. Silakan minta link baru.',
  'Invalid token': 'Link reset password tidak valid. Silakan minta link baru.',
  'OTP expired': 'Kode verifikasi sudah kedaluwarsa. Silakan minta kode baru.',

  // Session
  'Invalid session': 'Sesi tidak valid. Silakan login ulang untuk melanjutkan.',
  'Session expired': 'Sesi Anda telah berakhir. Silakan login ulang.',
  'Refresh token not found': 'Sesi Anda telah berakhir. Silakan login ulang.',
  'JWT expired': 'Token kedaluwarsa. Silakan login ulang.',

  // Network & server
  'Network error': 'Koneksi internet bermasalah. Periksa jaringan Anda dan coba lagi.',
  'Server error': 'Terjadi kesalahan pada server. Tim kami sedang menangani masalah ini.',
  'timeout': 'Permintaan habis waktu. Periksa koneksi internet Anda dan coba lagi.',
};

export function getAuthErrorMessage(error: Error | null | undefined): string {
  if (!error) return 'Terjadi kesalahan. Silakan coba lagi.';

  const errorMessage = error.message || '';

  // Exact match
  if (AUTH_ERROR_MESSAGES[errorMessage]) {
    return AUTH_ERROR_MESSAGES[errorMessage];
  }

  // Partial match (case-insensitive)
  for (const [key, value] of Object.entries(AUTH_ERROR_MESSAGES)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // Delegate to centralized API error handler (handles AxiosError, HTTP codes, etc.)
  return getApiErrorMessage(error);
}

// Invitation error messages
export const INVITATION_ERROR_MESSAGES = {
  EXPIRED: {
    title: 'Undangan Kadaluarsa',
    message: 'Undangan ini sudah kadaluarsa.',
    action: 'Silakan hubungi pemilik properti untuk mendapatkan undangan baru.',
  },
  USED: {
    title: 'Undangan Sudah Digunakan',
    message: 'Undangan ini sudah digunakan sebelumnya.',
    action: 'Jika Anda sudah memiliki akun, silakan login.',
  },
  INVALID: {
    title: 'Undangan Tidak Valid',
    message: 'Link undangan tidak valid atau tidak ditemukan.',
    action: 'Pastikan link yang Anda gunakan benar atau hubungi pemilik properti.',
  },
  UNIT_NOT_AVAILABLE: {
    title: 'Unit Tidak Tersedia',
    message: 'Unit yang Anda undang sudah tidak tersedia.',
    action: 'Silakan hubungi pemilik properti untuk informasi lebih lanjut.',
  },
};

// Referral error messages  
export const REFERRAL_ERROR_MESSAGES = {
  NOT_FOUND: {
    title: 'Kode Referral Tidak Ditemukan',
    message: 'Kode referral yang Anda masukkan tidak valid.',
    action: 'Periksa kembali kode atau daftar tanpa referral.',
  },
  EXPIRED: {
    title: 'Kode Referral Kadaluarsa',
    message: 'Kode referral ini sudah tidak berlaku.',
    action: 'Minta kode baru dari teman Anda.',
  },
  MAX_USES: {
    title: 'Kode Referral Sudah Penuh',
    message: 'Kode referral ini sudah mencapai batas penggunaan.',
    action: 'Daftar tanpa referral atau minta kode lain.',
  },
  INACTIVE: {
    title: 'Kode Referral Tidak Aktif',
    message: 'Kode referral ini sudah dinonaktifkan.',
    action: 'Hubungi pemilik kode atau daftar tanpa referral.',
  },
};
