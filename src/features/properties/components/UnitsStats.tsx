import { Layers, Home, Building2, Wallet, TrendingUp, Wrench } from "lucide-react";
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
  { key: 'totalUnits', label: 'Total Unit', icon: Layers, iconColor: 'text-primary' },
  { key: 'availableUnits', label: 'Tersedia', icon: Home, iconColor: 'text-success' },
  { key: 'occupiedUnits', label: 'Terisi', icon: Building2, iconColor: 'text-info' },
  { key: 'maintenanceUnits', label: 'Perbaikan', icon: Wrench, iconColor: 'text-warning' },
] as const;

export const UnitsStats = ({ stats }: UnitsStatsProps) => {
  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ key, label, icon: Icon, iconColor }) => (
          <div key={key} className="glass-stat-card p-4">
            <div className="flex items-center gap-3">
              <div className="gradient-icon-box w-10 h-10">
                <Icon className={cn("h-5 w-5", iconColor)} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{label}</p>
                <p className="text-2xl font-bold font-display">{stats[key]}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue + Occupancy row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-stat-card p-4">
          <div className="flex items-center gap-3">
            <div className="gradient-icon-box w-10 h-10">
              <Wallet className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pendapatan Bulanan</p>
              <p className="text-xl font-bold font-display">{formatCurrency(stats.totalMonthlyRent)}</p>
              <p className="text-xs text-muted-foreground">dari unit terisi</p>
            </div>
          </div>
        </div>
        <div className="glass-stat-card p-4">
          <div className="flex items-center gap-3">
            <div className="gradient-icon-box w-10 h-10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Tingkat Hunian</p>
              <p className="text-xl font-bold font-display">{Math.round(stats.occupancyRate)}%</p>
              {/* Segmented occupancy bar */}
              <div className="flex gap-1 mt-1">
                {Array.from({ length: 4 }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-all duration-700",
                      i < Math.round(stats.occupancyRate / 25)
                        ? stats.occupancyRate >= 80 ? 'bg-success' : stats.occupancyRate >= 50 ? 'bg-warning' : 'bg-destructive'
                        : 'bg-muted/60'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
