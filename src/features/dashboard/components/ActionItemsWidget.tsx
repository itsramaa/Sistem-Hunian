import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { useMerchantDashboardStats } from '@/features/dashboard/hooks/useMerchantDashboardStats';
import { AlertTriangle, Clock, CheckCircle2, ArrowRight, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ActionItem {
  severity: 'urgent' | 'upcoming' | 'on_track';
  label: string;
  count: number;
  actionLabel: string;
  path: string;
}

export function ActionItemsWidget() {
  const { data: stats } = useMerchantDashboardStats();
  const navigate = useNavigate();

  const overdueCount = stats?.alerts?.overdueInvoices?.count || 0;
  const staleCount = stats?.alerts?.staleMaintenance || 0;
  const expiringCount = stats?.alerts?.expiringContracts || 0;

  const items: ActionItem[] = [];

  // Urgent items
  if (overdueCount > 0) {
    items.push({
      severity: 'urgent',
      label: `${overdueCount} tagihan overdue`,
      count: overdueCount,
      actionLabel: 'Lihat Penagihan',
      path: '/merchant/collections',
    });
  }
  if (staleCount > 0) {
    items.push({
      severity: 'urgent',
      label: `${staleCount} maintenance tertunda >5 hari`,
      count: staleCount,
      actionLabel: 'Lihat Maintenance',
      path: '/merchant/maintenance',
    });
  }

  // Upcoming items
  if (expiringCount > 0) {
    items.push({
      severity: 'upcoming',
      label: `${expiringCount} kontrak berakhir dalam 30 hari`,
      count: expiringCount,
      actionLabel: 'Lihat Kontrak',
      path: '/merchant/contracts',
    });
  }

  const hasTasks = items.length > 0;

  const severityConfig = {
    urgent: {
      icon: AlertTriangle,
      badge: 'URGENT',
      badgeClass: 'bg-destructive/20 text-destructive border-destructive/30',
      borderClass: 'border-l-destructive',
    },
    upcoming: {
      icon: Clock,
      badge: 'MENDATANG',
      badgeClass: 'bg-warning/20 text-warning border-warning/30',
      borderClass: 'border-l-warning',
    },
    on_track: {
      icon: CheckCircle2,
      badge: 'BAIK',
      badgeClass: 'bg-success/20 text-success border-success/30',
      borderClass: 'border-l-success',
    },
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">📋 Prioritas Hari Ini</h2>
      <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-destructive/20 to-destructive/5 flex items-center justify-center">
              <ClipboardList className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <CardTitle>Item Tindakan</CardTitle>
              <CardDescription>
                {hasTasks ? `${items.length} item memerlukan perhatian` : 'Semua berjalan lancar'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, i) => {
            const config = severityConfig[item.severity];
            return (
              <div
                key={i}
                className={`flex items-center justify-between rounded-xl border border-border/40 border-l-4 ${config.borderClass} p-3 hover:bg-muted/50 transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <config.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <span className="text-sm font-medium">{item.label}</span>
                    <Badge variant="outline" className={`ml-2 text-[9px] ${config.badgeClass}`}>
                      {config.badge}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs shrink-0"
                  onClick={() => navigate(item.path)}
                >
                  {item.actionLabel}
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            );
          })}

          {!hasTasks && (
            <div className="flex items-center gap-3 rounded-xl border border-border/40 border-l-4 border-l-success p-4">
              <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
              <div>
                <p className="text-sm font-medium">Semua berjalan sesuai rencana ✓</p>
                <p className="text-xs text-muted-foreground">Tidak ada item urgent atau mendatang</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
