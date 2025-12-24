import { useState } from 'react';
import { CheckCircle, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

interface BulkApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: (approvalNotes: string) => Promise<void>;
}

export function BulkApprovalDialog({ 
  open, 
  onOpenChange, 
  selectedCount,
  onConfirm
}: BulkApprovalDialogProps) {
  const [approvalNotes, setApprovalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleConfirm = async () => {
    setLoading(true);
    setProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 100 / selectedCount, 100));
    }, 200);

    try {
      await onConfirm(approvalNotes);
    } finally {
      clearInterval(progressInterval);
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
        setApprovalNotes('');
        onOpenChange(false);
      }, 500);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setApprovalNotes('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Bulk Approval
          </DialogTitle>
          <DialogDescription>
            Anda akan menyetujui <span className="font-bold text-foreground">{selectedCount}</span> merchant sekaligus.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
            <CheckCircle className="h-5 w-5 text-success" />
            <div className="text-sm">
              <p className="font-medium text-success">Aksi: Approve All Selected</p>
              <p className="text-muted-foreground">Status akan diubah menjadi "verified"</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="approval-notes">Catatan Approval (Opsional)</Label>
            <Textarea
              id="approval-notes"
              placeholder="Tambahkan catatan untuk semua merchant yang diapprove..."
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>

          {loading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Batal
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? 'Memproses...' : `Approve ${selectedCount} Merchants`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
