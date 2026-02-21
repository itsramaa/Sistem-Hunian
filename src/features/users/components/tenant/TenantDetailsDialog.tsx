import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';
import { Badge } from '@/shared/components/ui/badge';
import { Building, Calendar, DollarSign, Home, Mail, Phone, Users } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/shared/utils/currency';
import { ActiveTenant } from '@/features/users/types/tenant';

interface TenantDetailsDialogProps {
  tenant: ActiveTenant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const contractStatusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/30',
  draft: 'bg-muted text-muted-foreground border-muted',
  pending_signature: 'bg-warning/10 text-warning border-warning/30',
  notice: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  expired: 'bg-muted text-muted-foreground border-muted',
  terminated: 'bg-destructive/10 text-destructive border-destructive/30',
};

export function TenantDetailsDialog({ tenant, open, onOpenChange }: TenantDetailsDialogProps) {
  if (!tenant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tenant Details</DialogTitle>
          <DialogDescription>
            View detailed information about this tenant
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Personal Info */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Personal Information</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{tenant.profile?.full_name || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{tenant.profile?.email || '-'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{tenant.profile?.phone || 'Not set'}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Unit Info */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Unit Information</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span>{tenant.unit?.property?.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Home className="h-4 w-4 text-muted-foreground" />
                <span>Unit {tenant.unit?.unit_number}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contract Info */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Contract Details</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Contract Period</span>
                </div>
                <span className="text-sm">
                  {format(new Date(tenant.start_date), 'MMM d, yyyy')} - {format(new Date(tenant.end_date), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Monthly Rent</span>
                </div>
                <span className="text-sm font-medium">{formatCurrency(tenant.rent_amount)}</span>
              </div>
              {tenant.deposit_amount && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Deposit</span>
                  </div>
                  <span className="text-sm">{formatCurrency(tenant.deposit_amount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm">Status</span>
                <Badge variant="outline" className={contractStatusColors[tenant.status]}>
                  {tenant.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
