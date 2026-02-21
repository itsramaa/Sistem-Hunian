import { ForumReport, ForumReportStatus } from "@/features/forum/types";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { format } from "date-fns";
import { CheckCircle, ChevronLeft, ChevronRight, Eye, XCircle } from "lucide-react";

interface ForumReportsTableProps {
  reports: ForumReport[];
  statusColors: Record<string, string>;
  onViewContent: (report: ForumReport) => void;
  onResolve: (report: ForumReport, status: ForumReportStatus) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function ForumReportsTable({
  reports,
  statusColors,
  onViewContent,
  onResolve,
  page,
  totalPages,
  onPageChange,
  isLoading
}: ForumReportsTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        Loading reports...
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
              <TableHead className="hidden sm:table-cell">Type</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="hidden lg:table-cell">Reporter</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No reports found
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{format(new Date(report.created_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {report.post_id ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Post</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Comment</Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={report.description || ''}>
                    <span className="font-medium block">{report.reason}</span>
                    <span className="text-xs text-muted-foreground">{report.description}</span>
                    {/* Mobile only fallback for Reporter */}
                    <div className="lg:hidden text-xs text-muted-foreground mt-1">
                      by {report.reporter?.full_name || 'Unknown'}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="text-sm">{report.reporter?.full_name || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground">{report.reporter?.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[report.status]}>
                      {report.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onViewContent(report)}>
                        <Eye className="h-4 w-4 mr-1" /> View Content
                      </Button>
                      {report.status === 'pending' && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-success hover:text-success hover:bg-success/10" 
                            onClick={() => onResolve(report, 'resolved')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-muted-foreground hover:text-foreground" 
                            onClick={() => onResolve(report, 'dismissed')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
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
