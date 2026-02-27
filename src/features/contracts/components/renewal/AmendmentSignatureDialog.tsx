import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Badge } from '@/shared/components/ui/badge';
import { SignaturePad } from '@/features/signature/components/SignaturePad';
import { Check, PenLine } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: 'merchant' | 'tenant';
  amendmentId: string;
  merchantSigned: boolean;
  tenantSigned: boolean;
  onSign: (id: string, signatureData: string) => void;
}

export function AmendmentSignatureDialog({ open, onOpenChange, role, amendmentId, merchantSigned, tenantSigned, onSign }: Props) {
  const canSign = role === 'merchant' ? !merchantSigned : (merchantSigned && !tenantSigned);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="h-5 w-5" />
            Tanda Tangan Amandemen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex gap-3">
            <div className="flex items-center gap-2">
              {merchantSigned ? (
                <Badge className="bg-success/10 text-success border-success/30">
                  <Check className="h-3 w-3 mr-1" /> Merchant
                </Badge>
              ) : (
                <Badge variant="secondary">Merchant: Belum</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {tenantSigned ? (
                <Badge className="bg-success/10 text-success border-success/30">
                  <Check className="h-3 w-3 mr-1" /> Penyewa
                </Badge>
              ) : (
                <Badge variant="secondary">Penyewa: Belum</Badge>
              )}
            </div>
          </div>

          {canSign ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {role === 'merchant'
                  ? 'Tanda tangani sebagai Merchant. Setelah ini, penyewa akan diminta menandatangani.'
                  : 'Tanda tangani sebagai Penyewa untuk menyelesaikan amandemen.'}
              </p>
              <SignaturePad
                onSave={(data) => onSign(amendmentId, data)}
                width={360}
                height={180}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {role === 'tenant' && !merchantSigned
                ? 'Menunggu merchant menandatangani terlebih dahulu.'
                : merchantSigned && tenantSigned
                  ? 'Amandemen sudah ditandatangani oleh kedua belah pihak. ✅'
                  : 'Anda sudah menandatangani. Menunggu pihak lain.'}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
