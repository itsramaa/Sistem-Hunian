export type WhatsappStatus = "connected" | "waiting_qr_scan" | "disconnected";

export interface WhatsappStatusResponse {
  status: WhatsappStatus;
  connected: boolean;
  has_qr: boolean;
}

export interface WhatsappQRResponse {
  qr: string;
  instruction: string;
}
