
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { CheckCircle } from 'lucide-react';

interface MerchantApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  approvalNotes: string;
  setApprovalNotes: (notes: string) => void;
  isLoading: boolean;
}

export function MerchantApprovalDialog({
  open,
  onOpenChange,
  onConfirm,
  approvalNotes,
  setApprovalNotes,
  isLoading
}: MerchantApprovalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve Verification</DialogTitle>
          <DialogDescription>
            Add optional notes for this approval.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Internal Notes (Optional)</Label>
            <Textarea 
              placeholder="Add notes about this approval..."
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            className="bg-success hover:bg-success/90 text-white"
            onClick={onConfirm}
            disabled={isLoading}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Confirm Approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
