import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, FileText, CreditCard, Wrench, ClipboardList, CalendarClock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertActionCard, type AlertItemExtended } from '@/features/notifications/components/AlertActionCard';
import { InlinePaymentMatchDialog } from '@/features/collections/components/InlinePaymentMatchDialog';
import { collectionsService } from '@/features/collections/services/collectionsService';
import type { OutstandingInvoice } from '@/features/collections/services/collectionsService';

export default function MerchantAlerts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { merchant } = useAuth();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [actionedMap, setActionedMap] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [showDismissed, setShowDismissed] = useState(false);
  const [matchInvoice, setMatchInvoice] = useState<OutstandingInvoice | null>(null);

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['merchant-alerts', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const items: AlertItemExtended[] = [];

      // Overdue invoices - now fetching extra metadata
      const { data: overdueInvoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, amount, total_amount, due_date, tenant_name, tenant_user_id, contract_id, unit_number')
        .eq('merchant_id', merchant.id)
        .in('status', ['overdue', 'escalated'])
        .order('due_date', { ascending: true })
        .limit(20);

      (overdueInvoices || []).forEach(inv => {
        const daysOverdue = Math.floor((Date.now() - new Date(inv.due_date).getTime()) / 86400000);
        items.push({
          id: `overdue-${inv.id}`,
          type: 'overdue',
          title: `Tagihan ${inv.invoice_number} overdue`,
          description: `${inv.tenant_name || 'Penyewa'} - Rp ${Number(inv.amount).toLocaleString('id-ID')}`,
          severity: 'high',
          path: `/merchant/invoices/${inv.id}`,
          invoiceId: inv.id,
          tenantUserId: inv.tenant_user_id,
          contractId: inv.contract_id,
          merchantId: merchant.id,
          invoiceAmount: Number(inv.total_amount || inv.amount),
          unitNumber: inv.unit_number || undefined,
          tenantName: inv.tenant_name || undefined,
          daysOverdue: Math.max(0, daysOverdue),
        });
      });

      // Pending expense approvals
      const { data: pendingExpenses } = await supabase
        .from('expenses')
        .select('id, amount, category, description')
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

      // Overdue preventive maintenance
      const today = new Date().toISOString().split('T')[0];
      const { data: overdueSchedules } = await supabase
        .from('preventive_maintenance_schedules')
        .select('id, title, next_scheduled_date, category')
        .eq('merchant_id', merchant.id)
        .eq('is_active', true)
        .lt('next_scheduled_date', today)
        .limit(10);

      (overdueSchedules || []).forEach((s: any) => {
        items.push({
          id: `preventive-${s.id}`,
          type: 'preventive_overdue',
          title: `Jadwal preventif terlambat: ${s.title}`,
          description: `Seharusnya: ${new Date(s.next_scheduled_date).toLocaleDateString('id-ID')} - ${s.category}`,
          severity: 'medium',
          path: '/merchant/preventive-maintenance',
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
    preventive_overdue: CalendarClock,
  };

  const visibleAlerts = useMemo(() =>
    alerts.filter(a => showDismissed || !dismissedIds.has(a.id)),
    [alerts, dismissedIds, showDismissed]
  );

  const dismissedCount = useMemo(() =>
    alerts.filter(a => dismissedIds.has(a.id)).length,
    [alerts, dismissedIds]
  );

  const handleAction = async (alert: AlertItemExtended, action: string) => {
    switch (action) {
      case 'send_reminder':
        if (!alert.invoiceId || !alert.tenantUserId) return;
        setActionLoading(true);
        try {
          await collectionsService.sendReminder(alert.invoiceId, alert.tenantUserId);
          toast.success('Pengingat berhasil dikirim');
          setActionedMap(prev => ({ ...prev, [alert.id]: 'Pengingat berhasil dikirim' }));
        } catch {
          toast.error('Gagal mengirim pengingat');
        } finally {
          setActionLoading(false);
        }
        break;

      case 'process_payment':
        if (!alert.invoiceId || !alert.tenantUserId || !alert.merchantId) return;
        setMatchInvoice({
          invoiceId: alert.invoiceId,
          merchantId: alert.merchantId,
          tenantUserId: alert.tenantUserId,
          contractId: alert.contractId || '',
          unitId: '',
          unitNumber: alert.unitNumber || '',
          tenantName: alert.tenantName || '',
          invoiceNumber: alert.title.replace('Tagihan ', '').replace(' overdue', ''),
          totalAmount: alert.invoiceAmount || 0,
          paidAmount: 0,
          outstandingAmount: alert.invoiceAmount || 0,
          daysOverdue: alert.daysOverdue || 0,
          agingBucket: '',
          bucketOrder: 0,
          dueDate: '',
          lastPaymentDate: null,
          status: 'overdue',
        });
        break;

      case 'navigate':
        navigate(alert.path);
        break;

      case 'dismiss':
        setDismissedIds(prev => new Set(prev).add(alert.id));
        setExpandedId(null);
        toast('Alert di-dismiss', { description: alert.title });
        break;
    }
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
          <p className="text-sm text-muted-foreground">
            {visibleAlerts.length} item memerlukan perhatian
            {dismissedCount > 0 && !showDismissed && ` (${dismissedCount} di-dismiss)`}
          </p>

          {visibleAlerts.map(alert => (
            <AlertActionCard
              key={alert.id}
              alert={alert}
              icon={iconMap[alert.type]}
              expanded={expandedId === alert.id}
              onToggle={() => setExpandedId(prev => prev === alert.id ? null : alert.id)}
              onAction={(action) => handleAction(alert, action)}
              actioned={actionedMap[alert.id] || null}
              actionLoading={actionLoading && expandedId === alert.id}
            />
          ))}

          {dismissedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground gap-1.5"
              onClick={() => setShowDismissed(prev => !prev)}
            >
              {showDismissed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showDismissed ? 'Sembunyikan dismissed' : `Tampilkan ${dismissedCount} dismissed`}
            </Button>
          )}
        </div>
      )}

      {/* Reuse InlinePaymentMatchDialog */}
      {matchInvoice && (
        <InlinePaymentMatchDialog
          invoice={matchInvoice}
          open={!!matchInvoice}
          onOpenChange={(open) => {
            if (!open) {
              setMatchInvoice(null);
              queryClient.invalidateQueries({ queryKey: ['merchant-alerts'] });
            }
          }}
        />
      )}
    </div>
  );
}
