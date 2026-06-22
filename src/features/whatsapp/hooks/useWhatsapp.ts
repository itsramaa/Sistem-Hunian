import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappService } from '../api/whatsappService';

const WHATSAPP_KEY = 'whatsapp';

export function useWhatsappStatus() {
  return useQuery({
    queryKey: [WHATSAPP_KEY, 'status'],
    queryFn: () => whatsappService.getStatus(),
    refetchInterval: 10_000, // poll tiap 10 detik
    refetchIntervalInBackground: false,
  });
}

export function useWhatsappQR(enabled: boolean) {
  return useQuery({
    queryKey: [WHATSAPP_KEY, 'qr'],
    queryFn: () => whatsappService.getQR(),
    enabled,
    refetchInterval: 30_000, // refresh QR tiap 30 detik
    refetchIntervalInBackground: false,
  });
}

export function useWhatsappDisconnect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => whatsappService.disconnect(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [WHATSAPP_KEY] });
    },
  });
}
