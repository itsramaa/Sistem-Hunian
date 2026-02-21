import { supabase } from "@/lib/integrations/supabase/client";
import { endOfMonth, format, startOfMonth, subDays, subMonths } from "date-fns";
import {
  AnalyticsEvent,
  ContractData,
  DashboardStats,
  DistributionStats,
  MonthlyRevenueData,
  PaymentData,
  SubscriptionAnalyticsData,
  TenantAnalyticsData
} from "../types";

export const analyticsService = {
  async fetchAnalyticsEvents(days = 7): Promise<AnalyticsEvent[]> {
    const startDate = subDays(new Date(), days).toISOString();
    const { data, error } = await supabase
      .from('analytics_events')
      .select('*')
      .gte('created_at', startDate)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw error;
    return (data || []) as AnalyticsEvent[];
  },

  async fetchDashboardStats(): Promise<DashboardStats> {
    const [
      { count: propertyCount },
      { count: unitCount },
      { count: occupiedUnitCount },
      { count: activeContractCount }
    ] = await Promise.all([
      supabase.from('properties').select('*', { count: 'exact', head: true }),
      supabase.from('units').select('*', { count: 'exact', head: true }),
      supabase.from('units').select('*', { count: 'exact', head: true }).eq('status', 'occupied'),
      supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    ]);

    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .in('status', ['completed', 'paid']);

    const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const totalUnits = unitCount || 0;
    const occupiedUnits = occupiedUnitCount || 0;

    return {
      totalProperties: propertyCount || 0,
      totalUnits,
      occupiedUnits,
      activeTenants: activeContractCount || 0,
      totalRevenue,
      occupancyRate: totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0,
    };
  },

  async fetchVendorStats() {
    const { count: total, error: totalError } = await supabase.from('vendors').select('*', { count: 'exact', head: true });
    if (totalError) throw totalError;

    const { count: pending, error: pendingError } = await supabase.from('vendors').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending');
    if (pendingError) throw pendingError;

    const { count: verified, error: verifiedError } = await supabase.from('vendors').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified');
    if (verifiedError) throw verifiedError;

    return { total: total || 0, pending: pending || 0, verified: verified || 0 };
  },

  async fetchDistributionStats(): Promise<DistributionStats> {
    // Merchant Status
    const [
      { count: verifiedMerchants },
      { count: pendingMerchants },
      { count: rejectedMerchants }
    ] = await Promise.all([
      supabase.from('merchants').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
      supabase.from('merchants').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
      supabase.from('merchants').select('*', { count: 'exact', head: true }).eq('verification_status', 'rejected'),
    ]);

    // Unit Status
    const [
      { count: occupiedUnits },
      { count: availableUnits },
      { count: maintenanceUnits }
    ] = await Promise.all([
      supabase.from('units').select('*', { count: 'exact', head: true }).eq('status', 'occupied'),
      supabase.from('units').select('*', { count: 'exact', head: true }).eq('status', 'available'),
      supabase.from('units').select('*', { count: 'exact', head: true }).eq('status', 'maintenance'),
    ]);

    // Maintenance Request Status
    const [
      { count: pendingMaintenance },
      { count: inProgressMaintenance },
      { count: completedMaintenance }
    ] = await Promise.all([
      supabase.from('maintenance_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('maintenance_requests').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
      supabase.from('maintenance_requests').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    ]);

    // Churn Reasons (Top 5)
    // Note: This still requires fetching contracts with churn_reason, but we can limit fields
    const { data: churnData } = await supabase
      .from('contracts')
      .select('churn_reason')
      .not('churn_reason', 'is', null);

    const churnReasons: Record<string, number> = {};
    if (churnData) {
      churnData.forEach((c) => {
        const reason = c.churn_reason || 'Unknown';
        churnReasons[reason] = (churnReasons[reason] || 0) + 1;
      });
    }

    return {
      merchantStatus: {
        verified: verifiedMerchants || 0,
        pending: pendingMerchants || 0,
        rejected: rejectedMerchants || 0,
      },
      unitStatus: {
        occupied: occupiedUnits || 0,
        available: availableUnits || 0,
        maintenance: maintenanceUnits || 0,
      },
      maintenanceStatus: {
        pending: pendingMaintenance || 0,
        in_progress: inProgressMaintenance || 0,
        completed: completedMaintenance || 0,
      },
      churnReasons,
    };
  },

  async fetchMonthlyRevenue(): Promise<MonthlyRevenueData[]> {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const { data: monthPayments } = await supabase
        .from('payments')
        .select('amount')
        .in('status', ['completed', 'paid'])
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      const { count: propertyCount } = await supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .lte('created_at', monthEnd.toISOString());

      const revenue = (monthPayments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
      
      months.push({
        month: format(date, 'MMM'),
        revenue,
        properties: propertyCount || 0,
      });
    }
    return months;
  },

  async fetchTenantAnalytics(): Promise<TenantAnalyticsData> {
    const sixMonthsAgo = subMonths(new Date(), 6);
    
    const [contractsRes, paymentsRes] = await Promise.all([
      supabase
        .from('contracts')
        .select('id, created_at, status, churn_reason, unit_id, end_date')
        .or(`created_at.gte.${sixMonthsAgo.toISOString()},end_date.gte.${sixMonthsAgo.toISOString()}`),
      supabase
        .from('payments')
        .select('id, status, due_date, paid_at, amount')
        .gte('created_at', sixMonthsAgo.toISOString()),
    ]);

    if (contractsRes.error) throw contractsRes.error;
    if (paymentsRes.error) throw paymentsRes.error;

    return {
      contracts: (contractsRes.data || []) as Pick<ContractData, 'id' | 'created_at' | 'status' | 'churn_reason' | 'unit_id' | 'end_date'>[],
      payments: (paymentsRes.data || []) as Pick<PaymentData, 'id' | 'status' | 'due_date' | 'paid_at' | 'amount'>[],
    };
  },

  async fetchSubscriptionAnalytics(): Promise<SubscriptionAnalyticsData> {
    const [subscriptionsRes, tiersRes] = await Promise.all([
      supabase
        .from('merchant_subscriptions')
        .select('*, subscription_tiers(name, display_name, price_monthly, price_yearly)'),
      supabase.from('subscription_tiers').select('*'),
    ]);

    if (subscriptionsRes.error) throw subscriptionsRes.error;
    if (tiersRes.error) throw tiersRes.error;

    return {
      subscriptions: subscriptionsRes.data || [],
      tiers: tiersRes.data || [],
    };
  },

  subscribeToAnalytics(callback: () => void) {
    const channel = supabase
      .channel('analytics-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_events',
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
