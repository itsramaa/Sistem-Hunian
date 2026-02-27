import { supabase } from '@/integrations/supabase/client';

export interface Expense {
  id: string;
  merchantId: string;
  propertyId: string | null;
  unitId: string | null;
  category: string;
  subcategory: string | null;
  description: string | null;
  amount: number;
  currency: string;
  expenseDate: string;
  paymentMethod: string | null;
  receiptUrl: string | null;
  approvalStatus: string;
  notes: string | null;
  isRecurring: boolean;
  taxDeductible: boolean;
  createdAt: string;
}

export interface ExpenseSummary {
  totalThisMonth: number;
  countThisMonth: number;
  byCategory: { category: string; total: number; count: number }[];
  lastMonthTotal: number;
  trend: number; // percentage change
}

export interface CreateExpenseInput {
  merchantId: string;
  propertyId?: string;
  unitId?: string;
  category: string;
  subcategory?: string;
  description?: string;
  amount: number;
  expenseDate: string;
  paymentMethod?: string;
  notes?: string;
  isRecurring?: boolean;
  taxDeductible?: boolean;
  receiptUrl?: string;
  ocrData?: Record<string, unknown>;
  autoApprove?: boolean;
}

const EXPENSE_CATEGORIES = [
  'utilities', 'maintenance', 'insurance', 'tax', 'marketing', 'admin', 'payroll', 'other'
] as const;

export { EXPENSE_CATEGORIES };

export const expenseService = {
  async fetchSummary(merchantId: string): Promise<ExpenseSummary> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

    // This month expenses
    const { data: thisMonth } = await supabase
      .from('expenses')
      .select('amount, category')
      .eq('merchant_id', merchantId)
      .gte('expense_date', monthStart)
      .in('approval_status', ['approved', 'verified', 'submitted']);

    // Last month total
    const { data: lastMonth } = await supabase
      .from('expenses')
      .select('amount')
      .eq('merchant_id', merchantId)
      .gte('expense_date', lastMonthStart)
      .lte('expense_date', lastMonthEnd)
      .in('approval_status', ['approved', 'verified', 'submitted']);

    const expenses = thisMonth || [];
    const totalThisMonth = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const lastMonthTotal = (lastMonth || []).reduce((s, e) => s + Number(e.amount), 0);

    // Group by category
    const catMap = new Map<string, { total: number; count: number }>();
    for (const e of expenses) {
      const existing = catMap.get(e.category) || { total: 0, count: 0 };
      existing.total += Number(e.amount);
      existing.count++;
      catMap.set(e.category, existing);
    }

    return {
      totalThisMonth,
      countThisMonth: expenses.length,
      byCategory: Array.from(catMap.entries()).map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.total - a.total),
      lastMonthTotal,
      trend: lastMonthTotal > 0 ? Math.round(((totalThisMonth - lastMonthTotal) / lastMonthTotal) * 100) : 0,
    };
  },

  async fetchExpenses(merchantId: string, limit = 50): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('expense_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(e => ({
      id: e.id,
      merchantId: e.merchant_id,
      propertyId: e.property_id,
      unitId: e.unit_id,
      category: e.category,
      subcategory: e.subcategory,
      description: e.description,
      amount: Number(e.amount),
      currency: e.currency,
      expenseDate: e.expense_date,
      paymentMethod: e.payment_method,
      receiptUrl: e.receipt_url,
      approvalStatus: e.approval_status,
      notes: e.notes,
      isRecurring: e.is_recurring,
      taxDeductible: e.tax_deductible,
      createdAt: e.created_at,
    }));
  },

  async createExpense(input: CreateExpenseInput) {
    const approvalStatus = input.autoApprove ? 'approved' : 'pending_approval';
    const insertData: Record<string, unknown> = {
      merchant_id: input.merchantId,
      property_id: input.propertyId || null,
      unit_id: input.unitId || null,
      category: input.category,
      subcategory: input.subcategory || null,
      description: input.description || null,
      amount: input.amount,
      expense_date: input.expenseDate,
      payment_method: input.paymentMethod || null,
      notes: input.notes || null,
      is_recurring: input.isRecurring || false,
      tax_deductible: input.taxDeductible || false,
      approval_status: approvalStatus,
      receipt_url: input.receiptUrl || null,
      ocr_data: input.ocrData || null,
      approved_at: input.autoApprove ? new Date().toISOString() : null,
    };
    const { error } = await supabase.from('expenses').insert(insertData as any);
    if (error) throw error;
  },

  async approveExpense(id: string, userId: string) {
    const { error } = await supabase
      .from('expenses')
      .update({
        approval_status: 'approved',
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
  },

  async rejectExpense(id: string) {
    const { error } = await supabase
      .from('expenses')
      .update({ approval_status: 'rejected' })
      .eq('id', id);
    if (error) throw error;
  },

  async fetchPendingApprovals(merchantId: string): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('merchant_id', merchantId)
      .eq('approval_status', 'pending_approval')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(e => ({
      id: e.id,
      merchantId: e.merchant_id,
      propertyId: e.property_id,
      unitId: e.unit_id,
      category: e.category,
      subcategory: e.subcategory,
      description: e.description,
      amount: Number(e.amount),
      currency: e.currency,
      expenseDate: e.expense_date,
      paymentMethod: e.payment_method,
      receiptUrl: e.receipt_url,
      approvalStatus: e.approval_status,
      notes: e.notes,
      isRecurring: e.is_recurring,
      taxDeductible: e.tax_deductible,
      createdAt: e.created_at,
    }));
  },

  async deleteExpense(id: string) {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
  },
};
