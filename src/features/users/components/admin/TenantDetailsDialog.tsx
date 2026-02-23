
import { AdminTenant } from "@/features/users/types/tenant";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
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

  const statusColors: Record<string, string> = {
    active: "bg-success/10 text-success border-success/20",
    pending: "bg-warning/10 text-warning border-warning/20",
    terminated: "bg-destructive/10 text-destructive border-destructive/20",
    inactive: "bg-muted text-muted-foreground",
  };
  const status = tenant.status as keyof typeof statusColors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="flex items-center gap-2">
              <div className="gradient-icon-box"><User className="h-5 w-5 text-primary" /></div>
              Tenant Details
            </DialogTitle>
            <Badge variant="outline" className={cn("capitalize rounded-full", statusColors[status] || statusColors.inactive)}>{tenant.status.replace('_', ' ')}</Badge>
          </div>
          <DialogDescription>Detailed information about {tenant.profile?.full_name || 'the tenant'}.</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider border-b border-border/40 pb-1">Personal Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: User, label: "Full Name", value: tenant.profile?.full_name },
                { icon: Mail, label: "Email", value: tenant.profile?.email },
                { icon: Phone, label: "Phone", value: tenant.profile?.phone },
              ].map((item, i) => (
                <div key={i} className="space-y-1 p-3 rounded-xl bg-card/80 backdrop-blur-sm border border-border/30">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><item.icon className="h-4 w-4" /><span>{item.label}</span></div>
                  <p className="font-medium">{item.value || 'N/A'}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider border-b border-border/40 pb-1">Lease Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: Building, label: "Property", value: tenant.unit?.property?.name },
                { icon: MapPin, label: "Unit Number", value: tenant.unit?.unit_number },
                { icon: User, label: "Merchant/Landlord", value: tenant.merchant_profile?.full_name },
                { icon: Wallet, label: "Rent Amount", value: formatCurrency(tenant.rent_amount), className: "text-primary" },
              ].map((item, i) => (
                <div key={i} className="space-y-1 p-3 rounded-xl bg-card/80 backdrop-blur-sm border border-border/30">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><item.icon className="h-4 w-4" /><span>{item.label}</span></div>
                  <p className={`font-medium ${item.className || ''}`}>{item.value || 'N/A'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="rounded-xl">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
