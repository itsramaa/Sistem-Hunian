import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMerchantPayments } from '@/features/payments/hooks/useMerchantPayments';
import { MarkPaidDialog } from '@/features/payments/components/MarkPaidDialog';
import { Payment } from '@/features/payments/types';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { formatCurrency } from '@/shared/utils/currency';
import { format } from 'date-fns';
import { ArrowLeft, Bell, Calendar, CheckCircle, Clock, CreditCard, Loader2, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return <Clock className="h-5 w-5" />;
    case 'paid': return <CheckCircle className="h-5 w-5" />;
    case 'overdue': return <XCircle className="h-5 w-5" />;
    default: return <Calendar className="h-5 w-5" />;
  }
};

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
  switch (status) {
    case 'paid': return 'default';
    case 'overdue': return 'destructive';
    default: return 'secondary';
  }
};

export default function MerchantPaymentDetail() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();
  const { merchant } = useAuth();
  const { payments, isLoading, markPaid, sendReminder, isMarkingPaid, isSendingReminder } = useMerchantPayments(merchant?.id);
  const [isMarkPaidOpen, setIsMarkPaidOpen] = useState(false);

  const payment = useMemo(() => payments.find((p: Payment) => p.id === paymentId), [payments, paymentId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/merchant/payments')} className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>
        <div className="text-center py-16">
          <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Payment not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/merchant/payments')} className="gap-2 rounded-xl">
        <ArrowLeft className="h-4 w-4" /> Back to Payments
      </Button>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <PageHeader icon={CreditCard} title="Payment Details" description={`${payment.payment_type} payment`} />
        <Badge variant={getStatusVariant(payment.status)} className="text-sm px-4 py-1.5 rounded-full capitalize gap-2">
          {getStatusIcon(payment.status)}
          {payment.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Amount */}
          <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-8 text-center">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Amount</p>
            <p className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {formatCurrency(Number(payment.amount))}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Type', value: payment.payment_type, capitalize: true },
              { label: 'Due Date', value: format(new Date(payment.due_date), 'MMMM dd, yyyy') },
              { label: 'Method', value: payment.payment_method || 'Not specified', capitalize: true },
              { label: 'Reference', value: payment.reference || '-' },
              ...(payment.paid_at ? [{ label: 'Paid At', value: format(new Date(payment.paid_at), 'MMMM dd, yyyy'), capitalize: false }] : []),
            ].map((item, i) => (
              <div key={i} className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
                <p className={`font-medium ${item.capitalize ? 'capitalize' : ''}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-3">
            <h3 className="font-semibold text-lg mb-2">Actions</h3>
            {(payment.status === 'pending' || payment.status === 'overdue') && (
              <>
                <Button className="w-full rounded-xl gap-2 gradient-cta text-primary-foreground" onClick={() => setIsMarkPaidOpen(true)}>
                  <CheckCircle className="h-4 w-4" /> Mark as Paid
                </Button>
                <Button variant="outline" className="w-full rounded-xl gap-2" onClick={() => sendReminder(payment.id)} disabled={isSendingReminder}>
                  {isSendingReminder ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                  Send Reminder
                </Button>
              </>
            )}
            {payment.status === 'paid' && (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 mx-auto text-success mb-2" />
                <p className="text-sm text-muted-foreground">This payment has been completed</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <MarkPaidDialog
        open={isMarkPaidOpen}
        onOpenChange={setIsMarkPaidOpen}
        payment={payment}
        onConfirm={({ paymentId, method, reference }) => {
          markPaid({ id: paymentId, payment_method: method, reference }, {
            onSuccess: () => setIsMarkPaidOpen(false),
          });
        }}
        loading={isMarkingPaid}
      />
    </div>
  );
}