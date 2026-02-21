import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/integrations/supabase/client';

export function useMerchantAnalytics(merchantId: string) {
  const { 
    data: analytics = null, 
    isLoading: loading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['merchant-analytics', merchantId],
    queryFn: async () => {
      // Fetch merchant-specific analytics data
      const [propertiesRes, contractsRes, paymentsRes] = await Promise.all([
        supabase.from('properties').select('id, status, total_units, occupied_units').eq('merchant_id', merchantId),
        supabase.from('contracts').select('id, status, rent_amount').eq('merchant_id', merchantId),
        supabase.from('payments').select('id, amount, status').eq('merchant_id', merchantId),
      ]);
      
      const properties = propertiesRes.data || [];
      const contracts = contractsRes.data || [];
      const payments = paymentsRes.data || [];
      
      const totalRevenue = payments.filter(p => p.status === 'paid' || p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0);
      const totalProperties = properties.length;
      const totalUnits = properties.reduce((sum, p) => sum + (p.total_units || 0), 0);
      const occupiedUnits = properties.reduce((sum, p) => sum + (p.occupied_units || 0), 0);
      const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
      const totalTenants = contracts.filter(c => c.status === 'active').length;
      const paidInvoices = payments.filter(p => p.status === 'paid' || p.status === 'completed').length;
      const pendingInvoices = payments.filter(p => p.status === 'pending').length;
      const overdueInvoices = payments.filter(p => p.status === 'overdue').length;
      const onTimePaymentRate = (paidInvoices + pendingInvoices + overdueInvoices) > 0 
        ? Math.round((paidInvoices / (paidInvoices + pendingInvoices + overdueInvoices)) * 100) 
        : 0;

      return {
        totalRevenue,
        totalProperties,
        totalUnits,
        occupiedUnits,
        occupancyRate,
        totalTenants,
        paidInvoices,
        pendingInvoices,
        overdueInvoices,
        onTimePaymentRate,
        properties,
        contracts,
        payments,
      };
    },
    enabled: !!merchantId,
  });

  return { analytics, loading, error, refetch };
}
