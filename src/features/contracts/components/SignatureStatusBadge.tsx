import { Badge } from '@/shared/components/ui/badge';
import { CheckCircle, PenLine } from 'lucide-react';
import { Contract } from '../types';

interface SignatureStatusBadgeProps {
  contract: Contract;
}

export function SignatureStatusBadge({ contract }: SignatureStatusBadgeProps) {
  if (contract.signature_status === 'fully_signed') {
    return <Badge className="bg-success text-success-foreground gap-1 rounded-full"><CheckCircle className="h-3 w-3" /> Sudah Ditandatangani</Badge>;
  }
  if (contract.merchant_signature_url && !contract.tenant_signature_url) {
    return <Badge variant="secondary" className="gap-1 rounded-full"><CheckCircle className="h-3 w-3" /> Anda Sudah TTD</Badge>;
  }
  if (contract.tenant_signature_url && !contract.merchant_signature_url) {
    return <Badge variant="outline" className="gap-1 text-warning border-warning rounded-full"><PenLine className="h-3 w-3" /> Menunggu TTD Anda</Badge>;
  }
  return <Badge variant="outline" className="gap-1 rounded-full"><PenLine className="h-3 w-3" /> Tertunda</Badge>;
}
