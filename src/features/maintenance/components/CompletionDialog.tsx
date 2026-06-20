import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { MaintenancePhotoUpload } from './MaintenancePhotoUpload';
import { CheckCircle, Loader2 } from 'lucide-react';

interface CompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (notes: string, photos: string[]) => void;
  isLoading?: boolean;
  jobTitle?: string;
}

export function CompletionDialog({ open, onOpenChange, onConfirm, isLoading = false, jobTitle }: CompletionDialogProps) {
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionPhotos, setCompletionPhotos] = useState<string[]>([]);

  const handleConfirm = () => { onConfirm(completionNotes, completionPhotos); };
  const handleClose = () => { setCompletionNotes(''); setCompletionPhotos([]); onOpenChange(false); };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />Complete Job
          </DialogTitle>
          <DialogDescription>{jobTitle ? `Mark "${jobTitle}" as completed` : 'Confirm job completion'}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Completion Notes</Label>
            <Textarea value={completionNotes} onChange={(e) => setCompletionNotes(e.target.value)} placeholder="Describe the work done, any issues resolved, or recommendations..." rows={4} className="rounded-xl bg-background/60 border-border/50" />
          </div>

          <MaintenancePhotoUpload
            photos={completionPhotos}
            onChange={setCompletionPhotos}
            maxPhotos={5}
            label="Completion Photos (Optional)"
            description="Upload photos of the completed work"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading} className="rounded-xl">Cancel</Button>
          <Button onClick={handleConfirm} disabled={isLoading} className="gradient-cta text-primary-foreground rounded-xl">
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Complete Job
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}