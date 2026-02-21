
import { useQuery } from '@tanstack/react-query';
import { merchantService } from '../services/merchantService';

export function useAdminMerchants() {
  return useQuery({
    queryKey: ['admin-merchants'],
    queryFn: () => merchantService.fetchMerchants(),
  });
}
