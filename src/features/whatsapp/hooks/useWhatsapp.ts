import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { whatsappService } from "../api/whatsappService";

const WHATSAPP_KEY = "whatsapp";

export function useWhatsappStatus() {
  return useQuery({
    queryKey: [WHATSAPP_KEY, "status"],
    queryFn: () => whatsappService.getStatus(),
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });
}

export function useWhatsappQR(enabled: boolean) {
  return useQuery({
    queryKey: [WHATSAPP_KEY, "qr"],
    queryFn: () => whatsappService.getQR(),
    enabled,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

export function useWhatsappConnect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => whatsappService.connect(),
    onSuccess: () => {
      // Delay refetch supaya backend sempat generate QR
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: [WHATSAPP_KEY] });
      }, 2000);
    },
  });
}

export function useWhatsappCancelConnect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => whatsappService.cancelConnect(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [WHATSAPP_KEY] });
    },
  });
}

export function useWhatsappLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => whatsappService.logout(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [WHATSAPP_KEY] });
    },
  });
}

export function useWhatsappSendTest() {
  return useMutation({
    mutationFn: ({ phone, message }: { phone: string; message?: string }) =>
      whatsappService.sendTest(phone, message),
  });
}
