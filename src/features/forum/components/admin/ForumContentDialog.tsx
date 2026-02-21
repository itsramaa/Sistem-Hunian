import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";

interface ContentToView {
  type: 'post' | 'comment';
  content: string;
  title?: string;
}

interface ForumContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: ContentToView | null;
}

export function ForumContentDialog({
  open,
  onOpenChange,
  content
}: ForumContentDialogProps) {
  if (!content) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>View {content.type === 'post' ? 'Post' : 'Comment'} Content</DialogTitle>
          <DialogDescription>
            Content associated with the report
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {content.title && (
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{content.title}</h3>
            </div>
          )}
          <div className="p-4 bg-muted rounded-md whitespace-pre-wrap">
            {content.content}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
