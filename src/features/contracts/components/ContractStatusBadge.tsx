import { Badge } from '@/shared/components/ui/badge';
import { Clock } from 'lucide-react';

interface ContractStatusBadgeProps {
  status: string | null;
}

export function ContractStatusBadge({ status }: ContractStatusBadgeProps) {
  switch (status) {
    case 'active':
      return <Badge className="bg-success text-success-foreground">Active</Badge>;
    case 'notice':
      return <Badge variant="outline" className="text-warning border-warning gap-1"><Clock className="h-3 w-3" /> Notice Period</Badge>;
    case 'expired':
      return <Badge variant="secondary">Expired</Badge>;
    case 'terminated':
      return <Badge variant="destructive">Terminated</Badge>;
    default:
      return <Badge variant="outline">{status || 'Unknown'}</Badge>;
  }
}
