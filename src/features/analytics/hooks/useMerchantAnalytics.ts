import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';

export function useMerchantAnalytics(merchantId: string) {
  const { 
    data: analytics = null, 
    isLoading: loading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['merchant-analytics', merchantId],
    queryFn: async () => {
      // TODO: implement Go endpoints — was: supabase.from('properties/contracts/payments')
      const [propertiesRes, contractsRes, paymentsRes] = await Promise.all([
        apiClient.get('/properties', { params: { merchant_id: merchantId } }),
        apiClient.get('/contracts', { params: { merchant_id: merchantId } }),
        apiClient.get('/payments', { params: { merchant_id: merchantId } }),
      ]);

      const properties = propertiesRes.data || [];
      const contracts = contractsRes.data || [];
      const payments = paymentsRes.data || [];

      const totalRevenue = payments.filter((p: any) => p.status === 'paid' || p.status === 'completed').reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      const totalProperties = properties.length;
      const totalUnits = properties.reduce((sum: number, p: any) => sum + (p.total_units || 0), 0);
      const occupiedUnits = properties.reduce((sum: number, p: any) => sum + (p.occupied_units || 0), 0);
      const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
      const totalTenants = contracts.filter((c: any) => c.status === 'active').length;
      const paidInvoices = payments.filter((p: any) => p.status === 'paid' || p.status === 'completed').length;
      const pendingInvoices = payments.filter((p: any) => p.status === 'pending').length;
      const overdueInvoices = payments.filter((p: any) => p.status === 'overdue').length;
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
