import { PendingDisbursement } from '@/features/escrow/types';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { formatCurrency } from '@/shared/utils/currency';
import { useState, useEffect } from 'react';

interface AdminReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: PendingDisbursement | null;
  onApprove: (notes: string) => void;
  onReject: (notes: string) => void;
}

export function AdminReviewDialog({
  open,
  onOpenChange,
  review,
  onApprove,
  onReject,
}: AdminReviewDialogProps) {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      setNotes('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review Disbursement Request</DialogTitle>
          <DialogDescription>
            Review request from {review?.merchant?.business_name} for {review && formatCurrency(review.amount)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Merchant:</span>
              <span className="font-medium">{review?.merchant?.business_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-medium">{review && formatCurrency(review.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bank:</span>
              <span className="font-medium">
                {review?.bank_account?.bank_name} - {review?.bank_account?.account_number}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Name:</span>
              <span className="font-medium">{review?.bank_account?.account_name}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Review Notes (Optional for Approval, Required for Rejection)</Label>
            <Textarea
              placeholder="Enter notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="destructive" onClick={() => onReject(notes)}>
            Reject
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => onApprove(notes)}>Approve</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
