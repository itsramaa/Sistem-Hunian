import { TierBadge } from "@/features/subscriptions/components/SubscriptionBadges";
import { PendingSubscriptionChange } from "@/features/subscriptions/types/subscriptions";
import { Badge } from "@/shared/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { format } from "date-fns";
import { Clock, Loader2 } from "lucide-react";

interface AdminSubscriptionPendingChangesTableProps {
  pendingChanges: PendingSubscriptionChange[] | undefined;
  isLoading: boolean;
}

export function AdminSubscriptionPendingChangesTable({ pendingChanges, isLoading }: AdminSubscriptionPendingChangesTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pendingChanges || pendingChanges.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No pending subscription changes</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Merchant</TableHead>
            <TableHead>Change Type</TableHead>
            <TableHead className="hidden lg:table-cell">From</TableHead>
            <TableHead className="hidden lg:table-cell">To</TableHead>
            <TableHead>Effective Date</TableHead>
            <TableHead className="hidden md:table-cell">Reason</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingChanges.map((change) => (
            <TableRow key={change.id}>
              <TableCell className="font-medium">
                {change.merchants?.business_name || 'Unknown'}
              </TableCell>
              <TableCell>
                <Badge variant={change.change_type === 'downgrade' ? 'destructive' : 'default'}>
                  {change.change_type}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <TierBadge tierName={change.current_tier?.name} />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <TierBadge tierName={change.pending_tier?.name} />
              </TableCell>
              <TableCell>{format(new Date(change.effective_date), 'MMM dd, yyyy')}</TableCell>
              <TableCell className="text-muted-foreground hidden md:table-cell">{change.reason || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
