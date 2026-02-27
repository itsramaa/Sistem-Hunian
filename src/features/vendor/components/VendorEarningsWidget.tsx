import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Wallet, Clock, ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useNavigate } from "react-router-dom";
import { startOfMonth, isAfter } from "date-fns";

interface VendorEarningsWidgetProps {
  vendorId: string;
}

export const VendorEarningsWidget = ({ vendorId }: VendorEarningsWidgetProps) => {
  const navigate = useNavigate();

  const { data: balanceData } = useQuery({
    queryKey: ["vendor-earnings-balance", vendorId],
    queryFn: async () => {
      const { data: earnings, error: earningsError } = await supabase
        .from("vendor_earnings")
        .select("net_amount, status, created_at")
        .eq("vendor_id", vendorId);

      if (earningsError) throw earningsError;

      const { data: disbursements, error: disbursementsError } = await supabase
        .from("disbursements")
        .select("net_amount, status")
        .eq("vendor_id", vendorId);

      if (disbursementsError) throw disbursementsError;

      const totalEarned = earnings?.reduce((sum, e) => sum + e.net_amount, 0) || 0;
      const pendingPayout = earnings
        ?.filter(e => e.status === "pending")
        .reduce((sum, e) => sum + e.net_amount, 0) || 0;
      
      const totalDisbursed = disbursements
        ?.filter(d => d.status === "completed")
        .reduce((sum, d) => sum + d.net_amount, 0) || 0;

      const availableBalance = totalEarned - totalDisbursed;
      
      const thisMonthStart = startOfMonth(new Date());
      const thisMonthEarnings = earnings
        ?.filter(e => isAfter(new Date(e.created_at), thisMonthStart))
        .reduce((sum, e) => sum + e.net_amount, 0) || 0;

      return {
        availableBalance,
        pendingPayout,
        thisMonthEarnings,
        totalEarned,
      };
    },
    enabled: !!vendorId,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">Saldo Pendapatan</CardTitle>
          <CardDescription>Pendapatan dan pencairan Anda</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/vendor/earnings")}>
          Lihat Semua <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-3 rounded-lg bg-primary/10">
          <p className="text-sm text-muted-foreground mb-1">Saldo Tersedia</p>
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(balanceData?.availableBalance || 0)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-lg bg-warning/10">
              <Clock className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Menunggu Pencairan</p>
              <p className="font-medium text-sm">
                {formatCurrency(balanceData?.pendingPayout || 0)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-lg bg-success/10">
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Bulan Ini</p>
              <p className="font-medium text-sm">
                {formatCurrency(balanceData?.thisMonthEarnings || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total Pendapatan</span>
          </div>
          <span className="font-medium">{formatCurrency(balanceData?.totalEarned || 0)}</span>
        </div>
      </CardContent>
    </Card>
  );
};
