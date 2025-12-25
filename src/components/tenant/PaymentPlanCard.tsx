import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface PaymentPlanCardProps {
  plan: {
    id: string;
    invoice_id: string;
    original_amount: number;
    installment_count: number;
    installment_amount: number;
    frequency: string;
    start_date: string;
    late_fee_waived: boolean;
    waived_amount: number;
    status: string;
    terms: string | null;
    installments?: Array<{
      id: string;
      installment_number: number;
      amount: number;
      due_date: string;
      status: string;
    }>;
    invoice?: {
      invoice_number: string;
    };
  };
}

export function PaymentPlanCard({ plan }: PaymentPlanCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'weekly': return 'Mingguan';
      case 'bi-weekly': return 'Dua Mingguan';
      case 'monthly': return 'Bulanan';
      default: return freq;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_acceptance':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Menunggu Persetujuan</Badge>;
      case 'accepted':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Aktif</Badge>;
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Selesai</Badge>;
      case 'defaulted':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Gagal</Badge>;
      case 'declined':
        return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" />Ditolak</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const acceptPlanMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('payment_plans')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', plan.id);

      if (error) throw error;

      // Update invoice to link payment plan
      await supabase
        .from('invoices')
        .update({ payment_plan_id: plan.id })
        .eq('id', plan.invoice_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Rencana Cicilan Diterima',
        description: 'Anda sekarang dapat membayar sesuai jadwal cicilan.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal Menerima Rencana',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const declinePlanMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('payment_plans')
        .update({ status: 'declined' })
        .eq('id', plan.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
      toast({
        title: 'Rencana Cicilan Ditolak',
        description: 'Anda dapat membayar tagihan penuh.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal Menolak Rencana',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const paidInstallments = plan.installments?.filter(i => i.status === 'paid').length || 0;
  const totalInstallments = plan.installment_count;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Rencana Cicilan</CardTitle>
            <CardDescription>
              Invoice #{plan.invoice?.invoice_number || plan.invoice_id.slice(0, 8)}
            </CardDescription>
          </div>
          {getStatusBadge(plan.status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total Tagihan</p>
            <p className="font-semibold">{formatCurrency(plan.original_amount)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Per Cicilan</p>
            <p className="font-semibold">{formatCurrency(plan.installment_amount)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Jumlah Cicilan</p>
            <p className="font-semibold">{plan.installment_count}x {getFrequencyLabel(plan.frequency)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Progress</p>
            <p className="font-semibold">{paidInstallments}/{totalInstallments} Lunas</p>
          </div>
        </div>

        {plan.late_fee_waived && plan.waived_amount > 0 && (
          <div className="p-2 bg-green-50 dark:bg-green-950 rounded text-sm text-green-700 dark:text-green-300">
            ✓ Denda {formatCurrency(plan.waived_amount)} dihapuskan
          </div>
        )}

        {plan.terms && (
          <div className="p-2 bg-muted rounded text-sm">
            <p className="text-muted-foreground">Syarat:</p>
            <p>{plan.terms}</p>
          </div>
        )}

        {/* Installment Schedule */}
        {plan.status === 'accepted' && plan.installments && plan.installments.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Jadwal Cicilan
            </p>
            <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
              {plan.installments
                .sort((a, b) => a.installment_number - b.installment_number)
                .map((installment) => (
                <div 
                  key={installment.id} 
                  className={`flex justify-between items-center p-2 text-sm ${
                    installment.status === 'paid' ? 'bg-green-50 dark:bg-green-950' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {installment.status === 'paid' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span>Cicilan {installment.installment_number}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(installment.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(installment.due_date), 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {plan.status === 'pending_acceptance' && (
        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => declinePlanMutation.mutate()}
            disabled={declinePlanMutation.isPending}
          >
            {declinePlanMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Tolak'
            )}
          </Button>
          <Button
            className="flex-1"
            onClick={() => acceptPlanMutation.mutate()}
            disabled={acceptPlanMutation.isPending}
          >
            {acceptPlanMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Terima Cicilan'
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
