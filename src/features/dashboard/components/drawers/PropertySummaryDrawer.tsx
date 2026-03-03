import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/shared/components/ui/sheet';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { Badge } from '@/shared/components/ui/badge';
import type { MerchantDashboardStats } from '@/features/dashboard/services/merchantDashboardService';

interface PropertySummaryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: MerchantDashboardStats | undefined;
}

export function PropertySummaryDrawer({ open, onOpenChange, stats }: PropertySummaryDrawerProps) {
  const navigate = useNavigate();
  const properties = stats?.properties.list || [];
  const sorted = [...properties].sort((a, b) => {
    const occA = a.total_units > 0 ? a.occupied_units / a.total_units : 0;
    const occB = b.total_units > 0 ? b.occupied_units / b.total_units : 0;
    return occB - occA;
  }).slice(0, 5);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Ringkasan Properti
          </SheetTitle>
          <SheetDescription>
            {stats?.properties.total || 0} properti · {stats?.properties.totalUnits || 0} unit dikelola
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 mt-6">
          {sorted.map(prop => {
            const occ = prop.total_units > 0 ? (prop.occupied_units / prop.total_units) * 100 : 0;
            return (
              <div
                key={prop.id}
                className="p-3 rounded-xl border border-border/40 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => { onOpenChange(false); navigate(`/merchant/properties/${prop.id}`); }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium truncate">{prop.name}</span>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {prop.occupied_units}/{prop.total_units}
                  </Badge>
                </div>
                <Progress value={occ} className="h-1.5" />
                <span className="text-[10px] text-muted-foreground mt-1 block">{Math.round(occ)}% hunian</span>
              </div>
            );
          })}
          {properties.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Belum ada properti.</p>
          )}
        </div>

        <SheetFooter className="mt-6">
          <Button className="w-full rounded-xl" onClick={() => { onOpenChange(false); navigate('/merchant/properties'); }}>
            Lihat Semua Properti {properties.length > 5 && `(${properties.length})`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
