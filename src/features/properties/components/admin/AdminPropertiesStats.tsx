import { AlertTriangle, Building2, CheckCircle, Home } from "lucide-react";
import { AdminProperty } from "../../types/admin";

interface AdminPropertiesStatsProps {
  properties: AdminProperty[];
}

export function AdminPropertiesStats({ properties }: AdminPropertiesStatsProps) {
  const totalUnits = properties.reduce((acc, curr) => acc + curr.totalUnits, 0);
  const totalOccupied = properties.reduce((acc, curr) => acc + curr.occupiedUnits, 0);
  const occupancyRate = totalUnits > 0 ? Math.round((totalOccupied / totalUnits) * 100) : 0;

  const stats = [
    {
      title: "Total Properties",
      value: properties.length,
      subtitle: "+12% from last month",
      icon: Building2,
    },
    {
      title: "Active Listings",
      value: properties.filter(p => p.status === 'active').length,
      subtitle: `${properties.filter(p => p.status === 'maintenance').length} in maintenance`,
      icon: CheckCircle,
    },
    {
      title: "Total Units",
      value: totalUnits,
      subtitle: "Across all properties",
      icon: Home,
    },
    {
      title: "Occupancy Rate",
      value: `${occupancyRate}%`,
      subtitle: "Global average",
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.title}
          className="glass-stat-card group"
        >
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
            <div className="gradient-icon-box">
              <stat.icon className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold font-display">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
