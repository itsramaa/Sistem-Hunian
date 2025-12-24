import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, Wallet, QrCode, Building2, ExternalLink, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface XenditPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId?: string;
  invoiceId?: string;
  orderId?: string;
  amount: number;
  originalAmount?: number;
  lateFee?: number;
  description: string;
  payerEmail: string;
  payerName: string;
  userId: string;
  paymentType: 'rent' | 'invoice' | 'order';
  onSuccess?: () => void;
}

export function XenditPaymentModal({
  open,
  onOpenChange,
  paymentId,
  invoiceId,
  orderId,
  amount,
  originalAmount,
  lateFee,
  description,
  payerEmail,
  payerName,
  userId,
  paymentType,
  onSuccess,
}: XenditPaymentModalProps) {
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('xendit-create-invoice', {
        body: {
          payment_id: paymentId,
          invoice_id: invoiceId,
          order_id: orderId,
          amount,
          description,
          payer_email: payerEmail,
          payer_name: payerName,
          user_id: userId,
          payment_type: paymentType,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      setPaymentUrl(data.payment_url);
      toast.success('Payment link created! Click to proceed.');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create payment: ${error.message}`);
    },
  });

  const handleProceedToPayment = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank');
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const hasLateFee = lateFee && lateFee > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pay {formatCurrency(amount)}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Methods */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Available Payment Methods:</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="text-sm">Bank Transfer</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                <Wallet className="h-5 w-5 text-primary" />
                <span className="text-sm">E-Wallet</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                <QrCode className="h-5 w-5 text-primary" />
                <span className="text-sm">QRIS</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                <CreditCard className="h-5 w-5 text-primary" />
                <span className="text-sm">Credit Card</span>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="border rounded-lg p-4 space-y-2 bg-muted/30">
            {hasLateFee && originalAmount ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Original Amount</span>
                  <span>{formatCurrency(originalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Late Fee
                  </span>
                  <span className="text-destructive">+{formatCurrency(lateFee)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span>{formatCurrency(amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service Fee</span>
              <span>Included</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-medium">
              <span>Total</span>
              <span>{formatCurrency(amount)}</span>
            </div>
          </div>

          {/* Late Fee Warning */}
          {hasLateFee && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Late Fee Applied</p>
                <p className="text-muted-foreground">
                  A late fee has been added because this invoice was overdue.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!paymentUrl ? (
            <Button
              className="w-full"
              onClick={() => createInvoiceMutation.mutate()}
              disabled={createInvoiceMutation.isPending}
            >
              {createInvoiceMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Payment...
                </>
              ) : (
                'Generate Payment Link'
              )}
            </Button>
          ) : (
            <Button className="w-full" onClick={handleProceedToPayment}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Proceed to Payment
            </Button>
          )}

          <p className="text-xs text-center text-muted-foreground">
            Secure payment powered by Xendit
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
