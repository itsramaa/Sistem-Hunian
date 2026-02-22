import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface SubscriptionLimits {
  maxProperties: number;
  maxUnits: number;
  maxTenants: number;
  currentProperties: number;
  currentUnits: number;
  currentTenants: number;
  tierName: string;
  canAddProperty: boolean;
  canAddUnit: boolean;
  canAddTenant: boolean;
  isNearPropertyLimit: boolean;
  isNearUnitLimit: boolean;
  isNearTenantLimit: boolean;
}

export function useSubscriptionLimits() {
  const { merchant } = useAuth();

  return useQuery({
    queryKey: ['subscription-limits', merchant?.id],
    queryFn: async (): Promise<SubscriptionLimits> => {
      // Bypass all limits temporarily
      return {
        maxProperties: 999999,
        maxUnits: 999999,
        maxTenants: 999999,
        currentProperties: 0,
        currentUnits: 0,
        currentTenants: 0,
        tierName: 'Unlimited',
        canAddProperty: true,
        canAddUnit: true,
        canAddTenant: true,
        isNearPropertyLimit: false,
        isNearUnitLimit: false,
        isNearTenantLimit: false,
      };
    },
    enabled: !!merchant?.id,
  });
}
