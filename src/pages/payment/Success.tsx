import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, FileText, Home, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface TransactionDetails {
  amount: number;
  invoiceNumber?: string;
  paymentMethod?: string;
  paidAt?: string;
}

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [transaction, setTransaction] = useState<TransactionDetails | null>(null);

  const externalId = searchParams.get('external_id');

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!externalId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('xendit_transactions')
          .select(`
            amount,
            payment_method,
            payment_channel,
            paid_at,
            invoice:invoices(invoice_number)
          `)
          .eq('external_id', externalId)
          .single();

        if (!error && data) {
          const invoiceData = data.invoice as unknown as { invoice_number: string } | null;
          setTransaction({
            amount: data.amount,
            invoiceNumber: invoiceData?.invoice_number,
            paymentMethod: data.payment_channel || data.payment_method || 'Unknown',
            paidAt: data.paid_at,
          });
        }
      } catch (err) {
        console.error('Error fetching transaction:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransaction();
  }, [externalId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Pembayaran Berhasil!</CardTitle>
          <CardDescription>
            Terima kasih, pembayaran Anda telah berhasil diproses.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {transaction && (
            <div className="rounded-lg bg-muted p-4 space-y-3 text-left">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jumlah</span>
                <span className="font-semibold">
                  Rp {transaction.amount.toLocaleString('id-ID')}
                </span>
              </div>
              {transaction.invoiceNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">No. Invoice</span>
                  <span className="font-medium">{transaction.invoiceNumber}</span>
                </div>
              )}
              {transaction.paymentMethod && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Metode Pembayaran</span>
                  <span className="font-medium">{transaction.paymentMethod}</span>
                </div>
              )}
              {transaction.paidAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Waktu Pembayaran</span>
                  <span className="font-medium">
                    {new Date(transaction.paidAt).toLocaleString('id-ID')}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => navigate('/tenant/invoices')} 
              className="w-full gap-2"
            >
              <FileText className="h-4 w-4" />
              Lihat Invoice
            </Button>
            <Button 
              onClick={() => navigate('/tenant')} 
              variant="outline"
              className="w-full gap-2"
            >
              <Home className="h-4 w-4" />
              Kembali ke Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
