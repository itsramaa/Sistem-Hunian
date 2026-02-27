import { useNavigate } from 'react-router-dom';
import { Bell, FileText, CreditCard, Wrench, ClipboardList, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AlertItem {
  id: string;
  type: 'overdue' | 'expense_approval' | 'maintenance' | 'contract_expiry';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  path: string;
}

export default function MerchantAlerts() {
  const navigate = useNavigate();
  const { merchant } = useAuth();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['merchant-alerts', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const items: AlertItem[] = [];

      // Overdue invoices
      const { data: overdueInvoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, amount, due_date, tenant_name')
        .eq('merchant_id', merchant.id)
        .in('status', ['overdue', 'escalated'])
        .order('due_date', { ascending: true })
        .limit(20);

      (overdueInvoices || []).forEach(inv => {
        items.push({
          id: `overdue-${inv.id}`,
          type: 'overdue',
          title: `Tagihan ${inv.invoice_number} overdue`,
          description: `${inv.tenant_name || 'Penyewa'} - Rp ${Number(inv.amount).toLocaleString('id-ID')}`,
          severity: 'high',
          path: `/merchant/invoices/${inv.id}`,
        });
      });

      // Pending expense approvals
      const { data: pendingExpenses, count: expenseCount } = await supabase
        .from('expenses')
        .select('id, amount, category, description', { count: 'exact' })
        .eq('merchant_id', merchant.id)
        .eq('approval_status', 'pending_approval')
        .limit(10);

      (pendingExpenses || []).forEach(exp => {
        items.push({
          id: `expense-${exp.id}`,
          type: 'expense_approval',
          title: `Pengeluaran Rp ${Number(exp.amount).toLocaleString('id-ID')} menunggu approval`,
          description: exp.description || exp.category,
          severity: 'medium',
          path: '/merchant/expenses',
        });
      });

      // Urgent maintenance
      const { data: urgentMaint } = await supabase
        .from('maintenance_requests')
        .select('id, title, priority, status')
        .eq('merchant_id', merchant.id)
        .in('priority', ['urgent', 'high'])
        .in('status', ['pending', 'in_progress'])
        .limit(10);

      (urgentMaint || []).forEach(m => {
        items.push({
          id: `maint-${m.id}`,
          type: 'maintenance',
          title: `Maintenance: ${m.title}`,
          description: `Prioritas ${m.priority} - ${m.status}`,
          severity: m.priority === 'urgent' ? 'high' : 'medium',
          path: `/merchant/maintenance/${m.id}`,
        });
      });

      // Expiring contracts (30 days)
      const thirtyDaysOut = new Date();
      thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);
      const { data: expiringContracts } = await supabase
        .from('contracts')
        .select('id, contract_number, end_date, unit_id')
        .eq('merchant_id', merchant.id)
        .eq('status', 'active')
        .lte('end_date', thirtyDaysOut.toISOString().split('T')[0])
        .gte('end_date', new Date().toISOString().split('T')[0])
        .limit(10);

      (expiringContracts || []).forEach(c => {
        items.push({
          id: `contract-${c.id}`,
          type: 'contract_expiry',
          title: `Kontrak ${c.contract_number} akan berakhir`,
          description: `Berakhir: ${new Date(c.end_date).toLocaleDateString('id-ID')}`,
          severity: 'medium',
          path: `/merchant/contracts/${c.id}`,
        });
      });

      return items.sort((a, b) => {
        const sev = { high: 0, medium: 1, low: 2 };
        return sev[a.severity] - sev[b.severity];
      });
    },
    enabled: !!merchant?.id,
    staleTime: 60_000,
  });

  const iconMap = {
    overdue: FileText,
    expense_approval: CreditCard,
    maintenance: Wrench,
    contract_expiry: ClipboardList,
  };

  const colorMap = {
    high: 'border-destructive/30 bg-destructive/5',
    medium: 'border-warning/30 bg-warning/5',
    low: 'border-border',
  };

  return (
    <div className="space-y-4">
      <PageHeader icon={Bell} title="Notifikasi & Alerts" description="Hal-hal yang memerlukan perhatian Anda" />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="rounded-2xl animate-pulse h-16" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Tidak ada alert aktif. Semua berjalan lancar! 🎉</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{alerts.length} item memerlukan perhatian</p>
          {alerts.map(alert => {
            const Icon = iconMap[alert.type];
            return (
              <Card
                key={alert.id}
                className={`rounded-xl cursor-pointer hover:shadow-md transition-all ${colorMap[alert.severity]}`}
                onClick={() => navigate(alert.path)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-background flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{alert.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{alert.description}</p>
                  </div>
                  <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'} className="shrink-0 text-xs">
                    {alert.severity === 'high' ? 'Urgent' : alert.severity === 'medium' ? 'Perlu Aksi' : 'Info'}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
