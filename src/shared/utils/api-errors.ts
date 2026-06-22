import { AxiosError } from "axios";

/**
 * Centralized API error message mapper.
 * Converts HTTP status codes and backend error codes into
 * user-friendly Bahasa Indonesia messages.
 */

interface BackendError {
  message?: string;
  error?: string | { code?: string; message?: string };
  code?: string;
}

// HTTP status → user message
const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: "Data yang dikirim tidak valid. Periksa kembali isian Anda.",
  401: "Sesi Anda telah berakhir. Silakan login ulang.",
  403: "Anda tidak memiliki izin untuk melakukan tindakan ini.",
  404: "Data yang diminta tidak ditemukan.",
  408: "Permintaan habis waktu. Periksa koneksi internet Anda.",
  409: "Data sudah ada atau terjadi konflik. Periksa kembali isian Anda.",
  422: "Data tidak dapat diproses. Periksa kembali isian Anda.",
  429: "Terlalu banyak permintaan. Tunggu beberapa saat lalu coba lagi.",
  500: "Terjadi kesalahan pada server. Tim kami sedang menangani masalah ini.",
  502: "Server tidak dapat dijangkau saat ini. Coba lagi dalam beberapa menit.",
  503: "Layanan sedang tidak tersedia. Coba lagi dalam beberapa menit.",
  504: "Server tidak merespons tepat waktu. Coba lagi dalam beberapa menit.",
};

// Backend business error codes → user message
const BACKEND_ERROR_CODES: Record<string, string> = {
  // Auth
  AUTH_001: "Email atau password salah. Periksa kembali dan coba lagi.",
  AUTH_002: "Akun ini dinonaktifkan. Hubungi administrator.",
  AUTH_003: "Token tidak valid atau sudah kedaluwarsa. Silakan login ulang.",
  AUTH_004: "Sesi berakhir. Silakan login ulang.",

  // Room
  ROOM_001: "Kamar tidak ditemukan.",
  ROOM_002: "Kamar sudah dihuni. Pilih kamar lain.",
  ROOM_003: "Kamar ini sudah memiliki konfirmasi DP aktif.",
  ROOM_004: "Kamar tidak tersedia untuk disewa saat ini.",

  // Tenant
  TENANT_001: "Penghuni tidak ditemukan.",
  TENANT_002: "Penghuni ini sudah memiliki hunian aktif.",
  TENANT_003: "Data penghuni tidak lengkap. Periksa kembali isian Anda.",

  // Payment
  PAYMENT_001: "Pembayaran tidak ditemukan.",
  PAYMENT_002: "Pembayaran sudah diproses sebelumnya.",
  PAYMENT_003: "Jumlah pembayaran tidak valid.",
  PAYMENT_004: "Batas waktu pembayaran telah lewat.",

  // Confirmation / DP
  CONF_001: "Konfirmasi DP tidak ditemukan.",
  CONF_002: "Konfirmasi DP sudah kedaluwarsa.",
  CONF_003: "Konfirmasi DP sudah diproses.",

  // Property
  PROP_001: "Properti tidak ditemukan.",
  PROP_002: "Anda tidak memiliki akses ke properti ini.",

  // Maintenance
  MAINT_001: "Laporan maintenance tidak ditemukan.",
  MAINT_002: "Laporan maintenance sudah ditutup.",

  // Profile
  PROFILE_001: "Profil tidak ditemukan.",
  PROFILE_002: "Password saat ini salah. Periksa kembali.",
  PROFILE_003: "Password baru tidak memenuhi persyaratan keamanan.",

  // Validation
  VALIDATION_ERROR:
    "Data yang dikirim tidak valid. Periksa kembali isian Anda.",
  DUPLICATE_ENTRY: "Data sudah ada dalam sistem.",
};

// Keyword matches for backend messages that don't use error codes
const MESSAGE_KEYWORD_MAP: Array<[string, string]> = [
  ["not found", "Data yang diminta tidak ditemukan."],
  ["unauthorized", "Anda tidak memiliki izin untuk melakukan tindakan ini."],
  ["forbidden", "Akses ditolak. Anda tidak memiliki izin."],
  ["already exists", "Data sudah ada dalam sistem."],
  ["duplicate", "Data sudah ada dalam sistem."],
  ["invalid token", "Token tidak valid. Silakan login ulang."],
  ["token expired", "Token kedaluwarsa. Silakan login ulang."],
  [
    "password",
    "Password tidak valid. Minimal 8 karakter dengan kombinasi huruf dan angka.",
  ],
  ["email", "Format email tidak valid."],
  ["required", "Semua field yang wajib harus diisi."],
  ["timeout", "Koneksi habis waktu. Periksa internet Anda dan coba lagi."],
  ["network", "Koneksi internet bermasalah. Periksa jaringan Anda."],
  [
    "connection",
    "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.",
  ],
];

/**
 * Extract a user-friendly error message from any error type.
 * Priority: backend error code → HTTP status → keyword match → fallback
 */
export function getApiErrorMessage(error: unknown): string {
  // Network / no response (offline, timeout, CORS)
  if (error instanceof AxiosError) {
    if (!error.response) {
      if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        return "Permintaan habis waktu. Periksa koneksi internet Anda dan coba lagi.";
      }
      if (
        error.code === "ERR_NETWORK" ||
        error.message?.toLowerCase().includes("network")
      ) {
        return "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
      }
      return "Tidak dapat terhubung ke server. Pastikan internet Anda aktif dan coba lagi.";
    }

    const status = error.response.status;
    const body = error.response.data as BackendError | undefined;

    // Backend envelope: { success, error: { code, message } } atau { code, message }
    const nestedError = typeof body?.error === "object" ? body.error : null;
    const code = nestedError?.code ?? body?.code;
    const backendMsg =
      nestedError?.message ??
      body?.message ??
      (typeof body?.error === "string" ? body.error : "") ??
      "";

    // Check backend error code first
    if (code && BACKEND_ERROR_CODES[code]) {
      return BACKEND_ERROR_CODES[code];
    }

    // Check backend message for keyword matches
    if (backendMsg) {
      for (const [keyword, msg] of MESSAGE_KEYWORD_MAP) {
        if (backendMsg.toLowerCase().includes(keyword)) {
          return msg;
        }
      }
      // Use backend message if it's short and readable (likely already in Indonesian)
      if (
        backendMsg.length > 0 &&
        backendMsg.length < 150 &&
        !backendMsg.includes("Error:")
      ) {
        return backendMsg;
      }
    }

    // Fall back to HTTP status message
    if (HTTP_STATUS_MESSAGES[status]) {
      return HTTP_STATUS_MESSAGES[status];
    }

    return "Terjadi kesalahan. Silakan coba lagi.";
  }

  // Plain Error
  if (error instanceof Error) {
    const msg = error.message;
    for (const [keyword, friendly] of MESSAGE_KEYWORD_MAP) {
      if (msg.toLowerCase().includes(keyword)) {
        return friendly;
      }
    }
    if (msg.length > 0 && msg.length < 150) return msg;
  }

  return "Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.";
}

/**
 * Get a short toast-friendly title based on HTTP status or error type.
 */
export function getApiErrorTitle(error: unknown): string {
  if (error instanceof AxiosError) {
    if (!error.response) return "Koneksi Gagal";
    const status = error.response.status;
    if (status === 401) return "Sesi Berakhir";
    if (status === 403) return "Akses Ditolak";
    if (status === 404) return "Tidak Ditemukan";
    if (status === 409) return "Konflik Data";
    if (status === 422) return "Data Tidak Valid";
    if (status === 429) return "Terlalu Banyak Permintaan";
    if (status >= 500) return "Kesalahan Server";
    return "Permintaan Gagal";
  }
  return "Terjadi Kesalahan";
}
