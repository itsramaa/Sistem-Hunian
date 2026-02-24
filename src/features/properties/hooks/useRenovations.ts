import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/integrations/supabase/client';

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
      const { data, error } = await (supabase as any)
        .from('property_renovations')
        .select('*')
        .eq('property_id', propertyId!)
        .order('renovation_date', { ascending: false });
      if (error) throw error;
      return (data || []) as Renovation[];
    },
    enabled: !!propertyId,
  });
}

export function useCreateRenovation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { property_id: string; merchant_id: string; renovation_date: string; cost: number; description?: string; category?: string }) => {
      const { data, error } = await (supabase as any).from('property_renovations').insert(payload).select().single();
      if (error) throw error;
      return data;
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
      const { error } = await (supabase as any).from('property_renovations').delete().eq('id', id);
      if (error) throw error;
      return propertyId;
    },
    onSuccess: (propertyId) => {
      qc.invalidateQueries({ queryKey: ['property-renovations', propertyId] });
      qc.invalidateQueries({ queryKey: ['property-detail', propertyId] });
    },
  });
}
