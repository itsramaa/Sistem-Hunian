import { useNavigate } from 'react-router-dom';
import { Wallet, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/shared/components/ui/sheet';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { formatCurrency } from '@/shared/utils/currency';
import type { MerchantDashboardStats } from '@/features/dashboard/services/merchantDashboardService';

interface RevenueBreakdownDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: MerchantDashboardStats | undefined;
}

export function RevenueBreakdownDrawer({ open, onOpenChange, stats }: RevenueBreakdownDrawerProps) {
  const navigate = useNavigate();
  const revenue = stats?.financials.monthlyRevenue || 0;
  const lastMonth = stats?.financials.lastMonthRevenue || 0;
  const growth = stats?.financials.revenueGrowth || 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-accent" />
            Rincian Pendapatan
          </SheetTitle>
          <SheetDescription>Pendapatan bulan ini vs bulan lalu</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div>
            <span className="text-3xl font-bold">{formatCurrency(revenue)}</span>
            <div className="flex items-center gap-2 mt-1">
              {growth > 0 ? (
                <Badge className="bg-success/20 text-success border-success/30"><ArrowUpRight className="h-3 w-3 mr-0.5" />+{Math.round(growth)}%</Badge>
              ) : growth < 0 ? (
                <Badge className="bg-destructive/20 text-destructive border-destructive/30"><ArrowDownRight className="h-3 w-3 mr-0.5" />{Math.round(growth)}%</Badge>
              ) : (
                <Badge className="bg-muted text-muted-foreground"><Minus className="h-3 w-3 mr-0.5" />Stabil</Badge>
              )}
              <span className="text-xs text-muted-foreground">vs bulan lalu</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl border border-border/40">
              <span className="text-sm text-muted-foreground">Bulan Ini</span>
              <span className="text-sm font-semibold">{formatCurrency(revenue)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-border/40">
              <span className="text-sm text-muted-foreground">Bulan Lalu</span>
              <span className="text-sm font-semibold">{formatCurrency(lastMonth)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-border/40">
              <span className="text-sm text-muted-foreground">Saldo Tersedia</span>
              <span className="text-sm font-semibold">{formatCurrency(stats?.financials.balance || 0)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-border/40">
              <span className="text-sm text-muted-foreground">Piutang</span>
              <span className="text-sm font-semibold text-warning">{formatCurrency(stats?.financials.outstandingReceivables || 0)}</span>
            </div>
          </div>
        </div>

        <SheetFooter className="mt-6">
          <Button className="w-full rounded-xl" onClick={() => { onOpenChange(false); navigate('/merchant/reports'); }}>
            Lihat Laporan Lengkap
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
