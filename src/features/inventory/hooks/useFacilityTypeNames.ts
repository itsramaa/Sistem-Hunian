import { useQuery } from '@tanstack/react-query';

export function useFacilityTypeNames(ids: string[]) {
  return useQuery({
    queryKey: ['facility-type-names', ids],
    queryFn: async () => {
      if (!ids || ids.length === 0) return {};
      // TODO: Go endpoint not yet implemented — was: supabase.from('facility_types').select(...)
      return {} as Record<string, string>;
    },
    enabled: ids.length > 0,
  });
}
