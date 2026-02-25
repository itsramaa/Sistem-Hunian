import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useFacilityTypeNames(ids: string[]) {
  return useQuery({
    queryKey: ['facility-type-names', ids],
    queryFn: async () => {
      if (!ids || ids.length === 0) return {};
      const { data, error } = await (supabase.from as any)('facility_types')
        .select('id, name')
        .in('id', ids);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((ft: any) => { map[ft.id] = ft.name; });
      return map;
    },
    enabled: ids.length > 0,
  });
}
