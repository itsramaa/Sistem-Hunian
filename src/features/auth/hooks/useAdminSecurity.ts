import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminSecurityService } from '../services/adminSecurityService';

export function useAdminSecurity() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: is2FAEnabled = false, isLoading: isStatusLoading } = useQuery({
    queryKey: ['admin-2fa-status', user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error('Not authenticated');
      return adminSecurityService.get2FAStatus(user.id);
    },
    enabled: !!user?.id,
  });

  const enable2FAMutation = useMutation({
    mutationFn: async ({ secret, token }: { secret: string; token: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      return adminSecurityService.enable2FA(user.id, secret, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-2fa-status'] });
      toast.success('Two-factor authentication enabled successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to enable 2FA: ${error.message}`);
    },
  });

  const disable2FAMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      return adminSecurityService.disable2FA(user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-2fa-status'] });
      toast.success('Two-factor authentication disabled');
    },
    onError: (error: Error) => {
      toast.error(`Failed to disable 2FA: ${error.message}`);
    },
  });

  return {
    is2FAEnabled,
    isStatusLoading,
    enable2FA: enable2FAMutation.mutate,
    disable2FA: disable2FAMutation.mutate,
    isEnabling: enable2FAMutation.isPending,
    isDisabling: disable2FAMutation.isPending,
    generateSecret: adminSecurityService.generateSecret,
    generateRecoveryCodes: adminSecurityService.generateRecoveryCodes,
  };
}
