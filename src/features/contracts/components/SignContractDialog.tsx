import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  open,
  onOpenChange,
  contract,
  tenantName,
  onSign,
  loading,
  signatureDataUrl,
  onSaveSignature,
}: SignContractDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Sign Contract</DialogTitle>
          <DialogDescription>
            Draw your signature below to sign this rental agreement
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {contract && (
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="font-medium">
                {contract.unit?.property?.name} - Unit {contract.unit?.unit_number}
              </p>
              <p className="text-sm text-muted-foreground">
                Tenant: {tenantName}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(contract.start_date), 'MMM dd, yyyy')} - {format(new Date(contract.end_date), 'MMM dd, yyyy')}
              </p>
            </div>
          )}

          <SignaturePad onSave={onSaveSignature} width={400} height={150} />

          {signatureDataUrl && (
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <p className="text-sm text-success flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Signature captured successfully
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={onSign}
              disabled={!signatureDataUrl || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing...
                </>
              ) : (
                <>
                  <PenLine className="h-4 w-4 mr-2" />
                  Sign Contract
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
