
import { RejectionReasonForm } from '@/features/verification/components/RejectionReasonForm';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';

interface MerchantRejectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onConfirm: (data: any) => void;
  isLoading: boolean;
}

export function MerchantRejectionDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading
}: MerchantRejectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Verification</DialogTitle>
          <DialogDescription>
            Please provide a reason for rejection. This will be sent to the merchant.
          </DialogDescription>
        </DialogHeader>
        <RejectionReasonForm 
          open={open}
          onOpenChange={onOpenChange}
          merchantName=""
          onConfirm={onConfirm}
          loading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
