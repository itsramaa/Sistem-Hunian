import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { whatsappApi } from "../api/whatsappApi";

const WHATSAPP_KEY = "whatsapp";

export function useWhatsappStatus() {
  return useQuery({
    queryKey: [WHATSAPP_KEY, "status"],
    queryFn: () => whatsappApi.getStatus(),
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
    staleTime: 8_000,
  });
}

export function useWhatsappQR(enabled: boolean) {
  return useQuery({
    queryKey: [WHATSAPP_KEY, "qr"],
    queryFn: () => whatsappApi.getQR(),
    enabled,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

export function useWhatsappConnect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => whatsappApi.connect(),
    onSuccess: () => {
      // Refetch status beberapa kali dengan interval pendek sampai QR tersedia
      let attempts = 0;
      const poll = () => {
        attempts++;
        qc.invalidateQueries({ queryKey: [WHATSAPP_KEY, "status"] });
        if (attempts < 8) {
          setTimeout(poll, 800);
        }
      };
      setTimeout(poll, 500);
    },
  });
}

export function useWhatsappCancelConnect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => whatsappApi.cancelConnect(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [WHATSAPP_KEY] });
    },
  });
}

export function useWhatsappLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => whatsappApi.logout(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [WHATSAPP_KEY] });
    },
  });
}

export function useWhatsappSendTest() {
  return useMutation({
    mutationFn: ({ phone, message }: { phone: string; message?: string }) =>
      whatsappApi.sendTest(phone, message),
  });
}
