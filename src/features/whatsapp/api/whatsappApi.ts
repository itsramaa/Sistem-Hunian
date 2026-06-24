import { env } from "@/config/env";
import { apiClient } from "@/shared/lib/axios";
import type { WhatsappStatus, WhatsappStatusResponse, WhatsappQRResponse } from "../types";

const USE_MOCK = env.WA_MOCK;

let mockStatus: WhatsappStatus = "disconnected";
let mockHasQR = false;

setTimeout(() => {
  if (mockStatus === "disconnected") mockHasQR = true;
}, 1500);

const MOCK_QR_STRING = "2@abc123xyz,mock-qr-data-for-display,SiHuni-WA-Session";

export const whatsappApi = {
  async getStatus(): Promise<WhatsappStatusResponse> {
    if (USE_MOCK) {
      return new Promise((res) =>
        setTimeout(
          () => res({ status: mockStatus, connected: mockStatus === "connected", has_qr: mockHasQR }),
          300,
        ),
      );
    }
    const { data } = await apiClient.get<any>("/whatsapp/status");
    const result = data?.status !== undefined ? data : data?.data;
    return result ?? { status: "disconnected" as WhatsappStatus, connected: false, has_qr: false };
  },

  async getQR(): Promise<WhatsappQRResponse> {
    if (USE_MOCK) {
      return new Promise((res, rej) =>
        setTimeout(() => {
          if (!mockHasQR) return rej(new Error("QR code belum tersedia. Pastikan server baru saja dimulai."));
          res({ qr: MOCK_QR_STRING, instruction: "Buka WhatsApp → Linked Devices → Link a Device, lalu scan QR code ini." });
        }, 400),
      );
    }
    const { data } = await apiClient.get<any>("/whatsapp/qr");
    const result = data?.qr !== undefined ? data : data?.data;
    if (!result?.qr) throw new Error("QR code belum tersedia. Coba beberapa saat lagi.");
    return result;
  },

  async connect(): Promise<void> {
    if (USE_MOCK) {
      mockStatus = "disconnected";
      mockHasQR = false;
      setTimeout(() => { mockHasQR = true; }, 1500);
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
      setTimeout(() => { mockHasQR = true; }, 2000);
      return new Promise((res) => setTimeout(res, 400));
    }
    await apiClient.post("/whatsapp/logout");
  },

  async sendTest(phone: string, message?: string): Promise<void> {
    if (USE_MOCK) return new Promise((res) => setTimeout(res, 500));
    await apiClient.post("/whatsapp/test", { phone, message });
  },

  __mockConnect() {
    mockStatus = "connected";
    mockHasQR = false;
  },
};
