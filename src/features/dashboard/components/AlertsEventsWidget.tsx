import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Calendar, FileText, Wrench, ScrollText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import type { MerchantDashboardStats } from '../services/merchantDashboardService';
import { formatCurrency } from '@/shared/utils/currency';

interface AlertsEventsWidgetProps {
  stats: MerchantDashboardStats | undefined;
}

export function AlertsEventsWidget({ stats }: AlertsEventsWidgetProps) {
  const navigate = useNavigate();
  const alerts = stats?.alerts;

  if (!alerts) return null;

  const hasAlerts = (alerts.overdueInvoices.count > 0) || (alerts.staleMaintenance > 0) || (alerts.expiringContracts > 0);
  const hasEvents = alerts.upcomingEvents.length > 0;

  if (!hasAlerts && !hasEvents) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">Peringatan & Acara</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {/* Critical Alerts */}
        {hasAlerts && (
          <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-destructive/30">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-destructive/20 to-destructive/5 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-sm">Peringatan Kritis</CardTitle>
                  <CardDescription>Perlu tindakan segera</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.overdueInvoices.count > 0 && (
                <div
                  className="flex items-center justify-between p-3 rounded-xl bg-destructive/5 border border-destructive/20 cursor-pointer hover:bg-destructive/10 transition-colors"
                  onClick={() => navigate('/merchant/invoices')}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-destructive" />
                    <div>
                      <p className="text-sm font-medium">{alerts.overdueInvoices.count} tagihan overdue</p>
                      <p className="text-xs text-muted-foreground">Total {formatCurrency(alerts.overdueInvoices.totalAmount)}</p>
                    </div>
                  </div>
                  <Badge variant="destructive" className="text-[10px]">KRITIS</Badge>
                </div>
              )}

              {alerts.staleMaintenance > 0 && (
                <div
                  className="flex items-center justify-between p-3 rounded-xl bg-warning/5 border border-warning/20 cursor-pointer hover:bg-warning/10 transition-colors"
                  onClick={() => navigate('/merchant/maintenance')}
                >
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-warning" />
                    <div>
                      <p className="text-sm font-medium">{alerts.staleMaintenance} maintenance tertunda</p>
                      <p className="text-xs text-muted-foreground">Pending &gt; 5 hari</p>
                    </div>
                  </div>
                  <Badge className="bg-warning/20 text-warning border-warning/30 text-[10px]">PERHATIAN</Badge>
                </div>
              )}

              {alerts.expiringContracts > 0 && (
                <div
                  className="flex items-center justify-between p-3 rounded-xl bg-warning/5 border border-warning/20 cursor-pointer hover:bg-warning/10 transition-colors"
                  onClick={() => navigate('/merchant/contracts')}
                >
                  <div className="flex items-center gap-2">
                    <ScrollText className="h-4 w-4 text-warning" />
                    <div>
                      <p className="text-sm font-medium">{alerts.expiringContracts} kontrak segera berakhir</p>
                      <p className="text-xs text-muted-foreground">Dalam 30 hari ke depan</p>
                    </div>
                  </div>
                  <Badge className="bg-warning/20 text-warning border-warning/30 text-[10px]">PERHATIAN</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upcoming Events */}
        {hasEvents && (
          <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm">Acara Mendatang</CardTitle>
                  <CardDescription>Jadwal dalam 30-60 hari</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {alerts.upcomingEvents.slice(0, 5).map((event, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 transition-colors cursor-pointer"
                  onClick={() => event.link && navigate(event.link)}
                >
                  <div className="flex items-center gap-2">
                    {event.type === 'contract_ending' ? (
                      <ScrollText className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                    )}
                    <p className="text-sm">{event.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    {new Date(event.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
