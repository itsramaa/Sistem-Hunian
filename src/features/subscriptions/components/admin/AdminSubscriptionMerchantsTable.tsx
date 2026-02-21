import { StatusBadge, TierBadge } from "@/features/subscriptions/components/SubscriptionBadges";
import { SubscriptionMerchant } from "@/features/subscriptions/types/subscriptions";
import { Button } from "@/shared/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { format } from "date-fns";
import { ArrowUpCircle, CreditCard, Loader2, MoreHorizontal } from "lucide-react";

interface AdminSubscriptionMerchantsTableProps {
  merchants: SubscriptionMerchant[] | undefined;
  isLoading: boolean;
  onUpdatePlan: (merchant: SubscriptionMerchant) => void;
}

export function AdminSubscriptionMerchantsTable({ merchants, isLoading, onUpdatePlan }: AdminSubscriptionMerchantsTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!merchants || merchants.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No merchants found</p>
      </div>
    );
  }

  const getMerchantTierName = (merchant: SubscriptionMerchant) => {
    if (merchant.merchant_subscriptions?.[0]?.subscription_tiers?.name) {
      return merchant.merchant_subscriptions[0].subscription_tiers.name;
    }
    return merchant.subscription_tier || 'free';
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Business</TableHead>
            <TableHead className="hidden sm:table-cell">Type</TableHead>
            <TableHead className="hidden md:table-cell">Current Plan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {merchants.map((merchant) => {
            const subscription = merchant.merchant_subscriptions?.[0];
            return (
              <TableRow key={merchant.id}>
                <TableCell className="font-medium">{merchant.business_name}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <p className="text-sm">{merchant.business_type || 'Individual'}</p>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <TierBadge tierName={getMerchantTierName(merchant)} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={subscription?.status || 'unknown'} />
                </TableCell>
                <TableCell className="hidden lg:table-cell">{format(new Date(merchant.created_at), 'MMM dd, yyyy')}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onUpdatePlan(merchant)}>
                        <ArrowUpCircle className="mr-2 h-4 w-4" />
                        Change Plan
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
