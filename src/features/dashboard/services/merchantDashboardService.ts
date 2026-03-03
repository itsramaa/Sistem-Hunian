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

/**
 * Fetch unit IDs for a given property. Used to scope queries on tables
 * that don't have a direct property_id column.
 */
async function fetchUnitIdsForProperty(propertyId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('units')
    .select('id')
    .eq('property_id', propertyId);
  if (error) throw error;
  return (data || []).map((u) => u.id);
}

/**
 * Fetch contract IDs scoped to a set of unit IDs + merchant.
 */
async function fetchContractIdsForUnits(merchantId: string, unitIds: string[]): Promise<string[]> {
  if (unitIds.length === 0) return [];
  const { data, error } = await supabase
    .from('contracts')
    .select('id')
    .eq('merchant_id', merchantId)
    .in('unit_id', unitIds);
  if (error) throw error;
  return (data || []).map((c) => c.id);
}

function calcGrowth(current: number, previous: number): number {
  if (previous > 0) return ((current - previous) / previous) * 100;
  if (current > 0) return 100;
  return 0;
}

export const merchantDashboardService = {
  async fetchStats(merchantId: string, propertyId?: string | null): Promise<MerchantDashboardStats> {
    const currentMonth = getCurrentMonthDateRange();
    const lastMonth = getPreviousMonthDateRange();

    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

    // --- Phase 1: Resolve scope IDs if property-scoped ---
    let unitIds: string[] | null = null;
    let contractIds: string[] | null = null;

    if (propertyId) {
      unitIds = await fetchUnitIdsForProperty(propertyId);
      contractIds = await fetchContractIdsForUnits(merchantId, unitIds);
    }

    // Helper: apply unit_id scoping to a query builder (uses any to avoid TS2589 deep instantiation)
    const scopeByUnit = (q: any): any => {
      if (unitIds && unitIds.length > 0) return q.in('unit_id', unitIds);
      if (unitIds && unitIds.length === 0) return q.in('unit_id', ['__none__']);
      return q;
    };

    const scopeByContract = (q: any): any => {
      if (contractIds && contractIds.length > 0) return q.in('contract_id', contractIds);
      if (contractIds && contractIds.length === 0) return q.in('contract_id', ['__none__']);
      return q;
    };

    // --- Phase 2: Parallelize all queries ---
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
      // 1. Properties
      (() => {
        let q = supabase.from('properties').select('id, name, total_units, occupied_units').eq('merchant_id', merchantId);
        if (propertyId) q = q.eq('id', propertyId);
        return q;
      })(),

      // 2. Pending transfers (portfolio-level, no property scoping)
      (supabase as any)
        .from('payment_transfers')
        .select('net_amount, status')
        .eq('merchant_id', merchantId)
        .eq('status', 'pending'),

      // 3. Active tenants (scoped by unit)
      (() => {
        let q = supabase.from('contracts').select('id', { count: 'exact', head: true })
          .eq('merchant_id', merchantId).eq('status', 'active');
        return scopeByUnit(q);
      })(),

      // 4. This month's payments (scoped by contract)
      (() => {
        let q = (supabase as any).from('payments').select('amount')
          .eq('merchant_id', merchantId).eq('status', 'paid')
          .gte('created_at', currentMonth.start.toISOString());
        return scopeByContract(q);
      })(),

      // 5. Last month's payments (scoped by contract)
      (() => {
        let q = (supabase as any).from('payments').select('amount')
          .eq('merchant_id', merchantId).eq('status', 'paid')
          .gte('created_at', lastMonth.start.toISOString())
          .lte('created_at', lastMonth.end.toISOString());
        return scopeByContract(q);
      })(),

      // 6. Last month's active tenants (scoped by unit)
      (() => {
        let q = supabase.from('contracts').select('id', { count: 'exact', head: true })
          .eq('merchant_id', merchantId).eq('status', 'active')
          .lte('created_at', lastMonth.end.toISOString());
        return scopeByUnit(q);
      })(),

      // 7. Overdue invoices (scoped by property_id)
      (() => {
        let q = (supabase as any).from('invoices').select('total_amount')
          .eq('merchant_id', merchantId).in('status', ['overdue', 'escalated']);
        if (propertyId) q = q.eq('property_id', propertyId);
        return q;
      })(),

      // 8. Stale maintenance (scoped by unit)
      (() => {
        let q = supabase.from('maintenance_requests').select('id', { count: 'exact', head: true })
          .eq('merchant_id', merchantId).eq('status', 'pending')
          .lte('created_at', fiveDaysAgo.toISOString());
        return scopeByUnit(q);
      })(),

      // 9. Expiring contracts within 30 days (scoped by unit)
      (() => {
        let q = supabase.from('contracts').select('id', { count: 'exact', head: true })
          .eq('merchant_id', merchantId).eq('status', 'active')
          .lte('end_date', thirtyDaysFromNow.toISOString())
          .gte('end_date', new Date().toISOString());
        return scopeByUnit(q);
      })(),

      // 10. Upcoming contract endings 30-60 days (scoped by unit)
      (() => {
        let q = supabase.from('contracts').select('id, end_date, unit_id')
          .eq('merchant_id', merchantId).eq('status', 'active')
          .gt('end_date', thirtyDaysFromNow.toISOString())
          .lte('end_date', sixtyDaysFromNow.toISOString())
          .order('end_date', { ascending: true }).limit(5);
        return scopeByUnit(q);
      })(),

      // 11. Completed transfers (portfolio-level, no property scoping)
      (supabase as any)
        .from('payment_transfers')
        .select('net_amount')
        .eq('merchant_id', merchantId)
        .eq('status', 'completed'),

      // 12. Unpaid invoices (scoped by property_id)
      (() => {
        let q = (supabase as any).from('invoices').select('total_amount')
          .eq('merchant_id', merchantId).in('status', ['pending', 'overdue']);
        if (propertyId) q = q.eq('property_id', propertyId);
        return q;
      })(),
    ]);

    if (propertiesRes.error) throw propertiesRes.error;

    // --- Process results ---
    const properties = propertiesRes.data || [];
    const totalUnits = properties.reduce((sum, p) => sum + (p.total_units || 0), 0);
    const occupiedUnits = properties.reduce((sum, p) => sum + (p.occupied_units || 0), 0);
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    const pendingTransfers = escrowRes.data || [];
    const pendingBalance = pendingTransfers.reduce((sum: number, t: any) => sum + Number(t.net_amount || 0), 0);
    const monthlyRevenue = monthlyPaymentsRes.data?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
    const lastMonthRevenue = lastMonthPaymentsRes.data?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;

    const completedTransfers = completedTransfersRes.data || [];
    const availableBalance = completedTransfers.reduce((sum: number, t: any) => sum + Number(t.net_amount || 0), 0);

    const unpaidInvoices = unpaidInvoicesRes.data || [];
    const outstandingReceivables = unpaidInvoices.reduce((sum: number, inv: any) => sum + Number(inv.total_amount || 0), 0);

    const activeTenants = activeTenantsRes.count || 0;
    const lastMonthActive = lastMonthTenantsRes.count || 0;

    const overdueInvoicesList = overdueInvoicesRes.data || [];
    const overdueInvoicesTotal = overdueInvoicesList.reduce((sum: number, inv: any) => sum + Number(inv.total_amount || 0), 0);

    const upcomingEvents: UpcomingEvent[] = (upcomingContractsRes.data || []).map((c: any) => ({
      type: 'contract_ending' as const,
      description: `Kontrak unit ${c.unit_id?.substring(0, 8)} berakhir`,
      date: c.end_date,
      link: `/merchant/contracts`,
    }));

    return {
      properties: {
        total: properties.length,
        totalUnits,
        occupiedUnits,
        occupancyRate,
        list: properties,
      },
      financials: {
        balance: availableBalance,
        pendingBalance,
        monthlyRevenue,
        lastMonthRevenue,
        revenueGrowth: calcGrowth(monthlyRevenue, lastMonthRevenue),
        outstandingReceivables,
        outstandingInvoiceCount: unpaidInvoices.length,
      },
      tenants: {
        active: activeTenants,
        lastMonthActive,
        growth: calcGrowth(activeTenants, lastMonthActive),
      },
      alerts: {
        overdueInvoices: { count: overdueInvoicesList.length, totalAmount: overdueInvoicesTotal },
        staleMaintenance: staleMaintenanceRes.count || 0,
        expiringContracts: expiringContractsRes.count || 0,
        upcomingEvents,
      },
    };
  },
};
