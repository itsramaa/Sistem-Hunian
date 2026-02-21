
import { AdminTenant } from "@/features/users/types/tenant";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/shared/components/ui/dialog";
import { formatCurrency } from "@/shared/utils/currency";
import { cn } from "@/shared/utils/utils";
import { Building, Mail, MapPin, Phone, User, Wallet } from "lucide-react";

interface TenantDetailsDialogProps {
  tenant: AdminTenant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TenantDetailsDialog({ tenant, open, onOpenChange }: TenantDetailsDialogProps) {
  if (!tenant) return null;

  const statusColors = {
    active: "bg-success/10 text-success border-success/20",
    pending: "bg-warning/10 text-warning border-warning/20",
    terminated: "bg-destructive/10 text-destructive border-destructive/20",
    inactive: "bg-muted text-muted-foreground",
  };

  const status = tenant.status as keyof typeof statusColors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              Tenant Details
            </DialogTitle>
            <Badge variant="outline" className={cn("capitalize", statusColors[status] || statusColors.inactive)}>
              {tenant.status.replace('_', ' ')}
            </Badge>
          </div>
          <DialogDescription>
            Detailed information about {tenant.profile?.full_name || 'the tenant'}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Personal Information */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider border-b pb-1">
              Personal Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Full Name</span>
                </div>
                <p className="font-medium">{tenant.profile?.full_name || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </div>
                <p className="font-medium">{tenant.profile?.email || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>Phone</span>
                </div>
                <p className="font-medium">{tenant.profile?.phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider border-b pb-1">
              Lease Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building className="h-4 w-4" />
                  <span>Property</span>
                </div>
                <p className="font-medium">{tenant.unit?.property?.name || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Unit Number</span>
                </div>
                <p className="font-medium">{tenant.unit?.unit_number || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Merchant/Landlord</span>
                </div>
                <p className="font-medium">{tenant.merchant_profile?.full_name || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wallet className="h-4 w-4" />
                  <span>Rent Amount</span>
                </div>
                <p className="font-medium text-primary">
                  {formatCurrency(tenant.rent_amount)}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
