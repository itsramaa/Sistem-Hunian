import { Dispute } from "@/features/disputes/types";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { CheckCircle, Clock, Loader2, MessageSquare } from "lucide-react";

interface DisputeResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDispute: Dispute | null;
  resolution: string;
  onResolutionChange: (value: string) => void;
  onResolve: (status: string, resolutionText: string) => void;
  isPending: boolean;
}

export function DisputeResolutionDialog({
  open,
  onOpenChange,
  selectedDispute,
  resolution,
  onResolutionChange,
  onResolve,
  isPending,
}: DisputeResolutionDialogProps) {
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "resolved":
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="h-3 w-3 mr-1" /> Resolved
          </Badge>
        );
      case "open":
        return (
          <Badge variant="secondary" className="bg-warning/10 text-warning">
            <Clock className="h-3 w-3 mr-1" /> Open
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-info/10 text-info">
            <MessageSquare className="h-3 w-3 mr-1" /> In Progress
          </Badge>
        );
      case "closed":
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case "urgent":
        return (
          <Badge variant="destructive" className="animate-pulse">
            Urgent
          </Badge>
        );
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return (
          <Badge variant="secondary" className="bg-warning/10 text-warning">
            Medium
          </Badge>
        );
      case "low":
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority || "Medium"}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Review Dispute</DialogTitle>
          <DialogDescription>Review dispute details and provide a resolution</DialogDescription>
        </DialogHeader>
        {selectedDispute && (
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Title</Label>
              <p className="font-medium">{selectedDispute.title}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Description</Label>
              <p className="text-sm">{selectedDispute.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Priority</Label>
                <div>{getPriorityBadge(selectedDispute.priority)}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div>{getStatusBadge(selectedDispute.status)}</div>
              </div>
            </div>

            {selectedDispute.status !== "resolved" && (
              <div className="space-y-2">
                <Label>
                  Resolution <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={resolution}
                  onChange={(e) => onResolutionChange(e.target.value)}
                  placeholder="Describe how this dispute was resolved... (minimum 10 characters)"
                  rows={4}
                />
                {resolution.length > 0 && resolution.length < 10 && (
                  <p className="text-xs text-destructive">Resolution must be at least 10 characters</p>
                )}
              </div>
            )}

            {selectedDispute.resolution && (
              <div>
                <Label className="text-muted-foreground">Resolution</Label>
                <p className="text-sm p-3 bg-muted/50 rounded-lg">{selectedDispute.resolution}</p>
              </div>
            )}
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {selectedDispute?.status !== "resolved" && (
            <>
              {selectedDispute?.status === "open" && (
                <Button
                  variant="secondary"
                  onClick={() => onResolve("in_progress", "")}
                  disabled={isPending}
                >
                  Mark In Progress
                </Button>
              )}
              <Button
                onClick={() => onResolve("resolved", resolution)}
                disabled={isPending || resolution.length < 10}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Resolve
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
