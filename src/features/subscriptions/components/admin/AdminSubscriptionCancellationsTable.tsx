import { CancellationFeedback } from "@/features/subscriptions/types/subscriptions";
import { getCancellationReasonLabel } from "@/features/subscriptions/utils/formatters";
import { Badge } from "@/shared/components/ui/badge";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { format } from "date-fns";
import { Loader2, XCircle } from "lucide-react";

interface AdminSubscriptionCancellationsTableProps {
  cancellations: CancellationFeedback[] | undefined;
  isLoading: boolean;
}

export function AdminSubscriptionCancellationsTable({ cancellations, isLoading }: AdminSubscriptionCancellationsTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cancellations || cancellations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No cancellation feedback found</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Merchant</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead className="hidden md:table-cell">Feedback</TableHead>
            <TableHead className="hidden sm:table-cell">Would Return?</TableHead>
            <TableHead className="hidden lg:table-cell">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cancellations.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                {item.merchants?.business_name || 'Unknown'}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {getCancellationReasonLabel(item.reason)}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs truncate hidden md:table-cell">
                {item.feedback || '-'}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {item.would_return === true ? (
                  <Badge className="bg-success/10 text-success">Yes</Badge>
                ) : item.would_return === false ? (
                  <Badge variant="destructive">No</Badge>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell className="hidden lg:table-cell">{format(new Date(item.created_at), 'MMM dd, yyyy')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
