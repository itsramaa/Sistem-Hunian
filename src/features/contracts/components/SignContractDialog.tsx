import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { SignaturePad } from '@/features/signature/components/SignaturePad';
import { Contract } from '../types';
import { CheckCircle, Loader2, PenLine } from 'lucide-react';
import { format } from 'date-fns';

interface SignContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract | null;
  tenantName: string;
  onSign: () => void;
  loading: boolean;
  signatureDataUrl: string | null;
  onSaveSignature: (dataUrl: string) => void;
}

export function SignContractDialog({
  open, onOpenChange, contract, tenantName, onSign, loading, signatureDataUrl, onSaveSignature,
}: SignContractDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-2xl" aria-describedby="sign-contract-description">
        <DialogHeader>
          <DialogTitle>Tanda Tangani Kontrak</DialogTitle>
          <DialogDescription id="sign-contract-description">Buat tanda tangan Anda di bawah ini untuk menandatangani perjanjian sewa ini</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {contract && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/40" role="region" aria-label="Ringkasan Kontrak">
              <p className="font-medium">{contract.unit?.property?.name} - Unit {contract.unit?.unit_number}</p>
              <p className="text-sm text-muted-foreground">Penyewa: {tenantName}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(contract.start_date), 'dd MMM yyyy')} - {format(new Date(contract.end_date), 'dd MMM yyyy')}
              </p>
            </div>
          )}

          <div className="rounded-xl border border-border/40 overflow-hidden" role="application" aria-label="Pad tanda tangan">
            <SignaturePad onSave={onSaveSignature} width={400} height={150} />
          </div>

          {signatureDataUrl && (
            <div className="p-4 rounded-xl bg-success/10 border border-success/20" role="status" aria-live="polite">
              <p className="text-sm text-success flex items-center gap-2">
                <CheckCircle className="h-4 w-4" aria-hidden="true" />
                Tanda tangan berhasil diambil
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Batal</Button>
            <Button onClick={onSign} disabled={!signatureDataUrl || loading} className="gradient-cta rounded-xl">
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />Menandatangani...</>
              ) : (
                <><PenLine className="h-4 w-4 mr-2" aria-hidden="true" />Tanda Tangani Kontrak</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
