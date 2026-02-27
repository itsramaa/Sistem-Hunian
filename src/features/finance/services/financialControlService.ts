import { supabase } from '@/integrations/supabase/client';

export interface PendingApprovalItem {
  id: string;
  type: 'expense' | 'deposit_refund' | 'move_out';
  amount: number | null;
  description: string;
  date: string;
}

export interface RecentTransaction {
  id: string;
  type: 'payment' | 'expense' | 'refund';
  amount: number;
  description: string;
  date: string;
  status: string;
}

export interface FinancialControlData {
  cashBalance: number;
  receivables: number;
  payables: number;
  pendingApprovals: PendingApprovalItem[];
  recentTransactions: RecentTransaction[];
}

export const financialControlService = {
  async fetchFinancialControlData(merchantId: string): Promise<FinancialControlData> {
    const [
      { data: paidInvoices },
      { data: approvedExpenses },
      { data: unpaidInvoices },
      { data: pendingExpenses },
      { data: pendingRefunds },
      { data: pendingMoveOuts },
      { data: recentPayments },
      { data: recentExpenses },
    ] = await Promise.all([
      // Revenue (paid invoices)
      supabase.from('invoices').select('amount').eq('merchant_id', merchantId).eq('status', 'paid'),
      // Approved expenses
      supabase.from('expenses').select('amount').eq('merchant_id', merchantId).in('approval_status', ['approved', 'verified']),
      // Receivables (unpaid invoices)
      supabase.from('invoices').select('amount').eq('merchant_id', merchantId).in('status', ['pending', 'overdue']),
      // Pending approval expenses
      supabase.from('expenses').select('id, amount, description, category, created_at').eq('merchant_id', merchantId).eq('approval_status', 'pending_approval').order('created_at', { ascending: false }),
      // Pending deposit refunds
      supabase.from('deposit_refunds').select('id, refund_amount, contract_id, created_at').eq('status', 'pending_processing'),
      // Pending move-out notices
      supabase.from('move_out_notices').select('id, intended_move_out_date, reason, created_at, contract:contracts!move_out_notices_contract_id_fkey(merchant_id)').eq('status', 'pending_approval'),
      // Recent payments
      supabase.from('payments').select('id, amount, status, paid_at, created_at').eq('merchant_id', merchantId).order('created_at', { ascending: false }).limit(10),
      // Recent expenses
      supabase.from('expenses').select('id, amount, description, category, approval_status, created_at').eq('merchant_id', merchantId).order('created_at', { ascending: false }).limit(10),
    ]);

    const revenue = (paidInvoices || []).reduce((s, i) => s + Number(i.amount), 0);
    const totalExpenses = (approvedExpenses || []).reduce((s, e) => s + Number(e.amount), 0);
    const cashBalance = revenue - totalExpenses;
    const receivables = (unpaidInvoices || []).reduce((s, i) => s + Number(i.amount), 0);

    // Payables = pending expenses + pending refunds
    const pendingExpenseTotal = (pendingExpenses || []).reduce((s, e) => s + Number(e.amount), 0);
    const pendingRefundTotal = (pendingRefunds || []).reduce((s, r) => s + Number(r.refund_amount), 0);
    const payables = pendingExpenseTotal + pendingRefundTotal;

    // Build pending approvals list
    const approvals: PendingApprovalItem[] = [];
    (pendingExpenses || []).forEach(e => {
      approvals.push({
        id: e.id,
        type: 'expense',
        amount: Number(e.amount),
        description: e.description || e.category,
        date: e.created_at,
      });
    });

    // Filter deposit refunds by merchant (via contract join)
    (pendingRefunds || []).forEach(r => {
      approvals.push({
        id: r.id,
        type: 'deposit_refund',
        amount: Number(r.refund_amount),
        description: `Deposit Refund`,
        date: r.created_at,
      });
    });

    // Filter move-out notices by merchant
    const filteredMoveOuts = (pendingMoveOuts || []).filter((m: any) => m.contract?.merchant_id === merchantId);
    filteredMoveOuts.forEach((m: any) => {
      approvals.push({
        id: m.id,
        type: 'move_out',
        amount: null,
        description: m.reason || 'Move-out notice',
        date: m.created_at,
      });
    });

    // Build recent transactions (merge payments + expenses, sort by date, take 10)
    const transactions: RecentTransaction[] = [];
    (recentPayments || []).forEach(p => {
      transactions.push({
        id: p.id,
        type: 'payment',
        amount: Number(p.amount),
        description: 'Pembayaran',
        date: p.paid_at || p.created_at,
        status: p.status,
      });
    });
    (recentExpenses || []).forEach(e => {
      transactions.push({
        id: e.id,
        type: 'expense',
        amount: Number(e.amount),
        description: e.description || e.category,
        date: e.created_at,
        status: e.approval_status,
      });
    });

    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      cashBalance,
      receivables,
      payables,
      pendingApprovals: approvals,
      recentTransactions: transactions.slice(0, 10),
    };
  },
};
