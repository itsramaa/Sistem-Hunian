import { PendingDisbursement } from '@/features/escrow/types';
import { Button } from '@/shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { formatCurrency } from '@/shared/utils/currency';
import { cn } from '@/shared/utils/utils';
import { format } from 'date-fns';

interface AdminEscrowReviewsTableProps {
  reviews: PendingDisbursement[];
  loading: boolean;
  onReview: (review: PendingDisbursement) => void;
}

export function AdminEscrowReviewsTable({
  reviews,
  loading,
  onReview
}: AdminEscrowReviewsTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No pending reviews
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Merchant</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="hidden md:table-cell">Bank Details</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviews.map((review) => (
            <TableRow key={review.id}>
              <TableCell>{format(new Date(review.created_at), 'MMM dd, yyyy')}</TableCell>
              <TableCell>
                {review.merchant?.business_name}
                <div className="md:hidden text-xs text-muted-foreground mt-1">
                  {review.bank_account?.bank_name} - {review.bank_account?.account_number}
                </div>
              </TableCell>
              <TableCell>{formatCurrency(review.amount)}</TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="text-sm">
                  <div className="font-medium">{review.bank_account?.bank_name}</div>
                  <div className="text-muted-foreground">{review.bank_account?.account_number}</div>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="default" size="sm" onClick={() => onReview(review)}>
                  Review
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
