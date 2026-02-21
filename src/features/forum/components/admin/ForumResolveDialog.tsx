import { ForumReport, ForumReportStatus } from "@/features/forum/types";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";

interface ForumResolveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedReport: ForumReport | null;
  action: ForumReportStatus;
  notes: string;
  onNotesChange: (value: string) => void;
  onConfirm: () => void;
  isUpdating: boolean;
}

export function ForumResolveDialog({
  open,
  onOpenChange,
  selectedReport,
  action,
  notes,
  onNotesChange,
  onConfirm,
  isUpdating
}: ForumResolveDialogProps) {
  if (!selectedReport) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action === 'resolved' ? 'Resolve Report' : 'Dismiss Report'}
          </DialogTitle>
          <DialogDescription>
            {action === 'resolved' 
              ? 'This will mark the report as resolved. You can add notes about the action taken.' 
              : 'This will dismiss the report. Please provide a reason.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Report Reason</Label>
            <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
              {selectedReport.reason}
              {selectedReport.description && (
                <div className="mt-1 text-xs italic">"{selectedReport.description}"</div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Resolution Notes</Label>
            <Textarea
              id="notes"
              placeholder={action === 'resolved' ? "Action taken (e.g., Content removed, User warned)" : "Reason for dismissal (e.g., No violation found)"}
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={onConfirm} 
            disabled={isUpdating}
            variant={action === 'resolved' ? 'default' : 'secondary'}
          >
            {action === 'resolved' ? 'Resolve' : 'Dismiss'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
