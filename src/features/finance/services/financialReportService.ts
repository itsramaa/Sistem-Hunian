import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

export interface MonthlyFinancialData {
  month: string;
  revenue: number;
  expenses: number;
  netIncome: number;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  monthlyData: MonthlyFinancialData[];
  revenueByProperty: { property_name: string; revenue: number }[];
  expenseByCategory: { category: string; amount: number }[];
}

export const financialReportService = {
  async fetchFinancialSummary(merchantId: string, months = 6): Promise<FinancialSummary> {
    const now = new Date();
    const startDate = format(startOfMonth(subMonths(now, months - 1)), "yyyy-MM-dd");

    // Fetch paid invoices
    const { data: invoices } = await supabase
      .from("invoices")
      .select("amount, paid_at, property_id")
      .eq("merchant_id", merchantId)
      .eq("status", "paid")
      .gte("paid_at", startDate);

    // Fetch expenses
    const { data: expenses } = await supabase
      .from("expenses")
      .select("amount, category, expense_date")
      .eq("merchant_id", merchantId)
      .gte("expense_date", startDate);

    // Fetch property names
    const { data: properties } = await supabase
      .from("properties")
      .select("id, name")
      .eq("merchant_id", merchantId);

    const propMap = new Map((properties || []).map((p) => [p.id, p.name]));

    // Build monthly data
    const monthlyMap = new Map<string, { revenue: number; expenses: number }>();
    for (let i = months - 1; i >= 0; i--) {
      const m = format(subMonths(now, i), "yyyy-MM");
      monthlyMap.set(m, { revenue: 0, expenses: 0 });
    }

    let totalRevenue = 0;
    const revByProp = new Map<string, number>();
    for (const inv of invoices || []) {
      const m = inv.paid_at ? format(new Date(inv.paid_at), "yyyy-MM") : null;
      if (m && monthlyMap.has(m)) {
        monthlyMap.get(m)!.revenue += inv.amount;
      }
      totalRevenue += inv.amount;
      const pName = propMap.get(inv.property_id) || "Lainnya";
      revByProp.set(pName, (revByProp.get(pName) || 0) + inv.amount);
    }

    let totalExpenses = 0;
    const expByCat = new Map<string, number>();
    for (const exp of expenses || []) {
      const m = exp.expense_date ? format(new Date(exp.expense_date), "yyyy-MM") : null;
      if (m && monthlyMap.has(m)) {
        monthlyMap.get(m)!.expenses += exp.amount;
      }
      totalExpenses += exp.amount;
      expByCat.set(exp.category, (expByCat.get(exp.category) || 0) + exp.amount);
    }

    const monthlyData: MonthlyFinancialData[] = Array.from(monthlyMap.entries()).map(([month, d]) => ({
      month,
      revenue: d.revenue,
      expenses: d.expenses,
      netIncome: d.revenue - d.expenses,
    }));

    return {
      totalRevenue,
      totalExpenses,
      netIncome: totalRevenue - totalExpenses,
      monthlyData,
      revenueByProperty: Array.from(revByProp.entries()).map(([property_name, revenue]) => ({ property_name, revenue })),
      expenseByCategory: Array.from(expByCat.entries()).map(([category, amount]) => ({ category, amount })),
    };
  },
};
