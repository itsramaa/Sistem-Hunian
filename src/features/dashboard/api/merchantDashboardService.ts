import { apiClient } from "@/shared/lib/axios";
import { getCurrentMonthDateRange, getPreviousMonthDateRange } from "@/shared/utils/dateUtils";

export interface MerchantDashboardStats {
  properties: {
    total: number;
    totalUnits: number;
    occupiedUnits: number;
    occupancyRate: number;
    list: Array<{
      id: string;
      name: string;
      total_units: number;
      occupied_units: number;
    }>;
  };
  financials: {
    balance: number;
    pendingBalance: number;
    monthlyRevenue: number;
    lastMonthRevenue: number;
    revenueGrowth: number;
  };
  tenants: {
    active: number;
    lastMonthActive: number;
    growth: number;
  };
}

export const merchantDashboardService = {
  async fetchStats(merchantId: string): Promise<MerchantDashboardStats> {
    const currentMonth = getCurrentMonthDateRange();
    const lastMonth = getPreviousMonthDateRange();

    const [
      propertiesRes,
      escrowRes,
      activeTenantsRes,
      monthlyPaymentsRes,
      lastMonthPaymentsRes,
      lastMonthTenantsRes,
    ] = await Promise.all([
      // 1. Fetch properties
      apiClient.get('/properties', {
        params: { merchant_id: merchantId, select: 'id,name,total_units,occupied_units' },
      }),

      // 2. Fetch escrow balance
      apiClient.get('/escrow-accounts', {
        params: { merchant_id: merchantId, select: 'balance,pending_balance', limit: 1 },
      }),

      // 3. Fetch active tenants count
      apiClient.get('/contracts', {
        params: { merchant_id: merchantId, status: 'active', count: 'exact', select: 'id' },
      }),

      // 4. Fetch this month's payments
      apiClient.get('/payments', {
        params: {
          merchant_id: merchantId,
          status: 'paid',
          created_at_gte: currentMonth.start.toISOString(),
          select: 'amount',
        },
      }),

      // 5. Fetch last month's payments
      apiClient.get('/payments', {
        params: {
          merchant_id: merchantId,
          status: 'paid',
          created_at_gte: lastMonth.start.toISOString(),
          created_at_lte: lastMonth.end.toISOString(),
          select: 'amount',
        },
      }),

      // 6. Fetch last month's active tenants
      apiClient.get('/contracts', {
        params: {
          merchant_id: merchantId,
          status: 'active',
          created_at_lte: lastMonth.end.toISOString(),
          count: 'exact',
          select: 'id',
        },
      }),
    ]);

    // Process Properties
    const properties: Array<{ id: string; name: string; total_units: number; occupied_units: number }> =
      propertiesRes.data?.data || propertiesRes.data || [];
    const totalProperties = properties.length;
    const totalUnits = properties.reduce((sum, p) => sum + (p.total_units || 0), 0);
    const occupiedUnits = properties.reduce((sum, p) => sum + (p.occupied_units || 0), 0);
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    // Process Financials
    const escrowList: Array<{ balance: number; pending_balance: number }> =
      escrowRes.data?.data || escrowRes.data || [];
    const escrow = escrowList[0] || { balance: 0, pending_balance: 0 };

    const monthlyPayments: Array<{ amount: number }> =
      monthlyPaymentsRes.data?.data || monthlyPaymentsRes.data || [];
    const lastMonthPayments: Array<{ amount: number }> =
      lastMonthPaymentsRes.data?.data || lastMonthPaymentsRes.data || [];

    const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const lastMonthRevenue = lastMonthPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    let revenueGrowth = 0;
    if (lastMonthRevenue > 0) {
      revenueGrowth = ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    } else if (monthlyRevenue > 0) {
      revenueGrowth = 100;
    }

    // Process Tenants
    const activeTenants: number =
      activeTenantsRes.data?.count ?? (activeTenantsRes.data?.data?.length || 0);
    const lastMonthActive: number =
      lastMonthTenantsRes.data?.count ?? (lastMonthTenantsRes.data?.data?.length || 0);

    let tenantGrowth = 0;
    if (lastMonthActive > 0) {
      tenantGrowth = ((activeTenants - lastMonthActive) / lastMonthActive) * 100;
    } else if (activeTenants > 0) {
      tenantGrowth = 100;
    }

    return {
      properties: {
        total: totalProperties,
        totalUnits,
        occupiedUnits,
        occupancyRate,
        list: properties,
      },
      financials: {
        balance: Number(escrow.balance) || 0,
        pendingBalance: Number(escrow.pending_balance) || 0,
        monthlyRevenue,
        lastMonthRevenue,
        revenueGrowth,
      },
      tenants: {
        active: activeTenants,
        lastMonthActive,
        growth: tenantGrowth,
      },
    };
  },
};
