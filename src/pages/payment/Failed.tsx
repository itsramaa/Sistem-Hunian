import { useNavigate, useSearchParams } from "react-router-dom";
import { XCircle, RefreshCw, MessageCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PaymentFailed = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const errorMessage = searchParams.get('error') || 'Pembayaran tidak berhasil diproses';
  const externalId = searchParams.get('external_id');

  const handleRetry = () => {
    // Navigate back to invoices to retry payment
    navigate('/tenant/invoices');
  };

  const handleContactSupport = () => {
    // Open WhatsApp with support message
    const message = encodeURIComponent(
      `Halo, saya mengalami masalah pembayaran.\n\nTransaction ID: ${externalId || 'N/A'}\nError: ${errorMessage}`
    );
    window.open(`https://wa.me/6281234567890?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-600">Pembayaran Gagal</CardTitle>
          <CardDescription>
            Maaf, pembayaran Anda tidak berhasil diproses.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-left">
            <p className="text-sm text-red-800">
              <strong>Detail Error:</strong>
            </p>
            <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
            {externalId && (
              <p className="text-xs text-red-600 mt-2">
                Transaction ID: {externalId}
              </p>
            )}
          </div>

          <div className="rounded-lg bg-muted p-4 text-left">
            <p className="text-sm text-muted-foreground">
              <strong>Kemungkinan penyebab:</strong>
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
              <li>Saldo tidak mencukupi</li>
              <li>Koneksi internet terputus</li>
              <li>Waktu pembayaran habis</li>
              <li>Transaksi ditolak oleh bank</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleRetry} 
              className="w-full gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Coba Lagi
            </Button>
            <Button 
              onClick={handleContactSupport} 
              variant="outline"
              className="w-full gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Hubungi Support
            </Button>
            <Button 
              onClick={() => navigate('/tenant')} 
              variant="ghost"
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

export default PaymentFailed;
