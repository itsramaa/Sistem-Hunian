import { env } from "@/config/env";
import { apiClient } from "@/shared/lib/axios";

export type WhatsappStatus = "connected" | "waiting_qr_scan" | "disconnected";

export interface WhatsappStatusResponse {
  status: WhatsappStatus;
  connected: boolean;
  has_qr: boolean;
}

export interface WhatsappQRResponse {
  qr: string; // raw QR string untuk di-render jadi image
  instruction: string;
}

// -- MOCK flag — dibaca dari env (VITE_WA_MOCK) --
const USE_MOCK = env.WA_MOCK;

let mockStatus: WhatsappStatus = "disconnected";
let mockHasQR = false;

// Simulasi QR ready setelah 1.5 detik
setTimeout(() => {
  if (mockStatus === "disconnected") mockHasQR = true;
}, 1500);

// Mock QR string (placeholder teks, nanti real string dari whatsmeow)
const MOCK_QR_STRING = "2@abc123xyz,mock-qr-data-for-display,SiHuni-WA-Session";

export const whatsappService = {
  async getStatus(): Promise<WhatsappStatusResponse> {
    if (USE_MOCK) {
      return new Promise((res) =>
        setTimeout(
          () =>
            res({
              status: mockStatus,
              connected: mockStatus === "connected",
              has_qr: mockHasQR,
            }),
          300,
        ),
      );
    }
    const { data } = await apiClient.get<any>("/whatsapp/status");
    // axios interceptor unwraps {success, data} → object langsung
    const result = data?.status !== undefined ? data : data?.data;
    return (
      result ?? {
        status: "disconnected" as WhatsappStatus,
        connected: false,
        has_qr: false,
      }
    );
  },

  async getQR(): Promise<WhatsappQRResponse> {
    if (USE_MOCK) {
      return new Promise((res, rej) =>
        setTimeout(() => {
          if (!mockHasQR)
            return rej(
              new Error(
                "QR code belum tersedia. Pastikan server baru saja dimulai.",
              ),
            );
          res({
            qr: MOCK_QR_STRING,
            instruction:
              "Buka WhatsApp → Linked Devices → Link a Device, lalu scan QR code ini.",
          });
        }, 400),
      );
    }
    const { data } = await apiClient.get<any>("/whatsapp/qr");
    const result = data?.qr !== undefined ? data : data?.data;
    if (!result?.qr)
      throw new Error("QR code belum tersedia. Coba beberapa saat lagi.");
    return result;
  },

  async connect(): Promise<void> {
    if (USE_MOCK) {
      mockStatus = "disconnected";
      mockHasQR = false;
      setTimeout(() => {
        mockHasQR = true;
      }, 1500);
      return new Promise((res) => setTimeout(res, 400));
    }
    await apiClient.post("/whatsapp/connect");
  },

  async cancelConnect(): Promise<void> {
    if (USE_MOCK) {
      mockHasQR = false;
      return new Promise((res) => setTimeout(res, 300));
    }
    await apiClient.post("/whatsapp/cancel");
  },

  async logout(): Promise<void> {
    if (USE_MOCK) {
      mockStatus = "disconnected";
      mockHasQR = false;
      setTimeout(() => {
        mockHasQR = true;
      }, 2000);
      return new Promise((res) => setTimeout(res, 400));
    }
    await apiClient.post("/whatsapp/logout");
  },

  async sendTest(phone: string, message?: string): Promise<void> {
    if (USE_MOCK) {
      return new Promise((res) => setTimeout(res, 500));
    }
    await apiClient.post("/whatsapp/test", { phone, message });
  },

  // Dev helper: simulasi scan QR berhasil
  __mockConnect() {
    mockStatus = "connected";
    mockHasQR = false;
  },
};
