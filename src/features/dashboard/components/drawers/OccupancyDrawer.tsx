import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/shared/components/ui/sheet';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { Badge } from '@/shared/components/ui/badge';
import type { MerchantDashboardStats } from '@/features/dashboard/services/merchantDashboardService';

interface OccupancyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: MerchantDashboardStats | undefined;
}

export function OccupancyDrawer({ open, onOpenChange, stats }: OccupancyDrawerProps) {
  const navigate = useNavigate();
  const occupancy = Math.round(stats?.properties.occupancyRate || 0);
  const properties = stats?.properties.list || [];
  const sorted = [...properties]
    .map(p => ({ ...p, occ: p.total_units > 0 ? (p.occupied_units / p.total_units) * 100 : 0 }))
    .sort((a, b) => b.occ - a.occ)
    .slice(0, 5);

  const statusLabel = occupancy >= 80 ? 'BAIK' : occupancy >= 50 ? 'PERHATIAN' : 'KRITIS';
  const statusClass = occupancy >= 80 ? 'bg-success/20 text-success border-success/30' : occupancy >= 50 ? 'bg-warning/20 text-warning border-warning/30' : 'bg-destructive/20 text-destructive border-destructive/30';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-success" />
            Tingkat Hunian
          </SheetTitle>
          <SheetDescription>
            {stats?.properties.occupiedUnits || 0} terisi dari {stats?.properties.totalUnits || 0} total unit
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl font-bold">{occupancy}%</span>
            <Badge className={`${statusClass}`}>{statusLabel}</Badge>
          </div>
          <Progress value={occupancy} className="h-3 rounded-full" />

          <div className="space-y-1 pt-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Top 5 Properti</h4>
            {sorted.map(prop => (
              <div key={prop.id} className="flex items-center justify-between py-2 text-sm">
                <span className="truncate mr-2">{prop.name}</span>
                <span className="text-muted-foreground shrink-0">{Math.round(prop.occ)}%</span>
              </div>
            ))}
          </div>
        </div>

        <SheetFooter className="mt-6">
          <Button className="w-full rounded-xl" onClick={() => { onOpenChange(false); navigate('/merchant/properties'); }}>
            Lihat Detail Hunian
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
