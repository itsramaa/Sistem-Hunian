import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/axios';

export interface Renovation {
  id: string;
  property_id: string;
  merchant_id: string;
  renovation_date: string;
  cost: number;
  description: string | null;
  category: string;
  created_at: string;
  updated_at: string;
}

export function useRenovations(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['property-renovations', propertyId],
    queryFn: async () => {
      const response = await apiClient.get('/property-renovations', {
        params: { property_id: propertyId, order: 'renovation_date', ascending: false },
      });
      return (response.data?.data || response.data || []) as Renovation[];
    },
    enabled: !!propertyId,
  });
}

export function useCreateRenovation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { property_id: string; merchant_id: string; renovation_date: string; cost: number; description?: string; category?: string }) => {
      const response = await apiClient.post('/property-renovations', payload);
      return response.data?.data || response.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['property-renovations', vars.property_id] });
      qc.invalidateQueries({ queryKey: ['property-detail', vars.property_id] });
    },
  });
}

export function useDeleteRenovation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, propertyId }: { id: string; propertyId: string }) => {
      await apiClient.delete(`/property-renovations/${id}`);
      return propertyId;
    },
    onSuccess: (propertyId) => {
      qc.invalidateQueries({ queryKey: ['property-renovations', propertyId] });
      qc.invalidateQueries({ queryKey: ['property-detail', propertyId] });
    },
  });
}
