import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/integrations/supabase/client';
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
      if (!merchant?.id) throw new Error('No merchant');

      // Get subscription with tier info
      const { data: subscription } = await supabase
        .from('merchant_subscriptions')
        .select('*, tier:subscription_tiers(*)')
        .eq('merchant_id', merchant.id)
        .maybeSingle();

      // Get current counts
      const [propertiesRes, unitsRes, contractsRes] = await Promise.all([
        supabase
          .from('properties')
          .select('id', { count: 'exact' })
          .eq('merchant_id', merchant.id),
        supabase
          .from('units')
          .select('id, properties!inner(merchant_id)', { count: 'exact' })
          .eq('properties.merchant_id', merchant.id),
        supabase
          .from('contracts')
          .select('id', { count: 'exact' })
          .eq('merchant_id', merchant.id)
          .eq('status', 'active'),
      ]);

      const currentProperties = propertiesRes.count || 0;
      const currentUnits = unitsRes.count || 0;
      const currentTenants = contractsRes.count || 0;

      // Get tier limits (default to free tier limits)
      const tier = subscription?.tier;
      const maxProperties = tier?.max_properties || 1;
      const maxUnits = tier?.max_units || 5;
      const maxTenants = tier?.max_tenants || 5;
      const tierName = tier?.display_name || 'Free';

      return {
        maxProperties,
        maxUnits,
        maxTenants,
        currentProperties,
        currentUnits,
        currentTenants,
        tierName,
        canAddProperty: currentProperties < maxProperties,
        canAddUnit: currentUnits < maxUnits,
        canAddTenant: currentTenants < maxTenants,
        isNearPropertyLimit: currentProperties >= maxProperties * 0.8,
        isNearUnitLimit: currentUnits >= maxUnits * 0.8,
        isNearTenantLimit: currentTenants >= maxTenants * 0.8,
      };
    },
    enabled: !!merchant?.id,
  });
}
