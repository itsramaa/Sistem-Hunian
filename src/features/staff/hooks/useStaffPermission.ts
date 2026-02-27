import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { checkPermission } from '../services/staffService';
import type { PermissionKey } from '../constants/permissions';

export function useStaffPermission(permissionKey: PermissionKey) {
  const { user, merchant } = useAuth();

  const { data: hasPermission = false, isLoading } = useQuery({
    queryKey: ['staff-permission', user?.id, merchant?.id, permissionKey],
    queryFn: () => checkPermission(user!.id, merchant!.id, permissionKey),
    enabled: !!user?.id && !!merchant?.id,
    staleTime: 5 * 60 * 1000, // cache 5 min
  });

  return { hasPermission, isLoading };
}
