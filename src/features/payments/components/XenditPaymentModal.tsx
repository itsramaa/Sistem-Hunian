import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { differenceInHours, differenceInMinutes, format } from 'date-fns';
import { AlertTriangle, Building2, Check, Clock, CreditCard, ExternalLink, Loader2, QrCode, RefreshCw, Wallet } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useXenditPayment } from '../hooks/useXenditPayment';
import { CreateXenditInvoicePayload } from '../services/xenditService';

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
  onRetry?: () => void;
}

const PAYMENT_METHOD_KEY = 'sihuni_last_payment_method';

const PAYMENT_METHODS = [
  { id: 'bank_transfer', label: 'Bank Transfer', icon: Building2, description: 'BCA, Mandiri, BNI, BRI' },
  { id: 'ewallet', label: 'E-Wallet', icon: Wallet, description: 'OVO, DANA, GoPay, ShopeePay' },
  { id: 'qris', label: 'QRIS', icon: QrCode, description: 'Scan QR untuk bayar' },
  { id: 'credit_card', label: 'Credit Card', icon: CreditCard, description: 'Visa, Mastercard' },
];

export function XenditPaymentModal({
  open, onOpenChange, paymentId, invoiceId, orderId,
  amount, originalAmount, lateFee, description,
  payerEmail, payerName, userId, paymentType, onSuccess, onRetry,
}: XenditPaymentModalProps) {
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'creating' | 'pending' | 'failed'>('idle');
  const [vaExpiryTime, setVaExpiryTime] = useState<Date | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>(() => {
    try { return localStorage.getItem(PAYMENT_METHOD_KEY) || ''; } catch { return ''; }
  });

  const { createInvoice, isCreating, reset } = useXenditPayment();

  const saveLastMethod = (method: string) => {
    try { localStorage.setItem(PAYMENT_METHOD_KEY, method); } catch {}
  };

  const handleCreateInvoice = async () => {
    setPaymentStatus('creating');
    try {
      const payload: CreateXenditInvoicePayload = {
        payment_id: paymentId, invoice_id: invoiceId, order_id: orderId,
        amount, description, payer_email: payerEmail, payer_name: payerName,
        user_id: userId, payment_type: paymentType, preferred_method: selectedMethod,
      };
      const data = await createInvoice(payload);
      setPaymentUrl(data.payment_url);
      setPaymentStatus('pending');
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 24);
      setVaExpiryTime(expiry);
      if (selectedMethod) saveLastMethod(selectedMethod);
      toast.success('Payment link created! Click to proceed.');
    } catch (error) {
      setPaymentStatus('failed');
    }
  };

  const handleProceedToPayment = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank');
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const handleRetry = () => {
    setPaymentStatus('idle');
    setPaymentUrl(null);
    reset();
    onRetry?.();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  const hasLateFee = lateFee && lateFee > 0;

  const getExpiryCountdown = () => {
    if (!vaExpiryTime) return null;
    const now = new Date();
    const hoursLeft = differenceInHours(vaExpiryTime, now);
    const minutesLeft = differenceInMinutes(vaExpiryTime, now) % 60;
    if (hoursLeft < 0) return { text: 'Expired', urgent: true };
    if (hoursLeft < 3) return { text: `${hoursLeft}h ${minutesLeft}m left`, urgent: true };
    return { text: `${hoursLeft}h ${minutesLeft}m left`, urgent: false };
  };

  const expiryCountdown = getExpiryCountdown();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            Pay {formatCurrency(amount)}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Payment Method Selection */}
          {paymentStatus === 'idle' && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Select Payment Method:</p>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((method) => {
                  const isSelected = selectedMethod === method.id;
                  const wasLastUsed = localStorage.getItem(PAYMENT_METHOD_KEY) === method.id;
                  
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`flex flex-col items-start gap-1 p-3 rounded-xl border transition-all text-left ${
                        isSelected 
                          ? 'border-primary bg-primary/5 shadow-sm' 
                          : 'border-border/40 bg-card/80 backdrop-blur-sm hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <method.icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="text-sm font-medium">{method.label}</span>
                        {wasLastUsed && !isSelected && (
                          <Badge variant="secondary" className="text-xs ml-auto rounded-full">Last</Badge>
                        )}
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary ml-auto" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{method.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Summary */}
          <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-muted/50 to-muted/30 p-4 space-y-2">
            {hasLateFee && originalAmount ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Original Amount</span>
                  <span>{formatCurrency(originalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />Late Fee
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
            <div className="border-t border-border/30 pt-2 flex justify-between font-medium">
              <span>Total</span>
              <span className="text-primary font-bold">{formatCurrency(amount)}</span>
            </div>
          </div>

          {/* VA Expiry Countdown */}
          {paymentStatus === 'pending' && expiryCountdown && (
            <div className={`flex items-center gap-2 p-3 rounded-xl ${
              expiryCountdown.urgent 
                ? 'bg-destructive/10 border border-destructive/20' 
                : 'bg-warning/10 border border-warning/20'
            }`}>
              <Clock className={`h-5 w-5 ${expiryCountdown.urgent ? 'text-destructive' : 'text-warning'}`} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${expiryCountdown.urgent ? 'text-destructive' : 'text-warning'}`}>
                  Payment expires in {expiryCountdown.text}
                </p>
                <p className="text-xs text-muted-foreground">
                  Complete before {vaExpiryTime && format(vaExpiryTime, 'MMM d, HH:mm')}
                </p>
              </div>
            </div>
          )}

          {/* Late Fee Warning */}
          {hasLateFee && paymentStatus === 'idle' && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Late Fee Applied</p>
                <p className="text-muted-foreground">A late fee has been added because this invoice was overdue.</p>
              </div>
            </div>
          )}

          {/* Failed State */}
          {paymentStatus === 'failed' && (
            <div className="space-y-4">
              <Alert variant="destructive" className="rounded-xl">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>Payment creation failed. Please try again.</AlertDescription>
              </Alert>
              <Button variant="outline" className="w-full rounded-xl" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />Try Again
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          {paymentStatus === 'idle' && (
            <Button className="w-full gradient-cta rounded-xl" onClick={handleCreateInvoice} disabled={!selectedMethod}>
              Generate Payment Link
            </Button>
          )}
          {paymentStatus === 'creating' && (
            <Button className="w-full rounded-xl" disabled>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating Payment...
            </Button>
          )}
          {paymentStatus === 'pending' && paymentUrl && (
            <Button className="w-full gradient-cta rounded-xl" onClick={handleProceedToPayment}>
              <ExternalLink className="h-4 w-4 mr-2" />Proceed to Payment
            </Button>
          )}

          <p className="text-xs text-center text-muted-foreground">Secure payment powered by Xendit</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
