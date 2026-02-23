import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Calendar, CheckCircle, Clock, Loader2, XCircle } from 'lucide-react';
import { usePaymentPlans } from '../hooks/usePaymentPlans';

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
  const { acceptPaymentPlan, declinePaymentPlan, isAccepting, isDeclining } = usePaymentPlans();

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
        return <Badge variant="secondary" className="rounded-full"><Clock className="h-3 w-3 mr-1" />Menunggu Persetujuan</Badge>;
      case 'accepted':
        return <Badge variant="default" className="rounded-full"><CheckCircle className="h-3 w-3 mr-1" />Aktif</Badge>;
      case 'completed':
        return <Badge className="bg-success text-success-foreground rounded-full"><CheckCircle className="h-3 w-3 mr-1" />Selesai</Badge>;
      case 'defaulted':
        return <Badge variant="destructive" className="rounded-full"><XCircle className="h-3 w-3 mr-1" />Gagal</Badge>;
      case 'declined':
        return <Badge variant="outline" className="rounded-full"><XCircle className="h-3 w-3 mr-1" />Ditolak</Badge>;
      default:
        return <Badge variant="secondary" className="rounded-full">{status}</Badge>;
    }
  };

  const handleAccept = async () => {
    await acceptPaymentPlan({ planId: plan.id, invoiceId: plan.invoice_id });
  };

  const handleDecline = async () => {
    await declinePaymentPlan(plan.id);
  };

  const paidInstallments = plan.installments?.filter(i => i.status === 'paid').length || 0;
  const totalInstallments = plan.installment_count;

  return (
    <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-primary/20 hover:shadow-lg transition-all duration-300">
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
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total Tagihan', value: formatCurrency(plan.original_amount) },
            { label: 'Per Cicilan', value: formatCurrency(plan.installment_amount) },
            { label: 'Jumlah Cicilan', value: `${plan.installment_count}x ${getFrequencyLabel(plan.frequency)}` },
            { label: 'Progress', value: `${paidInstallments}/${totalInstallments} Lunas` },
          ].map((item, i) => (
            <div key={i} className="p-3 rounded-xl bg-card/80 border border-border/30">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="font-semibold text-sm">{item.value}</p>
            </div>
          ))}
        </div>

        {plan.late_fee_waived && plan.waived_amount > 0 && (
          <div className="p-3 rounded-xl bg-success/10 border border-success/20 text-sm text-success flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Denda {formatCurrency(plan.waived_amount)} dihapuskan
          </div>
        )}

        {plan.terms && (
          <div className="p-3 rounded-xl bg-muted/50 border border-border/30 text-sm">
            <p className="text-xs text-muted-foreground mb-1">Syarat:</p>
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
            <div className="border border-border/40 rounded-xl divide-y divide-border/30 max-h-48 overflow-y-auto">
              {plan.installments
                .sort((a, b) => a.installment_number - b.installment_number)
                .map((installment) => (
                <div 
                  key={installment.id} 
                  className={`flex justify-between items-center p-3 text-sm transition-colors ${
                    installment.status === 'paid' ? 'bg-success/5' : 'hover:bg-primary/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-6">#{installment.installment_number}</span>
                    <span>{formatCurrency(installment.amount)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {installment.status === 'paid' ? (
                      <span className="text-xs text-success flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" /> Lunas
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Jatuh Tempo: {installment.due_date}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {plan.status === 'pending_acceptance' && (
        <CardFooter className="flex justify-end gap-2 pt-0">
          <Button 
            variant="outline" 
            onClick={handleDecline}
            disabled={isDeclining || isAccepting}
            className="rounded-xl"
          >
            {isDeclining ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tolak'}
          </Button>
          <Button 
            onClick={handleAccept}
            disabled={isAccepting || isDeclining}
            className="gradient-cta rounded-xl"
          >
            {isAccepting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Terima Tawaran'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
