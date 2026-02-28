import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { addDays } from "date-fns";

interface AlertCounts {
  overdueInvoices: number;
  pendingExpenses: number;
  staleMaintenance: number;
  expiringContracts: number;
  total: number;
}

export function useAlertCounts(merchantId: string | undefined) {
  return useQuery({
    queryKey: ["alert-counts", merchantId],
    queryFn: async (): Promise<AlertCounts> => {
      if (!merchantId) return { overdueInvoices: 0, pendingExpenses: 0, staleMaintenance: 0, expiringContracts: 0, total: 0 };

      const thirtyDaysFromNow = addDays(new Date(), 30).toISOString();

      const [r1, r2, r3, r4] = await Promise.all([
        (supabase.from("invoices").select("id", { count: "exact", head: true })
          .eq("merchant_id", merchantId) as any).or("status.eq.overdue,status.eq.escalated"),
        (supabase.from("expenses").select("id", { count: "exact", head: true })
          .eq("merchant_id", merchantId) as any).eq("status", "pending_approval"),
        (supabase.from("maintenance_requests").select("id", { count: "exact", head: true })
          .eq("merchant_id", merchantId) as any).eq("status", "pending"),
        (supabase.from("contracts").select("id", { count: "exact", head: true })
          .eq("merchant_id", merchantId).eq("status", "active") as any).lte("end_date", thirtyDaysFromNow),
      ]);

      const overdueInvoices = r1.count ?? 0;
      const pendingExpenses = r2.count ?? 0;
      const staleMaintenance = r3.count ?? 0;
      const expiringContracts = r4.count ?? 0;
      const total = overdueInvoices + pendingExpenses + staleMaintenance + expiringContracts;

      return { overdueInvoices, pendingExpenses, staleMaintenance, expiringContracts, total };
    },
    enabled: !!merchantId,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
