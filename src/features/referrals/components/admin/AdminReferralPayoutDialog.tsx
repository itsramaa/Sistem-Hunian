import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Referral } from "../../types";
import { formatCurrency } from "@/shared/utils/currency";

interface AdminReferralPayoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  referral: Referral | null;
  onConfirm: () => void;
  isProcessing: boolean;
  rewardAmount: number;
  getProfileName: (userId: string | null) => string;
}

export function AdminReferralPayoutDialog({
  isOpen,
  onClose,
  referral,
  onConfirm,
  isProcessing,
  rewardAmount,
  getProfileName,
}: AdminReferralPayoutDialogProps) {
  if (!referral) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Payout</DialogTitle>
          <DialogDescription>
            Process reward payout for referral {referral.referral_code}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Referrer</span>
            <span className="font-medium">{getProfileName(referral.referrer_user_id)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reward Amount</span>
            <span className="font-medium">{formatCurrency(referral.reward_amount || rewardAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type</span>
            <span className="font-medium">Subscription Credit</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirm Payout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
