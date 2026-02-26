import { STATUS_COLORS, STATUS_ICONS } from "@/features/users/constants/merchant";
import { Merchant } from "@/features/users/types/admin-merchant";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { cn } from "@/shared/utils/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table";
import {
    AlertTriangle,
    Building2,
    CheckCircle,
    Clock,
    Eye,
    MoreHorizontal,
    XCircle,
} from "lucide-react";

interface AdminMerchantsTableProps {
  merchants: Merchant[];
  selectedMerchantIds: string[];
  onToggleSelection: (id: string) => void;
  onToggleSelectAll: () => void;
  onViewDetails: (merchant: Merchant) => void;
  onApprove: (merchant: Merchant) => void;
  onReject: (merchant: Merchant) => void;
  onSuspend: (merchant: Merchant) => void;
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function AdminMerchantsTable({
  merchants,
  selectedMerchantIds,
  onToggleSelection,
  onToggleSelectAll,
  onViewDetails,
  onApprove,
  onReject,
  onSuspend,
  isLoading,
  page,
  totalPages,
  onPageChange,
}: AdminMerchantsTableProps) {
  const pendingMerchantsCount = merchants.filter(
    (m) => m.verification_status === "pending"
  ).length;

  const StatusIcon = ({ status }: { status: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Icon = (STATUS_ICONS as any)[status] || Clock;
    return <Icon className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (merchants.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No merchants found
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="h-[600px] rounded-md border">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={
                  selectedMerchantIds.length === pendingMerchantsCount &&
                  pendingMerchantsCount > 0
                }
                onCheckedChange={onToggleSelectAll}
                disabled={pendingMerchantsCount === 0}
              />
            </TableHead>
            <TableHead>Business</TableHead>
            <TableHead className="hidden md:table-cell">Contact</TableHead>
            <TableHead className="hidden lg:table-cell">Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden xl:table-cell">Tier</TableHead>
            <TableHead className="hidden xl:table-cell">V. Tier</TableHead>
            <TableHead className="hidden xl:table-cell">Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {merchants.map((merchant) => (
            <TableRow key={merchant.id}>
              <TableCell>
                {merchant.verification_status === "pending" && (
                  <Checkbox
                    checked={selectedMerchantIds.includes(merchant.id)}
                    onCheckedChange={() => onToggleSelection(merchant.id)}
                  />
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{merchant.business_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {merchant.business_type}
                    </p>
                    <div className="md:hidden text-xs text-muted-foreground mt-1 flex flex-col gap-0.5">
                      <span>{merchant.profiles?.email}</span>
                      <span>{merchant.city}</span>
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <p className="text-sm">{merchant.profiles?.email}</p>
                <p className="text-xs text-muted-foreground">
                  {merchant.profiles?.phone || "-"}
                </p>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <p className="text-sm">{merchant.city || "-"}</p>
                <p className="text-xs text-muted-foreground">
                  {merchant.province || "-"}
                </p>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  className={cn((STATUS_COLORS as any)[merchant.verification_status])}
                >
                  <StatusIcon status={merchant.verification_status} />
                  <span className="ml-1 capitalize hidden sm:inline">
                    {merchant.verification_status}
                  </span>
                </Badge>
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                <Badge variant="secondary" className="capitalize">
                  {merchant.merchant_subscriptions?.[0]?.subscription_tiers?.name || "free"}
                </Badge>
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                <Badge variant="outline" className="capitalize">
                  {merchant.verification_tier || "quick"}
                </Badge>
              </TableCell>
              <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                {new Date(merchant.created_at).toLocaleDateString()}
              </TableCell>
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
                    <DropdownMenuItem onClick={() => onViewDetails(merchant)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {merchant.verification_status === "pending" && (
                      <>
                        <DropdownMenuItem onClick={() => onApprove(merchant)}>
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onReject(merchant)}>
                          <XCircle className="mr-2 h-4 w-4 text-red-500" />
                          Reject
                        </DropdownMenuItem>
                      </>
                    )}
                    {merchant.verification_status === "verified" && (
                      <DropdownMenuItem onClick={() => onSuspend(merchant)}>
                        <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />
                        Suspend
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
    
    <div className="flex items-center justify-between py-4">
        <p className="text-sm text-muted-foreground">
          Showing {merchants.length > 0 ? (page - 1) * 10 + 1 : 0} - {Math.min(page * 10, page * 10 - 10 + merchants.length)} entries
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </>
  );
}
