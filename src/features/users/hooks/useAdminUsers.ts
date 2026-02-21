import { useQuery } from '@tanstack/react-query';
import { adminUserService } from '../services/adminUserService';

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminUserService.getAllAdmins(),
  });
}
