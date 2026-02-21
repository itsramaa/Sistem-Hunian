import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { format } from 'date-fns';
import {
  AlertTriangle,
  Calendar,
  DollarSign,
  Eye,
  Home,
  Loader2,
  PenLine,
  Trash2
} from 'lucide-react';
import { Contract } from '../types';
import { ContractStatusBadge } from './ContractStatusBadge';
import { SignatureStatusBadge } from './SignatureStatusBadge';

interface ContractCardProps {
  contract: Contract;
  tenantProfile?: { full_name: string | null; email: string } | null;
  onSign: () => void;
  onView: () => void;
  onMarkNotice?: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
  highlight?: boolean;
  isPast?: boolean;
  isMarkingNotice?: boolean;
  isDeleting?: boolean;
}

export function ContractCard({
  contract,
  tenantProfile,
  onSign,
  onView,
  onMarkNotice,
  onDelete,
  canDelete = false,
  highlight = false,
  isPast = false,
  isMarkingNotice = false,
  isDeleting = false,
}: ContractCardProps) {
  const canMarkNotice = contract.status === 'active' && !isPast;
  
  return (
    <Card className={highlight ? 'border-warning/50 bg-warning/5' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${highlight ? 'bg-warning/10' : 'bg-muted'}`}>
              <Home className={`h-5 w-5 ${highlight ? 'text-warning' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="font-medium">
                {contract.unit?.property?.name} - Unit {contract.unit?.unit_number}
              </p>
              <p className="text-sm text-muted-foreground">
                {tenantProfile?.full_name || tenantProfile?.email || 'Unknown Tenant'}
              </p>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(contract.start_date), 'MMM yyyy')} - {format(new Date(contract.end_date), 'MMM yyyy')}
                <span className="mx-1">•</span>
                <DollarSign className="h-3 w-3" />
                {contract.rent_amount.toLocaleString()}/mo
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end gap-1">
              <ContractStatusBadge status={contract.status} />
              <SignatureStatusBadge contract={contract} />
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={onView}>
                <Eye className="h-4 w-4" />
              </Button>
              {!isPast && !contract.merchant_signature_url && contract.tenant_signature_url && (
                <Button size="sm" onClick={onSign}>
                  <PenLine className="h-4 w-4 mr-1" />
                  Sign
                </Button>
              )}
              {canMarkNotice && onMarkNotice && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onMarkNotice}
                  disabled={isMarkingNotice}
                  className="text-warning border-warning hover:bg-warning/10"
                >
                  {isMarkingNotice ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Mark Notice
                    </>
                  )}
                </Button>
              )}
              {canDelete && onDelete && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={onDelete}
                  disabled={isDeleting}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
