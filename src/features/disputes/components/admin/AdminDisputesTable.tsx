import { Dispute } from "@/features/disputes/types";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table";
import { cn } from "@/shared/utils/utils";
import { format } from "date-fns";
import { CheckCircle, Clock, Eye } from "lucide-react";

interface AdminDisputesTableProps {
  disputes: Dispute[];
  onReview: (dispute: Dispute) => void;
}

export function AdminDisputesTable({
  disputes,
  onReview,
}: AdminDisputesTableProps) {
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "resolved":
        return (
          <Badge className={cn("bg-success text-success-foreground")}>
            <CheckCircle className="h-3 w-3 mr-1" /> Resolved
          </Badge>
        );
      case "open":
        return (
          <Badge variant="secondary" className={cn("bg-warning/10 text-warning")}>
            <Clock className="h-3 w-3 mr-1" /> Open
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <Badge variant="destructive" className={cn("bg-destructive/10 text-destructive border-destructive/20")}>
            High
          </Badge>
        );
      case "medium":
        return (
          <Badge variant="secondary" className={cn("bg-warning/10 text-warning border-warning/20")}>
            Medium
          </Badge>
        );
      case "low":
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Low
          </Badge>
        );
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Dispute</TableHead>
          <TableHead className="hidden md:table-cell">Property</TableHead>
          <TableHead className="hidden sm:table-cell">Priority</TableHead>
          <TableHead className="hidden sm:table-cell">Status</TableHead>
          <TableHead className="hidden lg:table-cell">Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {disputes.map((dispute) => (
          <TableRow key={dispute.id}>
            <TableCell>
              <div className="flex flex-col gap-1">
                <p className="font-medium">{dispute.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{dispute.description}</p>
                
                {/* Mobile Fallback */}
                <div className="md:hidden text-xs text-muted-foreground">
                   {dispute.contract?.unit?.property?.name || "-"}
                </div>
                <div className="lg:hidden text-[10px] text-muted-foreground">
                  {format(new Date(dispute.created_at), "MMM dd, yyyy")}
                </div>

                <div className="flex gap-2 mt-1 sm:hidden">
                  <div className="scale-90 origin-left">
                     {getPriorityBadge(dispute.priority)}
                  </div>
                  <div className="scale-90 origin-left">
                     {getStatusBadge(dispute.status)}
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {dispute.contract?.unit?.property?.name || "-"} - {dispute.contract?.unit?.unit_number || ""}
            </TableCell>
            <TableCell className="hidden sm:table-cell">{getPriorityBadge(dispute.priority)}</TableCell>
            <TableCell className="hidden sm:table-cell">{getStatusBadge(dispute.status)}</TableCell>
            <TableCell className="hidden lg:table-cell">{format(new Date(dispute.created_at), "MMM dd, yyyy")}</TableCell>
            <TableCell className="text-right">
              <Button variant="outline" size="sm" onClick={() => onReview(dispute)}>
                <Eye className="h-4 w-4 mr-1" />
                Review
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
