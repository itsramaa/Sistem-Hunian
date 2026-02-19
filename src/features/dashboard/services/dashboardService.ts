import { supabase } from "@/lib/integrations/supabase/client";

export interface DashboardStats {
  totalMerchants: number;
  totalGMV: number;
  totalEscrow: number;
  pendingVerifications: number;
}

export const dashboardService = {
  async fetchStats(dateFilter: { from: Date; to: Date } | null): Promise<DashboardStats> {
    let paymentsQuery = supabase.from('payments').select('amount').eq('status', 'paid');
    
    if (dateFilter) {
      paymentsQuery = paymentsQuery
        .gte('created_at', dateFilter.from.toISOString())
        .lte('created_at', dateFilter.to.toISOString());
    }

    const [merchantsRes, paymentsRes, escrowRes, verificationsRes] = await Promise.all([
      supabase.from('merchants').select('id', { count: 'exact' }),
      paymentsQuery,
      supabase.from('escrow_accounts').select('balance'),
      supabase.from('vendor_verifications').select('id', { count: 'exact' }).eq('status', 'pending'),
    ]);

    if (merchantsRes.error) throw new Error(`Merchants query failed: ${merchantsRes.error.message}`);
    if (paymentsRes.error) throw new Error(`Payments query failed: ${paymentsRes.error.message}`);
    if (escrowRes.error) throw new Error(`Escrow query failed: ${escrowRes.error.message}`);
    if (verificationsRes.error) throw new Error(`Verifications query failed: ${verificationsRes.error.message}`);

    const totalRevenue = paymentsRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const escrowBalance = escrowRes.data?.reduce((sum, e) => sum + Number(e.balance), 0) || 0;

    return {
      totalMerchants: merchantsRes.count || 0,
      totalGMV: totalRevenue,
      totalEscrow: escrowBalance,
      pendingVerifications: verificationsRes.count || 0
    };
  },

  async fetchPendingVerifications() {
    const { data, error } = await supabase
      .from('vendor_verifications')
      .select('*, vendors(business_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw new Error(`Failed to fetch pending verifications: ${error.message}`);
    return data || [];
  },

  async fetchRecentActivity() {
    const { data, error } = await supabase
      .from('analytics_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw new Error(`Failed to fetch recent activity: ${error.message}`);
    return data || [];
  }
};
