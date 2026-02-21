import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Invoice } from '../types';
import { formatCurrency } from '@/shared/utils/currency';

interface InvoicesStatsProps {
  invoices: Invoice[];
}

export const InvoicesStats = ({ invoices }: InvoicesStatsProps) => {
  const stats = {
    total: invoices.reduce((sum, i) => sum + Number(i.total_amount), 0),
    paid: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.total_amount), 0),
    pending: invoices.filter(i => i.status === 'sent').reduce((sum, i) => sum + Number(i.total_amount), 0),
    draft: invoices.filter(i => i.status === 'draft').length,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoiced</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatCurrency(stats.total)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Paid</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.paid)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pending)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.draft}</p>
        </CardContent>
      </Card>
    </div>
  );
};
