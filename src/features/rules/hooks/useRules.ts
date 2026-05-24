import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
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

// TODO: Go endpoint not yet implemented for rules domain
// All methods below are stubbed — was: supabase.from('rules')...

export function useRules(propertyId: string, unitId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ['rules', propertyId, unitId || 'property-level'];

  const { data: rules = [], isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<Rule[]> => {
      // TODO: Go endpoint not yet implemented — was: supabase.from('rules').select(...)
      return [];
    },
    enabled: !!propertyId,
  });

  const createRule = useMutation({
    mutationFn: async (_rule: Partial<Rule>) => {
      // TODO: Go endpoint not yet implemented — was: supabase.from('rules').insert(rule)
      throw new Error('Rules creation not yet available');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Peraturan berhasil ditambahkan');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateRule = useMutation({
    mutationFn: async (_args: Partial<Rule> & { id: string }) => {
      // TODO: Go endpoint not yet implemented — was: supabase.from('rules').update(updates).eq('id', id)
      throw new Error('Rules update not yet available');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Peraturan berhasil diperbarui');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteRule = useMutation({
    mutationFn: async (_id: string) => {
      // TODO: Go endpoint not yet implemented — was: supabase.from('rules').delete().eq('id', id)
      throw new Error('Rules deletion not yet available');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Peraturan berhasil dihapus');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { rules, isLoading, createRule, updateRule, deleteRule };
}
