import { Badge } from '@/shared/components/ui/badge';
import { CheckCircle, PenLine } from 'lucide-react';
import { Contract } from '../../types';

interface SignatureStatusBadgeProps {
  contract: Contract;
}

export function SignatureStatusBadge({ contract }: SignatureStatusBadgeProps) {
  if (contract.signature_status === 'fully_signed') {
    return <Badge className="bg-success text-success-foreground gap-1"><CheckCircle className="h-3 w-3" /> Fully Signed</Badge>;
  }
  if (contract.merchant_signature_url && !contract.tenant_signature_url) {
    return <Badge variant="secondary" className="gap-1"><CheckCircle className="h-3 w-3" /> You Signed</Badge>;
  }
  if (contract.tenant_signature_url && !contract.merchant_signature_url) {
    return <Badge variant="outline" className="gap-1 text-warning border-warning"><PenLine className="h-3 w-3" /> Awaiting Your Signature</Badge>;
  }
  return <Badge variant="outline" className="gap-1"><PenLine className="h-3 w-3" /> Pending</Badge>;
}
