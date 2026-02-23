import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { Contract } from '../types';

interface EditTermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract | null;
  tenantName: string;
  terms: string;
  onTermsChange: (terms: string) => void;
  onSave: () => void;
  loading: boolean;
}

export function EditTermsDialog({
  open, onOpenChange, contract, tenantName, terms, onTermsChange, onSave, loading,
}: EditTermsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>Edit Contract Terms</DialogTitle>
          <DialogDescription>Update the terms and conditions for this rental agreement</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {contract && (
            <div className="p-3 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/40 text-sm">
              <p className="font-medium">{contract.unit?.property?.name} - Unit {contract.unit?.unit_number}</p>
              <p className="text-muted-foreground">Tenant: {tenantName}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="terms">Terms & Conditions</Label>
            <Textarea
              id="terms"
              value={terms}
              onChange={(e) => onTermsChange(e.target.value)}
              placeholder="Enter the terms and conditions for this rental agreement..."
              rows={12}
              className="font-mono text-sm rounded-xl bg-background/60 border-border/50"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button>
          <Button onClick={onSave} disabled={loading} className="gradient-cta rounded-xl">
            {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>) : 'Save Terms'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
