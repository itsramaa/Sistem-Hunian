import { apiClient } from "@/lib/axios";

export interface DashboardStats {
  totalMerchants: number;
  totalGMV: number;
  totalEscrow: number;
  pendingVerifications: number;
}

export const dashboardService = {
  async fetchStats(dateFilter: { from: Date; to: Date } | null): Promise<DashboardStats> {
    const params: Record<string, string> = { status: 'paid' };
    if (dateFilter) {
      params.created_at_gte = dateFilter.from.toISOString();
      params.created_at_lte = dateFilter.to.toISOString();
    }

    const [merchantsRes, paymentsRes, escrowRes, verificationsRes] = await Promise.all([
      apiClient.get('/merchants', { params: { select: 'id', count: 'exact' } }),
      apiClient.get('/payments', { params }),
      apiClient.get('/escrow-accounts', { params: { select: 'balance' } }),
      apiClient.get('/vendor-verifications', { params: { status: 'pending', select: 'id', count: 'exact' } }),
    ]);

    const payments: Array<{ amount: number }> = paymentsRes.data?.data || paymentsRes.data || [];
    const escrowAccounts: Array<{ balance: number }> = escrowRes.data?.data || escrowRes.data || [];

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const escrowBalance = escrowAccounts.reduce((sum, e) => sum + Number(e.balance), 0);

    return {
      totalMerchants: merchantsRes.data?.count || merchantsRes.data?.data?.length || 0,
      totalGMV: totalRevenue,
      totalEscrow: escrowBalance,
      pendingVerifications: verificationsRes.data?.count || verificationsRes.data?.data?.length || 0,
    };
  },

  async fetchPendingVerifications() {
    const response = await apiClient.get('/vendor-verifications', {
      params: { status: 'pending', order: 'created_at.desc', limit: 5 },
    });
    return response.data?.data || response.data || [];
  },

  async fetchRecentActivity() {
    const response = await apiClient.get('/analytics-events', {
      params: { order: 'created_at.desc', limit: 5 },
    });
    return response.data?.data || response.data || [];
  },
};
