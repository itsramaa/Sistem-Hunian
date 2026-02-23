import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';
import { Contract } from '../types';

interface DeleteContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract | null;
  onConfirm: () => void;
  loading: boolean;
}

export function DeleteContractDialog({ open, onOpenChange, contract, onConfirm, loading }: DeleteContractDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive animate-pulse" />
            </div>
            <AlertDialogTitle>Delete Contract?</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            This will permanently delete the contract for{' '}
            <strong>{contract?.unit?.property?.name} - Unit {contract?.unit?.unit_number}</strong>.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Contract'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
