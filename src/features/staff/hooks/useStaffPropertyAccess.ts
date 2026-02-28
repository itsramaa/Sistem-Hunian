import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getStaffPropertyIds } from '../services/staffService';

/**
 * Returns the current user's accessible property IDs.
 * - Owners: accessiblePropertyIds = null, isAllAccess = true
 * - Staff with empty property_ids: accessiblePropertyIds = [], isAllAccess = true
 * - Staff with specific property_ids: accessiblePropertyIds = [...ids], isAllAccess = false
 */
export function useStaffPropertyAccess() {
  const { user, merchant } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['staff-property-access', user?.id, merchant?.id],
    queryFn: () => getStaffPropertyIds(user!.id, merchant!.id),
    enabled: !!user?.id && !!merchant?.id,
    staleTime: 5 * 60 * 1000,
  });

  const isOwner = data?.isOwner ?? false;
  const propertyIds = data?.propertyIds ?? null;
  const isAllAccess = isOwner || (propertyIds !== null && propertyIds.length === 0);

  return {
    accessiblePropertyIds: propertyIds,
    isAllAccess,
    isOwner,
    isLoading,
  };
}
