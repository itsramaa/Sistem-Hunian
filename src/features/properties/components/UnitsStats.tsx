import { Layers, Home, Building2, Wallet, TrendingUp, Wrench } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { formatCurrency } from "@/shared/utils/currency";
import { cn } from "@/shared/utils/utils";

interface UnitsStatsProps {
  stats: {
    totalUnits: number;
    occupiedUnits: number;
    availableUnits: number;
    maintenanceUnits: number;
    totalMonthlyRent: number;
    occupancyRate: number;
  };
}

const statCards = [
  { key: 'totalUnits', label: 'Total Unit', icon: Layers, accent: 'border-l-primary', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
  { key: 'availableUnits', label: 'Tersedia', icon: Home, accent: 'border-l-success', iconBg: 'bg-success/10', iconColor: 'text-success' },
  { key: 'occupiedUnits', label: 'Terisi', icon: Building2, accent: 'border-l-info', iconBg: 'bg-info/10', iconColor: 'text-info' },
  { key: 'maintenanceUnits', label: 'Perbaikan', icon: Wrench, accent: 'border-l-warning', iconBg: 'bg-warning/10', iconColor: 'text-warning' },
] as const;

export const UnitsStats = ({ stats }: UnitsStatsProps) => {
  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ key, label, icon: Icon, accent, iconBg, iconColor }) => (
          <Card key={key} className={cn("border-l-4", accent)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2.5 rounded-lg", iconBg)}>
                  <Icon className={cn("h-5 w-5", iconColor)} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{label}</p>
                  <p className="text-2xl font-bold">{stats[key]}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue + Occupancy row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-accent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-accent/10">
                <Wallet className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pendapatan Bulanan</p>
                <p className="text-xl font-bold">{formatCurrency(stats.totalMonthlyRent)}</p>
                <p className="text-xs text-muted-foreground">dari unit terisi</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Tingkat Hunian</p>
                <p className="text-xl font-bold">{Math.round(stats.occupancyRate)}%</p>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary mt-1">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      stats.occupancyRate >= 80 ? 'bg-success' : stats.occupancyRate >= 50 ? 'bg-warning' : 'bg-destructive'
                    )}
                    style={{ width: `${stats.occupancyRate}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
