import { apiClient } from "@/lib/axios";
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
    const { data } = await apiClient.get('/analytics-events', {
      params: { created_at: `gte.${startDate}`, order: 'created_at.desc', limit: 1000 },
    });
    return (data || []) as AnalyticsEvent[];
  },

  async fetchDashboardStats(): Promise<DashboardStats> {
    const [
      propertiesRes,
      unitsRes,
      occupiedUnitsRes,
      activeContractsRes,
      paymentsRes,
    ] = await Promise.all([
      apiClient.get('/properties', { params: { select: 'id', limit: 1 } }),
      apiClient.get('/units', { params: { select: 'id', limit: 1 } }),
      apiClient.get('/units', { params: { select: 'id', status: 'eq.occupied', limit: 1 } }),
      apiClient.get('/contracts', { params: { select: 'id', status: 'eq.active', limit: 1 } }),
      apiClient.get('/payments', { params: { select: 'amount', status: 'in.(completed,paid)' } }),
    ]);

    const totalRevenue = (paymentsRes.data || []).reduce((sum: number, p: { amount: number }) => sum + Number(p.amount), 0);
    // Use Content-Range header count if available, else array length
    const getCount = (res: { data: unknown[] }) => Array.isArray(res.data) ? res.data.length : 0;
    const totalUnits = getCount(unitsRes);
    const occupiedUnits = getCount(occupiedUnitsRes);

    return {
      totalProperties: getCount(propertiesRes),
      totalUnits,
      occupiedUnits,
      activeTenants: getCount(activeContractsRes),
      totalRevenue,
      occupancyRate: totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0,
    };
  },

  async fetchVendorStats() {
    const [totalRes, pendingRes, verifiedRes] = await Promise.all([
      apiClient.get('/vendors', { params: { select: 'id' } }),
      apiClient.get('/vendors', { params: { select: 'id', verification_status: 'eq.pending' } }),
      apiClient.get('/vendors', { params: { select: 'id', verification_status: 'eq.verified' } }),
    ]);
    return {
      total: (totalRes.data || []).length,
      pending: (pendingRes.data || []).length,
      verified: (verifiedRes.data || []).length,
    };
  },

  async fetchDistributionStats(): Promise<DistributionStats> {
    const [
      verifiedMerchantsRes,
      pendingMerchantsRes,
      rejectedMerchantsRes,
      occupiedUnitsRes,
      availableUnitsRes,
      maintenanceUnitsRes,
      pendingMaintenanceRes,
      inProgressMaintenanceRes,
      completedMaintenanceRes,
      churnDataRes,
    ] = await Promise.all([
      apiClient.get('/merchants', { params: { select: 'id', verification_status: 'eq.verified' } }),
      apiClient.get('/merchants', { params: { select: 'id', verification_status: 'eq.pending' } }),
      apiClient.get('/merchants', { params: { select: 'id', verification_status: 'eq.rejected' } }),
      apiClient.get('/units', { params: { select: 'id', status: 'eq.occupied' } }),
      apiClient.get('/units', { params: { select: 'id', status: 'eq.available' } }),
      apiClient.get('/units', { params: { select: 'id', status: 'eq.maintenance' } }),
      apiClient.get('/maintenance-requests', { params: { select: 'id', status: 'eq.pending' } }),
      apiClient.get('/maintenance-requests', { params: { select: 'id', status: 'eq.in_progress' } }),
      apiClient.get('/maintenance-requests', { params: { select: 'id', status: 'eq.completed' } }),
      apiClient.get('/contracts', { params: { select: 'churn_reason', 'churn_reason': 'not.is.null' } }),
    ]);

    const churnReasons: Record<string, number> = {};
    if (churnDataRes.data) {
      (churnDataRes.data as { churn_reason: string }[]).forEach((c) => {
        const reason = c.churn_reason || 'Unknown';
        churnReasons[reason] = (churnReasons[reason] || 0) + 1;
      });
    }

    return {
      merchantStatus: {
        verified: (verifiedMerchantsRes.data || []).length,
        pending: (pendingMerchantsRes.data || []).length,
        rejected: (rejectedMerchantsRes.data || []).length,
      },
      unitStatus: {
        occupied: (occupiedUnitsRes.data || []).length,
        available: (availableUnitsRes.data || []).length,
        maintenance: (maintenanceUnitsRes.data || []).length,
      },
      maintenanceStatus: {
        pending: (pendingMaintenanceRes.data || []).length,
        in_progress: (inProgressMaintenanceRes.data || []).length,
        completed: (completedMaintenanceRes.data || []).length,
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

      const [paymentsRes, propertiesRes] = await Promise.all([
        apiClient.get('/payments', {
          params: {
            select: 'amount',
            status: 'in.(completed,paid)',
            'created_at': `gte.${monthStart.toISOString()}`,
            'created_at_lte': `lte.${monthEnd.toISOString()}`,
          },
        }),
        apiClient.get('/properties', {
          params: { select: 'id', 'created_at': `lte.${monthEnd.toISOString()}` },
        }),
      ]);

      const revenue = (paymentsRes.data || []).reduce((sum: number, p: { amount: number }) => sum + Number(p.amount || 0), 0);

      months.push({
        month: format(date, 'MMM'),
        revenue,
        properties: (propertiesRes.data || []).length,
      });
    }
    return months;
  },

  async fetchTenantAnalytics(): Promise<TenantAnalyticsData> {
    const sixMonthsAgo = subMonths(new Date(), 6);

    const [contractsRes, paymentsRes] = await Promise.all([
      apiClient.get('/contracts', {
        params: {
          select: 'id,created_at,status,churn_reason,unit_id,end_date',
          or: `created_at.gte.${sixMonthsAgo.toISOString()},end_date.gte.${sixMonthsAgo.toISOString()}`,
        },
      }),
      apiClient.get('/payments', {
        params: {
          select: 'id,status,due_date,paid_at,amount',
          'created_at': `gte.${sixMonthsAgo.toISOString()}`,
        },
      }),
    ]);

    return {
      contracts: (contractsRes.data || []) as Pick<ContractData, 'id' | 'created_at' | 'status' | 'churn_reason' | 'unit_id' | 'end_date'>[],
      payments: (paymentsRes.data || []) as Pick<PaymentData, 'id' | 'status' | 'due_date' | 'paid_at' | 'amount'>[],
    };
  },

  async fetchSubscriptionAnalytics(): Promise<SubscriptionAnalyticsData> {
    const [subscriptionsRes, tiersRes] = await Promise.all([
      apiClient.get('/merchant-subscriptions', {
        params: { select: '*,subscription_tiers(name,display_name,price_monthly,price_yearly)' },
      }),
      apiClient.get('/subscription-tiers'),
    ]);

    return {
      subscriptions: subscriptionsRes.data || [],
      tiers: tiersRes.data || [],
    };
  },

  subscribeToAnalytics(_callback: () => void) {
    // TODO: Replace with WebSocket/SSE subscription when available
    // Previously used supabase.channel('analytics-realtime') for realtime INSERT events on analytics_events
    console.warn('[analyticsService] subscribeToAnalytics: realtime subscription not yet implemented with apiClient');
    return () => {
      // cleanup noop
    };
  }
};
