import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { formatCurrency } from '@/shared/utils/currency';
import { AlertCircle, CreditCard, Loader2, Send } from 'lucide-react';

import { BankAccount } from '../types';

interface DisbursementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance: number;
  feeAmount: number;
  netAmount: number;
  bankAccount: BankAccount | null;
  onConfirm: () => void;
  isLoading: boolean;
  onAddBankAccount: () => void;
}

export function DisbursementDialog({
  open,
  onOpenChange,
  balance,
  feeAmount,
  netAmount,
  bankAccount,
  onConfirm,
  isLoading,
  onAddBankAccount
}: DisbursementDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Disbursement Request</DialogTitle>
          <DialogDescription>
            You're about to request an immediate transfer of your available balance.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-xl font-bold">{formatCurrency(balance)}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Fee (0.5%)</p>
              <p className="text-xl font-bold text-destructive">-{formatCurrency(feeAmount)}</p>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-success/10 border border-success/20">
            <p className="text-sm text-muted-foreground">You will receive</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(netAmount)}</p>
          </div>
          {bankAccount ? (
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">Transfer to</p>
              <p className="font-medium">{bankAccount.bank_name} - {bankAccount.account_number}</p>
              <p className="text-sm text-muted-foreground">{bankAccount.account_name}</p>
            </div>
          ) : (
             <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Bank Account Required</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>Please add a primary bank account.</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onAddBankAccount}
                  className="ml-2"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isLoading || !bankAccount}
            className="gradient-primary"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Confirm Disbursement
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
