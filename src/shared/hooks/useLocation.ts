import { useQuery } from '@tanstack/react-query';
import { locationService } from '../services/locationService';

export function useProvinces() {
  return useQuery({
    queryKey: ['provinces'],
    queryFn: locationService.getProvinces,
    staleTime: Infinity, // Provinces rarely change
  });
}

export function useCities(provinceId: string) {
  return useQuery({
    queryKey: ['cities', provinceId],
    queryFn: () => locationService.getCities(provinceId),
    enabled: !!provinceId,
    staleTime: Infinity, // Cities rarely change
  });
}
