import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/hooks/use-toast';
import {
  fetchUtilitySettings,
  saveUtilitySettings,
  fetchMeterReadings,
  submitMeterReadings,
  fetchUtilityCharges,
  generateCharges,
  getLastReadings,
  type UtilitySetting,
  type MeterReading,
} from '../services/utilityBillingService';

export function useUtilitySettings(propertyId: string | null) {
  return useQuery({
    queryKey: ['utility-settings', propertyId],
    queryFn: () => fetchUtilitySettings(propertyId!),
    enabled: !!propertyId,
  });
}

export function useSaveSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (settings: UtilitySetting[]) => saveUtilitySettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utility-settings'] });
      toast({ title: 'Pengaturan utilitas disimpan' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Gagal menyimpan', description: error.message });
    },
  });
}

export function useMeterReadings(propertyId: string | null, period: string) {
  return useQuery({
    queryKey: ['meter-readings', propertyId, period],
    queryFn: () => fetchMeterReadings(propertyId!, period),
    enabled: !!propertyId && !!period,
  });
}

export function useLastReadings(propertyId: string | null, utilityType: string) {
  return useQuery({
    queryKey: ['last-readings', propertyId, utilityType],
    queryFn: () => getLastReadings(propertyId!, utilityType),
    enabled: !!propertyId && !!utilityType,
  });
}

export function useSubmitReadings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (readings: MeterReading[]) => submitMeterReadings(readings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meter-readings'] });
      queryClient.invalidateQueries({ queryKey: ['last-readings'] });
      toast({ title: 'Pembacaan meter disimpan' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Gagal menyimpan', description: error.message });
    },
  });
}

export function useUtilityCharges(propertyId: string | null, period: string) {
  return useQuery({
    queryKey: ['utility-charges', propertyId, period],
    queryFn: () => fetchUtilityCharges(propertyId!, period),
    enabled: !!propertyId && !!period,
  });
}

export function useGenerateCharges() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ merchantId, propertyId, period }: { merchantId: string; propertyId: string; period: string }) =>
      generateCharges(merchantId, propertyId, period),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utility-charges'] });
      toast({ title: 'Tagihan utilitas berhasil digenerate' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Gagal generate tagihan', description: error.message });
    },
  });
}
