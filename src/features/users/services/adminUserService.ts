import { supabase } from '@/lib/integrations/supabase/client';
import { AdminUser } from '../types/admin';

export const adminUserService = {
  async getAllAdmins(): Promise<AdminUser[]> {
    const { data: adminRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('role', ['admin']);

    if (roleError) throw roleError;

    if (!adminRoles || adminRoles.length === 0) return [];

    const adminIds = adminRoles.map(r => r.user_id);

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .in('user_id', adminIds)
      .order('created_at');

    if (profileError) throw profileError;

    return profiles.map(profile => ({
      id: profile.id,
      name: profile.full_name || profile.email.split('@')[0] || 'Unknown',
      email: profile.email,
      role: 'admin', // Mapping all DB admins to 'admin' role for now
      status: 'active', // Default status
      lastLogin: new Date(profile.updated_at).toLocaleString(),
    }));
  },
};
