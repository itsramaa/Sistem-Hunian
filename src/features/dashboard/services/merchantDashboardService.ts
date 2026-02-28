import { supabase } from "@/lib/integrations/supabase/client";
import { getCurrentMonthDateRange, getPreviousMonthDateRange } from "@/shared/utils/dateUtils";

export interface UpcomingEvent {
  type: 'contract_ending' | 'scheduled_maintenance';
  description: string;
  date: string;
  link?: string;
}

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
    outstandingReceivables: number;
    outstandingInvoiceCount: number;
  };
  tenants: {
    active: number;
    lastMonthActive: number;
    growth: number;
  };
  alerts: {
    overdueInvoices: { count: number; totalAmount: number };
    staleMaintenance: number;
    expiringContracts: number;
    upcomingEvents: UpcomingEvent[];
  };
}

export const merchantDashboardService = {
  async fetchStats(merchantId: string, propertyId?: string | null): Promise<MerchantDashboardStats> {
    const currentMonth = getCurrentMonthDateRange();
    const lastMonth = getPreviousMonthDateRange();

    // Parallelize queries for performance
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

    const [
      propertiesRes,
      escrowRes,
      activeTenantsRes,
      monthlyPaymentsRes,
      lastMonthPaymentsRes,
      lastMonthTenantsRes,
      overdueInvoicesRes,
      staleMaintenanceRes,
      expiringContractsRes,
      upcomingContractsRes,
      completedTransfersRes,
      unpaidInvoicesRes
    ] = await Promise.all([
      // 1. Fetch properties
      (() => {
        let q = supabase.from('properties').select('id, name, total_units, occupied_units').eq('merchant_id', merchantId);
        if (propertyId) q = q.eq('id', propertyId);
        return q;
      })(),

      // 2. Fetch payment transfers balance
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
      (supabase as any)
        .from('payments')
        .select('amount')
        .eq('merchant_id', merchantId)
        .eq('status', 'paid')
        .gte('created_at', currentMonth.start.toISOString()),

      // 5. Fetch last month's payments
      (supabase as any)
        .from('payments')
        .select('amount')
        .eq('merchant_id', merchantId)
        .eq('status', 'paid')
        .gte('created_at', lastMonth.start.toISOString())
        .lte('created_at', lastMonth.end.toISOString()),

      // 6. Fetch last month's active tenants
      (() => {
        let q = supabase.from('contracts').select('id', { count: 'exact', head: true }).eq('merchant_id', merchantId).eq('status', 'active').lte('created_at', lastMonth.end.toISOString());
        return q;
      })(),

      // 7. Overdue invoices
      (supabase as any)
        .from('invoices')
        .select('total_amount')
        .eq('merchant_id', merchantId)
        .in('status', ['overdue', 'escalated']),

      // 8. Stale maintenance (pending > 5 days)
      supabase
        .from('maintenance_requests')
        .select('id', { count: 'exact', head: true })
        .eq('merchant_id', merchantId)
        .eq('status', 'pending')
        .lte('created_at', fiveDaysAgo.toISOString()),

      // 9. Expiring contracts (within 30 days)
      supabase
        .from('contracts')
        .select('id', { count: 'exact', head: true })
        .eq('merchant_id', merchantId)
        .eq('status', 'active')
        .lte('end_date', thirtyDaysFromNow.toISOString())
        .gte('end_date', new Date().toISOString()),

      // 10. Upcoming contract endings (30-60 days) for events
      supabase
        .from('contracts')
        .select('id, end_date, unit_id')
        .eq('merchant_id', merchantId)
        .eq('status', 'active')
        .gt('end_date', thirtyDaysFromNow.toISOString())
        .lte('end_date', sixtyDaysFromNow.toISOString())
        .order('end_date', { ascending: true })
        .limit(5),

      // 11. Completed transfers (available balance)
      (supabase as any)
        .from('payment_transfers')
        .select('net_amount')
        .eq('merchant_id', merchantId)
        .eq('status', 'completed'),

      // 12. Unpaid invoices (outstanding receivables)
      (supabase as any)
        .from('invoices')
        .select('total_amount')
        .eq('merchant_id', merchantId)
        .in('status', ['pending', 'overdue'])
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

    // Completed transfers = available balance
    const completedTransfers = completedTransfersRes.data || [];
    const availableBalance = completedTransfers.reduce((sum: number, t: any) => sum + Number(t.net_amount || 0), 0);

    // Outstanding receivables
    const unpaidInvoices = unpaidInvoicesRes.data || [];
    const outstandingReceivables = unpaidInvoices.reduce((sum: number, inv: any) => sum + Number(inv.total_amount || 0), 0);
    const outstandingInvoiceCount = unpaidInvoices.length;
    
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

    // Process Alerts
    const overdueInvoicesList = overdueInvoicesRes.data || [];
    const overdueInvoicesCount = overdueInvoicesList.length;
    const overdueInvoicesTotal = overdueInvoicesList.reduce((sum: number, inv: any) => sum + Number(inv.total_amount || 0), 0);
    const staleMaintenanceCount = staleMaintenanceRes.count || 0;
    const expiringContractsCount = expiringContractsRes.count || 0;

    // Process Upcoming Events
    const upcomingEvents: UpcomingEvent[] = (upcomingContractsRes.data || []).map((c: any) => ({
      type: 'contract_ending' as const,
      description: `Kontrak unit ${c.unit_id?.substring(0, 8)} berakhir`,
      date: c.end_date,
      link: `/merchant/contracts`,
    }));

    return {
      properties: {
        total: totalProperties,
        totalUnits,
        occupiedUnits,
        occupancyRate,
        list: properties
      },
      financials: {
        balance: availableBalance,
        pendingBalance,
        monthlyRevenue,
        lastMonthRevenue,
        revenueGrowth,
        outstandingReceivables,
        outstandingInvoiceCount
      },
      tenants: {
        active: activeTenants,
        lastMonthActive,
        growth: tenantGrowth
      },
      alerts: {
        overdueInvoices: { count: overdueInvoicesCount, totalAmount: overdueInvoicesTotal },
        staleMaintenance: staleMaintenanceCount,
        expiringContracts: expiringContractsCount,
        upcomingEvents
      }
    };
  }
};

