import { supabase } from "@/lib/integrations/supabase/client";
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

    // Parallelize queries for performance
    const [
      propertiesRes,
      escrowRes,
      activeTenantsRes,
      monthlyPaymentsRes,
      lastMonthPaymentsRes,
      lastMonthTenantsRes
    ] = await Promise.all([
      // 1. Fetch properties
      supabase
        .from('properties')
        .select('id, name, total_units, occupied_units')
        .eq('merchant_id', merchantId),

      // 2. Fetch payment transfers balance (direct payment model)
      (supabase as any)
        .from('payment_transfers')
        .select('net_amount, status')
        .eq('merchant_id', merchantId)
        .eq('status', 'pending'),

      // 3. Fetch active tenants count
      supabase
        .from('contracts')
        .select('id', { count: 'exact', head: true })
        .eq('merchant_id', merchantId)
        .eq('status', 'active'),

      // 4. Fetch this month's payments
      supabase
        .from('payments')
        .select('amount')
        .eq('merchant_id', merchantId)
        .eq('status', 'paid')
        .gte('created_at', currentMonth.start.toISOString()),

      // 5. Fetch last month's payments
      supabase
        .from('payments')
        .select('amount')
        .eq('merchant_id', merchantId)
        .eq('status', 'paid')
        .gte('created_at', lastMonth.start.toISOString())
        .lte('created_at', lastMonth.end.toISOString()),

      // 6. Fetch last month's active tenants
      supabase
        .from('contracts')
        .select('id', { count: 'exact', head: true })
        .eq('merchant_id', merchantId)
        .eq('status', 'active')
        .lte('created_at', lastMonth.end.toISOString())
    ]);

    // Error handling could be more robust, but we'll throw for now to let React Query handle it
    if (propertiesRes.error) throw propertiesRes.error;
    
    // Process Properties
    const properties = propertiesRes.data || [];
    const totalProperties = properties.length;
    const totalUnits = properties.reduce((sum, p) => sum + (p.total_units || 0), 0);
    const occupiedUnits = properties.reduce((sum, p) => sum + (p.occupied_units || 0), 0);
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    // Process Financials (direct payment model — no escrow)
    const pendingTransfers = escrowRes.data || [];
    const pendingBalance = pendingTransfers.reduce((sum: number, t: any) => sum + Number(t.net_amount || 0), 0);
    const monthlyRevenue = monthlyPaymentsRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const lastMonthRevenue = lastMonthPaymentsRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    
    let revenueGrowth = 0;
    if (lastMonthRevenue > 0) {
      revenueGrowth = ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    } else if (monthlyRevenue > 0) {
      revenueGrowth = 100;
    }

    // Process Tenants
    const activeTenants = activeTenantsRes.count || 0;
    const lastMonthActive = lastMonthTenantsRes.count || 0;
    
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
        list: properties
      },
      financials: {
        balance: Number(escrow.balance) || 0,
        pendingBalance: Number(escrow.pending_balance) || 0,
        monthlyRevenue,
        lastMonthRevenue,
        revenueGrowth
      },
      tenants: {
        active: activeTenants,
        lastMonthActive,
        growth: tenantGrowth
      }
    };
  }
};
