import { Vendor } from "@/features/users/types/admin-vendor";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
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
import { cn } from "@/shared/utils/utils";
import {
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Clock,
    Eye,
    MoreHorizontal,
    Star,
    Wrench,
    XCircle,
} from "lucide-react";

interface AdminVendorsTableProps {
  vendors: Vendor[];
  isLoading: boolean;
  onViewDetails: (vendor: Vendor) => void;
  onApprove: (vendor: Vendor) => void;
  onReject: (vendor: Vendor) => void;
  page: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function AdminVendorsTable({
  vendors,
  isLoading,
  onViewDetails,
  onApprove,
  onReject,
  page,
  totalCount,
  pageSize,
  onPageChange,
}: AdminVendorsTableProps) {
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasMore = page < totalPages;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge className={cn("bg-success text-success-foreground")}>
            <CheckCircle className="h-3 w-3 mr-1" /> Verified
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className={cn("bg-warning/10 text-warning")}>
            <Clock className="h-3 w-3 mr-1" /> Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" /> Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (vendors.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No vendors found</p>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="h-[600px] rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business Name</TableHead>
              <TableHead className="hidden md:table-cell">Contact</TableHead>
              <TableHead className="hidden lg:table-cell">Services</TableHead>
              <TableHead className="hidden sm:table-cell">Rating</TableHead>
              <TableHead className="hidden md:table-cell">Jobs</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((vendor) => (
              <TableRow key={vendor.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Wrench className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">{vendor.business_name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[150px] md:hidden">
                        {vendor.city}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[150px] hidden md:block">
                        {vendor.contact_email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="text-sm">
                    <p>{vendor.contact_phone || "-"}</p>
                    <p className="text-xs text-muted-foreground">
                      {[vendor.city, vendor.province]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {vendor.service_categories
                      ?.slice(0, 2)
                      .map((cat: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    {(vendor.service_categories?.length || 0) > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{(vendor.service_categories?.length || 0) - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-warning fill-warning" />
                    <span>{vendor.rating?.toFixed(1) || "0.0"}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{vendor.total_jobs || 0}</TableCell>
                <TableCell>
                  {getStatusBadge(vendor.verification_status || "pending")}
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
                      <DropdownMenuItem onClick={() => onViewDetails(vendor)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Review Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onApprove(vendor)}
                        disabled={vendor.verification_status === "verified"}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onReject(vendor)}
                        className="text-destructive focus:text-destructive"
                        disabled={vendor.verification_status === "rejected"}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>

      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          Showing {(page - 1) * pageSize + 1} -{" "}
          {Math.min(page * pageSize, totalCount)} of {totalCount}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!hasMore}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
