import { useNavigate } from 'react-router-dom';
import { Users, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/shared/components/ui/sheet';
import { Button } from '@/shared/components/ui/button';
import type { MerchantDashboardStats } from '@/features/dashboard/services/merchantDashboardService';

interface TenantHealthDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: MerchantDashboardStats | undefined;
}

export function TenantHealthDrawer({ open, onOpenChange, stats }: TenantHealthDrawerProps) {
  const navigate = useNavigate();
  const active = stats?.tenants.active || 0;
  const lastMonth = stats?.tenants.lastMonthActive || 0;
  const growth = stats?.tenants.growth || 0;
  const diff = active - lastMonth;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-warning" />
            Kesehatan Penyewa
          </SheetTitle>
          <SheetDescription>Ringkasan penyewa aktif dan pertumbuhan</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div>
            <span className="text-4xl font-bold">{active}</span>
            <span className="text-lg text-muted-foreground ml-2">penyewa aktif</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-border/40">
              <span className="text-xs text-muted-foreground block mb-1">Pertumbuhan</span>
              <div className="flex items-center gap-1">
                {growth > 0 ? (
                  <span className="text-success flex items-center font-semibold"><ArrowUpRight className="h-4 w-4" />+{Math.round(growth)}%</span>
                ) : growth < 0 ? (
                  <span className="text-destructive flex items-center font-semibold"><ArrowDownRight className="h-4 w-4" />{Math.round(growth)}%</span>
                ) : (
                  <span className="text-muted-foreground flex items-center font-semibold"><Minus className="h-4 w-4" />0%</span>
                )}
              </div>
            </div>
            <div className="p-3 rounded-xl border border-border/40">
              <span className="text-xs text-muted-foreground block mb-1">vs Bulan Lalu</span>
              <span className="font-semibold">{lastMonth} → {active}</span>
              <span className="text-xs text-muted-foreground ml-1">({diff >= 0 ? '+' : ''}{diff})</span>
            </div>
          </div>
        </div>

        <SheetFooter className="mt-6">
          <Button className="w-full rounded-xl" onClick={() => { onOpenChange(false); navigate('/merchant/tenants'); }}>
            Lihat Semua Penyewa
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
