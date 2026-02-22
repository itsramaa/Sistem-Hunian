import { useQuery } from '@tanstack/react-query';
import { propertyService } from '../services/propertyService';

export function usePropertyDetail(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['property-detail', propertyId],
    queryFn: () => propertyService.fetchPropertyById(propertyId!),
    enabled: !!propertyId,
  });
}
