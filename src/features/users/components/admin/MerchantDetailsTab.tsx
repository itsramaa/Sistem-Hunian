import { Badge } from "@/shared/components/ui/badge";
import { Label } from "@/shared/components/ui/label";
import { Merchant } from "@/features/users/types/admin-merchant";
import { STATUS_COLORS, STATUS_ICONS } from "@/features/users/constants/merchant";
import { Clock } from "lucide-react";

interface MerchantDetailsTabProps {
  merchant: Merchant;
}

export function MerchantDetailsTab({ merchant }: MerchantDetailsTabProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const StatusIcon = ({ status }: { status: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Icon = (STATUS_ICONS as any)[status] || Clock;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label className="text-muted-foreground">Business Name</Label>
        <p className="font-medium">{merchant.business_name}</p>
      </div>
      <div>
        <Label className="text-muted-foreground">Business Type</Label>
        <p className="font-medium capitalize">{merchant.business_type}</p>
      </div>
      <div>
        <Label className="text-muted-foreground">Email</Label>
        <p className="font-medium">{merchant.profiles?.email}</p>
      </div>
      <div>
        <Label className="text-muted-foreground">Phone</Label>
        <p className="font-medium">{merchant.profiles?.phone || '-'}</p>
      </div>
      <div>
        <Label className="text-muted-foreground">Address</Label>
        <p className="font-medium">{merchant.address || '-'}</p>
      </div>
      <div>
        <Label className="text-muted-foreground">City</Label>
        <p className="font-medium">{merchant.city || '-'}, {merchant.province || '-'}</p>
      </div>
      <div>
        <Label className="text-muted-foreground">Status</Label>
        <div className="mt-1">
          <Badge variant="outline" className={STATUS_COLORS[merchant.verification_status]}>
            <StatusIcon status={merchant.verification_status} />
            <span className="ml-1 capitalize">{merchant.verification_status}</span>
          </Badge>
        </div>
      </div>
      <div>
        <Label className="text-muted-foreground">Subscription</Label>
        <div className="mt-1">
          <Badge variant="secondary" className="capitalize">
            {merchant.subscription_tier}
          </Badge>
        </div>
      </div>
    </div>
  );
}
