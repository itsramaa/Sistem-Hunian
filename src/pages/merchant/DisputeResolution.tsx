import { useReconciliation } from '@/features/reconciliation/hooks/useReconciliation';
import { UnmatchedPaymentsTable } from '@/features/reconciliation/components/UnmatchedPaymentsTable';
import { MatchHistoryTable } from '@/features/reconciliation/components/MatchHistoryTable';
import { ReconciliationReport } from '@/features/reconciliation/components/ReconciliationReport';
import { PaymentReviewCard } from '@/features/reconciliation/components/PaymentReviewCard';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { StatCard } from '@/shared/components/ui/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Badge } from '@/shared/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle, Scale, MessageSquare, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;

export default function DisputeResolution() {
  const { merchant } = useAuth();
  const { unmatched, manualMatch, autoMatch, matchHistory } = useReconciliation();

  const payments = unmatched.data || [];
  const pendingReview = payments.filter(p => p.reconciliationStatus === 'pending_review').length;
  const unmatchedCount = payments.filter(p => p.reconciliationStatus === 'unmatched').length;

  // Fetch support tickets
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['merchant-support-tickets', merchant?.id],
    queryFn: async () => {
      const { data, error } = await db
        .from('support_tickets')
        .select('*')
        .eq('merchant_id', merchant?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!merchant?.id,
  });

  // Fetch disputes
  const { data: disputes, isLoading: disputesLoading } = useQuery({
    queryKey: ['merchant-disputes', merchant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disputes')
        .select('*')
        .eq('merchant_id', merchant!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!merchant?.id,
  });

  const openTickets = tickets?.filter((t: any) => t.status !== 'resolved' && t.status !== 'closed')?.length || 0;
  const openDisputes = disputes?.filter(d => d.status !== 'resolved')?.length || 0;
  const totalPending = unmatchedCount + pendingReview + openTickets + openDisputes;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Scale}
        title="Resolusi & Rekonsiliasi"
        description="Kelola rekonsiliasi pembayaran, keluhan penyewa, dan sengketa dalam satu tempat"
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard title="Total Pending" value={totalPending} subtitle="perlu ditangani" icon={Clock} accentColor="hsl(38 92% 50%)" loading={unmatched.isLoading} index={0} />
        <StatCard title="Belum Dicocokkan" value={unmatchedCount} subtitle="pembayaran" icon={AlertTriangle} accentColor="hsl(0 84% 60%)" loading={unmatched.isLoading} index={1} />
        <StatCard title="Keluhan Terbuka" value={openTickets} subtitle="tiket" icon={MessageSquare} accentColor="hsl(var(--primary))" loading={ticketsLoading} index={2} />
        <StatCard title="Sengketa Aktif" value={openDisputes} subtitle="kasus" icon={ShieldAlert} accentColor="hsl(280 70% 50%)" loading={disputesLoading} index={3} />
      </div>

      <Tabs defaultValue="reconciliation" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reconciliation" className="gap-2">
            Rekonsiliasi
            {(unmatchedCount + pendingReview) > 0 && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{unmatchedCount + pendingReview}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="complaints" className="gap-2">
            Keluhan Penyewa
            {openTickets > 0 && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{openTickets}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="disputes" className="gap-2">
            Sengketa
            {openDisputes > 0 && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{openDisputes}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reconciliation" className="space-y-4">
          <Tabs defaultValue="review">
            <TabsList>
              <TabsTrigger value="review">Perlu Review</TabsTrigger>
              <TabsTrigger value="history">Riwayat Cocok</TabsTrigger>
              <TabsTrigger value="report">Laporan</TabsTrigger>
            </TabsList>
            <TabsContent value="review" className="space-y-4">
              {payments.length > 0 && payments.length <= 10 ? (
                payments.map(p => (
                  <PaymentReviewCard
                    key={p.id}
                    payment={p}
                    onManualMatch={(paymentId, invoiceId, amount) => manualMatch.mutate({ paymentId, invoiceId, amount })}
                    onAutoMatch={(paymentId) => autoMatch.mutate(paymentId)}
                    isMatching={manualMatch.isPending || autoMatch.isPending}
                  />
                ))
              ) : (
                <UnmatchedPaymentsTable
                  payments={unmatched.data}
                  loading={unmatched.isLoading}
                  onManualMatch={(paymentId, invoiceId, amount) => manualMatch.mutate({ paymentId, invoiceId, amount })}
                  onAutoMatch={(paymentId) => autoMatch.mutate(paymentId)}
                  isMatching={manualMatch.isPending || autoMatch.isPending}
                />
              )}
            </TabsContent>
            <TabsContent value="history">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-lg">Riwayat Pencocokan</CardTitle></CardHeader>
                <CardContent>
                  <MatchHistoryTable matches={matchHistory.data} loading={matchHistory.isLoading} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="report">
              <ReconciliationReport matchHistory={matchHistory.data} unmatchedPayments={unmatched.data} loading={unmatched.isLoading || matchHistory.isLoading} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="complaints">
          <Card>
            <CardHeader><CardTitle className="text-lg">Keluhan Penyewa</CardTitle></CardHeader>
            <CardContent>
              {ticketsLoading ? (
                <p className="text-muted-foreground text-center py-8">Memuat...</p>
              ) : tickets && tickets.length > 0 ? (
                <div className="space-y-3">
                  {tickets.map((ticket: any) => (
                    <div key={ticket.id} className="flex items-start justify-between p-4 rounded-xl border border-border/40 hover:bg-primary/5 transition-colors">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{ticket.subject || ticket.title || 'Keluhan'}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{ticket.description || ticket.message}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(ticket.created_at).toLocaleDateString('id-ID')}</p>
                      </div>
                      <Badge variant={ticket.status === 'resolved' || ticket.status === 'closed' ? 'secondary' : 'destructive'} className="text-[10px] shrink-0">
                        {ticket.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Tidak ada keluhan penyewa</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disputes">
          <Card>
            <CardHeader><CardTitle className="text-lg">Sengketa</CardTitle></CardHeader>
            <CardContent>
              {disputesLoading ? (
                <p className="text-muted-foreground text-center py-8">Memuat...</p>
              ) : disputes && disputes.length > 0 ? (
                <div className="space-y-3">
                  {disputes.map((dispute) => (
                    <div key={dispute.id} className="flex items-start justify-between p-4 rounded-xl border border-border/40 hover:bg-primary/5 transition-colors">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{dispute.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{dispute.description}</p>
                        <div className="flex gap-2 items-center">
                          <p className="text-[10px] text-muted-foreground">{new Date(dispute.created_at).toLocaleDateString('id-ID')}</p>
                          {dispute.priority && (
                            <Badge variant={dispute.priority === 'high' ? 'destructive' : 'secondary'} className="text-[10px] px-1.5 py-0">
                              {dispute.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge variant={dispute.status === 'resolved' ? 'secondary' : 'destructive'} className="text-[10px] shrink-0">
                        {dispute.status || 'open'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Tidak ada sengketa aktif</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
