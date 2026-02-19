import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { CheckCircle, CreditCard, Loader2 } from "lucide-react";
import { formatCurrency } from "@/shared/utils/currency";

interface PaymentConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentDetails: {
    invoiceNumber: string;
    amount: number;
    paymentMethod: string;
    dueDate: string;
    description?: string;
  };
  onConfirm: () => Promise<void>;
}

export function PaymentConfirmationDialog({
  open,
  onOpenChange,
  paymentDetails,
  onConfirm,
}: PaymentConfirmationDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Konfirmasi Pembayaran
          </AlertDialogTitle>
          <AlertDialogDescription>
            Pastikan detail pembayaran berikut sudah benar sebelum melanjutkan.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">No. Invoice</span>
              <span className="font-medium">{paymentDetails.invoiceNumber}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Jumlah</span>
              <span className="text-lg font-bold text-primary">
                {formatCurrency(paymentDetails.amount)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Metode Pembayaran</span>
              <Badge variant="secondary">{paymentDetails.paymentMethod}</Badge>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Jatuh Tempo</span>
              <span className="font-medium">{paymentDetails.dueDate}</span>
            </div>
            {paymentDetails.description && (
              <>
                <Separator />
                <div className="flex justify-between items-start">
                  <span className="text-sm text-muted-foreground">Deskripsi</span>
                  <span className="text-sm text-right max-w-[200px]">
                    {paymentDetails.description}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 text-sm">
            <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-muted-foreground">
              Dengan mengklik "Bayar Sekarang", Anda menyetujui untuk melakukan pembayaran sesuai detail di atas.
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              "Bayar Sekarang"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
