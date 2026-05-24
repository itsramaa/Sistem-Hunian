import { apiClient } from '@/lib/axios';
import { AdminUser } from '../types/admin';

export const adminUserService = {
  async getAllAdmins(): Promise<AdminUser[]> {
    try {
      const r = await apiClient.get('/user-roles', { params: { role: 'admin' } });
      return (r.data ?? []) as AdminUser[];
    } catch {
      // TODO: implement Go endpoint — was: supabase.from('user_roles').select('user_id, role').in('role', ['admin'])
      //       then supabase.from('profiles').select('*').in('user_id', adminIds)
      return [];
    }
  },
};
