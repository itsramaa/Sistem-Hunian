import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileUpload } from '@/components/FileUpload';
import { CheckCircle, Loader2, X } from 'lucide-react';

interface CompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (notes: string, photos: string[]) => void;
  isLoading?: boolean;
  jobTitle?: string;
}

export function CompletionDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  jobTitle,
}: CompletionDialogProps) {
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionPhotos, setCompletionPhotos] = useState<string[]>([]);

  const handleConfirm = () => {
    onConfirm(completionNotes, completionPhotos);
  };

  const handleRemovePhoto = (index: number) => {
    setCompletionPhotos(photos => photos.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    setCompletionNotes('');
    setCompletionPhotos([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Complete Job
          </DialogTitle>
          <DialogDescription>
            {jobTitle ? `Mark "${jobTitle}" as completed` : 'Confirm job completion'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Completion Notes */}
          <div className="space-y-2">
            <Label>Completion Notes</Label>
            <Textarea
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="Describe the work done, any issues resolved, or recommendations..."
              rows={4}
            />
          </div>

          {/* Completion Photos */}
          <div className="space-y-2">
            <Label>Completion Photos (Optional)</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Upload photos of the completed work
            </p>
            
            {completionPhotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {completionPhotos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Completion photo ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {completionPhotos.length < 5 && (
              <FileUpload
                bucket="maintenance-photos"
                onUploadComplete={(url) => setCompletionPhotos(prev => [...prev, url])}
                accept="image/*"
                maxSize={5}
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Complete Job
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
