// Map Supabase auth error codes to user-friendly Indonesian messages
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // Login errors
  'Invalid login credentials': 'Email atau password salah. Silakan coba lagi.',
  'Email not confirmed': 'Email belum diverifikasi. Silakan cek inbox Anda.',
  'Invalid email or password': 'Email atau password salah. Silakan coba lagi.',
  
  // Signup errors
  'User already registered': 'Email sudah terdaftar. Silakan login.',
  'Password should be at least 6 characters': 'Password minimal 6 karakter.',
  'Signup requires a valid password': 'Masukkan password yang valid.',
  'Unable to validate email address: invalid format': 'Format email tidak valid.',
  
  // Password reset errors
  'Email not found': 'Jika email terdaftar, Anda akan menerima link reset.',
  'Rate limit exceeded': 'Terlalu banyak percobaan. Coba lagi dalam beberapa menit.',
  'Token has expired or is invalid': 'Link sudah kadaluarsa. Silakan request reset password baru.',
  'Invalid token': 'Link tidak valid. Silakan request reset password baru.',
  
  // Session errors
  'Invalid session': 'Sesi tidak valid. Silakan login ulang.',
  'Session expired': 'Sesi telah berakhir. Silakan login ulang.',
  'Refresh token not found': 'Sesi telah berakhir. Silakan login ulang.',
  
  // General errors
  'Network error': 'Koneksi internet bermasalah. Silakan coba lagi.',
  'Server error': 'Terjadi kesalahan server. Silakan coba lagi.',
};

export function getAuthErrorMessage(error: Error | null | undefined): string {
  if (!error) return 'Terjadi kesalahan. Silakan coba lagi.';
  
  const errorMessage = error.message || '';
  
  // Check exact matches first
  if (AUTH_ERROR_MESSAGES[errorMessage]) {
    return AUTH_ERROR_MESSAGES[errorMessage];
  }
  
  // Check partial matches
  for (const [key, value] of Object.entries(AUTH_ERROR_MESSAGES)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Return original message if no mapping found, but sanitize it
  if (errorMessage.length > 0 && errorMessage.length < 200) {
    return errorMessage;
  }
  
  return 'Terjadi kesalahan. Silakan coba lagi.';
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
