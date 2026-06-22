import { apiClient } from '@/shared/lib/axios';

export interface WhatsappStatus {
  connected: boolean;
  phone?: string;
  battery?: number;
}

export interface WhatsappQR {
  qr_code: string; // base64 image string
}

// -- MOCK responses (swap ke real endpoint saat backend siap) --
const USE_MOCK = true;

const MOCK_STATUS_DISCONNECTED: WhatsappStatus = { connected: false };
const MOCK_STATUS_CONNECTED: WhatsappStatus = {
  connected: true,
  phone: '62812345678',
  battery: 87,
};
// Simple QR placeholder (1x1 black pixel base64)
const MOCK_QR =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

let mockConnected = false;

export const whatsappService = {
  async getStatus(): Promise<WhatsappStatus> {
    if (USE_MOCK) {
      return new Promise((res) =>
        setTimeout(() => res(mockConnected ? MOCK_STATUS_CONNECTED : MOCK_STATUS_DISCONNECTED), 400),
      );
    }
    const { data } = await apiClient.get<{ data: WhatsappStatus }>('/whatsapp/status');
    return data.data;
  },

  async getQR(): Promise<WhatsappQR> {
    if (USE_MOCK) {
      return new Promise((res) => setTimeout(() => res({ qr_code: MOCK_QR }), 600));
    }
    const { data } = await apiClient.get<{ data: WhatsappQR }>('/whatsapp/qr');
    return data.data;
  },

  async disconnect(): Promise<void> {
    if (USE_MOCK) {
      mockConnected = false;
      return new Promise((res) => setTimeout(res, 400));
    }
    await apiClient.post('/whatsapp/disconnect');
  },

  // Only used in mock dev to simulate scan
  __mockConnect() {
    mockConnected = true;
  },
};
