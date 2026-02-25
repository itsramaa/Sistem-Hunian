import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Rule {
  id: string;
  merchant_id: string;
  property_id: string;
  unit_id: string | null;
  rule_type_id: string | null;
  title: string;
  description: string | null;
  is_active: boolean;
  is_overridable: boolean;
  effective_from: string;
  effective_until: string | null;
  created_at: string;
  updated_at: string;
}

export function useRules(propertyId: string, unitId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ['rules', propertyId, unitId || 'property-level'];

  const { data: rules = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      // Get property-level rules
      let query = (supabase.from as any)('rules')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (unitId) {
        // For unit: get both unit-specific AND property-level (inherited)
        query = query.or(`unit_id.eq.${unitId},unit_id.is.null`);
      } else {
        // For property: only property-level
        query = query.is('unit_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Rule[];
    },
    enabled: !!propertyId,
  });

  const createRule = useMutation({
    mutationFn: async (rule: Partial<Rule>) => {
      const { error } = await (supabase.from as any)('rules').insert(rule);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Peraturan berhasil ditambahkan');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Rule> & { id: string }) => {
      const { error } = await (supabase.from as any)('rules').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Peraturan berhasil diperbarui');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from as any)('rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Peraturan berhasil dihapus');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { rules, isLoading, createRule, updateRule, deleteRule };
}
