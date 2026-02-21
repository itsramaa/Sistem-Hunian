import { ForumComment } from "@/features/forum/types";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";

interface ForumCommentsTableProps {
  comments: ForumComment[];
  onVisibilityToggle: (id: string, isVisible: boolean) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function ForumCommentsTable({
  comments,
  onVisibilityToggle,
  page,
  totalPages,
  onPageChange,
  isLoading
}: ForumCommentsTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        Loading comments...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="hidden md:table-cell">Author</TableHead>
              <TableHead>Content</TableHead>
              <TableHead className="hidden sm:table-cell">Visibility</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No comments found
                </TableCell>
              </TableRow>
            ) : (
              comments.map((comment) => (
                <TableRow key={comment.id}>
                  <TableCell className="whitespace-nowrap">{format(new Date(comment.created_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="text-sm">{comment.author?.full_name || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground">{comment.author?.email}</div>
                  </TableCell>
                  <TableCell className="max-w-[400px]">
                    <div className="text-sm truncate">{comment.content}</div>
                    {/* Mobile only fallback for Author */}
                    <div className="md:hidden text-xs text-muted-foreground mt-1">
                      by {comment.author?.full_name || 'Unknown'}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {comment.is_visible ? (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">Visible</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Hidden</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onVisibilityToggle(comment.id, comment.is_visible)}
                      className={comment.is_visible ? "text-destructive hover:text-destructive hover:bg-destructive/10" : "text-success hover:text-success hover:bg-success/10"}
                    >
                      {comment.is_visible ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                      {comment.is_visible ? 'Hide' : 'Show'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
