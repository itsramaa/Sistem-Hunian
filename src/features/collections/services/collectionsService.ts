import { supabase } from '@/integrations/supabase/client';

export interface AgingBucketSummary {
  bucket: string;
  bucketOrder: number;
  count: number;
  totalAmount: number;
}

export interface CollectionsSummaryData {
  agingBuckets: AgingBucketSummary[];
  totalOutstanding: number;
  totalOutstandingCount: number;
  collectionsToday: number;
  collectionsTodayCount: number;
  expectedThisWeek: number;
  expectedThisWeekCount: number;
  collectionRatePercent: number;
}

export interface OutstandingInvoice {
  invoiceId: string;
  merchantId: string;
  tenantUserId: string;
  contractId: string;
  unitId: string;
  unitNumber: string;
  tenantName: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  daysOverdue: number;
  agingBucket: string;
  bucketOrder: number;
  dueDate: string;
  lastPaymentDate: string | null;
  status: string;
}

export const collectionsService = {
  async fetchSummary(merchantId: string): Promise<CollectionsSummaryData> {
    // 1. Aging buckets from the view
    const { data: outstanding, error } = await supabase
      .from('v_outstanding_summary')
      .select('*')
      .eq('merchant_id', merchantId);

    if (error) throw error;

    const rows = outstanding || [];

    // Group by aging bucket
    const bucketMap = new Map<string, AgingBucketSummary>();
    for (const row of rows) {
      const key = row.aging_bucket as string;
      const existing = bucketMap.get(key);
      if (existing) {
        existing.count++;
        existing.totalAmount += Number(row.outstanding_amount);
      } else {
        bucketMap.set(key, {
          bucket: key,
          bucketOrder: Number(row.bucket_order),
          count: 1,
          totalAmount: Number(row.outstanding_amount),
        });
      }
    }

    const agingBuckets = Array.from(bucketMap.values()).sort((a, b) => a.bucketOrder - b.bucketOrder);
    const totalOutstanding = rows.reduce((sum, r) => sum + Number(r.outstanding_amount), 0);
    const totalOutstandingCount = rows.length;

    // 2. Collections today (payments paid today for this merchant)
    const today = new Date().toISOString().split('T')[0];
    const { data: todayPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('merchant_id', merchantId)
      .eq('status', 'paid')
      .gte('paid_at', `${today}T00:00:00`)
      .lte('paid_at', `${today}T23:59:59`);

    const collectionsToday = (todayPayments || []).reduce((s, p) => s + Number(p.amount), 0);
    const collectionsTodayCount = (todayPayments || []).length;

    // 3. Expected this week (invoices due within next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const { data: weekInvoices } = await supabase
      .from('invoices')
      .select('total_amount')
      .eq('merchant_id', merchantId)
      .in('status', ['sent', 'overdue', 'partially_paid'])
      .gte('due_date', today)
      .lte('due_date', nextWeek.toISOString().split('T')[0]);

    const expectedThisWeek = (weekInvoices || []).reduce((s, i) => s + Number(i.total_amount), 0);
    const expectedThisWeekCount = (weekInvoices || []).length;

    // 4. Collection rate this month (paid on time / total due this month)
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    const { count: totalDueThisMonth } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchantId)
      .gte('due_date', monthStartStr);

    const { count: paidOnTimeThisMonth } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchantId)
      .eq('status', 'paid')
      .gte('due_date', monthStartStr);

    const collectionRatePercent = totalDueThisMonth && totalDueThisMonth > 0
      ? Math.round(((paidOnTimeThisMonth || 0) / totalDueThisMonth) * 100)
      : 0;

    return {
      agingBuckets,
      totalOutstanding,
      totalOutstandingCount,
      collectionsToday,
      collectionsTodayCount,
      expectedThisWeek,
      expectedThisWeekCount,
      collectionRatePercent,
    };
  },

  async fetchOutstandingInvoices(merchantId: string, agingBucket?: string): Promise<OutstandingInvoice[]> {
    let query = supabase
      .from('v_outstanding_summary')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('days_overdue', { ascending: false });

    if (agingBucket) {
      query = query.eq('aging_bucket', agingBucket);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((row) => ({
      invoiceId: row.invoice_id as string,
      merchantId: row.merchant_id as string,
      tenantUserId: row.tenant_user_id as string,
      contractId: row.contract_id as string,
      unitId: row.unit_id as string,
      unitNumber: row.unit_number as string || '-',
      tenantName: row.tenant_name as string || 'N/A',
      invoiceNumber: row.invoice_number as string,
      totalAmount: Number(row.total_amount),
      paidAmount: Number(row.paid_amount),
      outstandingAmount: Number(row.outstanding_amount),
      daysOverdue: Number(row.days_overdue),
      agingBucket: row.aging_bucket as string,
      bucketOrder: Number(row.bucket_order),
      dueDate: row.due_date as string,
      lastPaymentDate: row.last_payment_date as string | null,
      status: row.status as string,
    }));
  },

  async sendReminder(invoiceId: string, tenantUserId: string) {
    const { error } = await supabase.functions.invoke('send-payment-reminder', {
      body: { invoiceId, tenantUserId },
    });
    if (error) throw error;
  },
};
