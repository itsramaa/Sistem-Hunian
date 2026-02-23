import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  invokePriceIntelligence,
  invokeOccupancyForecast,
} from "@/features/dss/services/marketIntelligenceService";

export function usePriceIntelligence() {
  return useMutation({
    mutationFn: (propertyId?: string) => invokePriceIntelligence(propertyId),
    onError: (error: Error) => {
      toast.error("Gagal menganalisis harga", { description: error.message });
    },
  });
}

export function useOccupancyForecast() {
  return useMutation({
    mutationFn: ({ forecastMonths, propertyId }: { forecastMonths?: number; propertyId?: string }) =>
      invokeOccupancyForecast(forecastMonths, propertyId),
    onError: (error: Error) => {
      toast.error("Gagal memproses forecast occupancy", { description: error.message });
    },
  });
}
