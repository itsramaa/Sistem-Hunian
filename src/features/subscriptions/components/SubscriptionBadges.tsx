import { Badge } from "@/shared/components/ui/badge";
import { Crown, Star, Zap } from "lucide-react";

export const TierBadge = ({ tierName }: { tierName: string | null | undefined }) => {
  switch (tierName) {
    case 'enterprise':
      return <Badge className="bg-accent text-accent-foreground"><Crown className="h-3 w-3 mr-1" /> Enterprise</Badge>;
    case 'pro':
      return <Badge className="bg-primary text-primary-foreground"><Star className="h-3 w-3 mr-1" /> Pro</Badge>;
    case 'basic':
      return <Badge className="bg-info text-info-foreground"><Zap className="h-3 w-3 mr-1" /> Basic</Badge>;
    default:
      return <Badge variant="secondary">Free</Badge>;
  }
};

export const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'paid':
    case 'active':
      return <Badge className="bg-success/10 text-success capitalize">{status}</Badge>;
    case 'pending':
    case 'trial':
      return <Badge className="bg-warning/10 text-warning capitalize">{status}</Badge>;
    case 'failed':
    case 'overdue':
    case 'suspended':
      return <Badge variant="destructive" className="capitalize">{status}</Badge>;
    default:
      return <Badge variant="secondary" className="capitalize">{status}</Badge>;
  }
};
