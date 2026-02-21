import { format, differenceInDays } from "date-fns";
import { 
  Home, 
  Calendar, 
  Clock, 
  Wallet, 
  ClipboardCheck, 
  AlertTriangle,
  Eye 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { MoveOutNotice, MoveOutInspection, TenantProfile } from "../types";
import { MoveOutStatusBadge } from "./MoveOutStatusBadge";
import { formatCurrency } from "@/shared/utils/currency";

interface MoveOutsListProps {
  notices: MoveOutNotice[];
  inspections?: MoveOutInspection[];
  tenantProfiles?: Record<string, TenantProfile>;
  onScheduleInspection: (notice: MoveOutNotice) => void;
  onConductInspection: (notice: MoveOutNotice) => void;
  type: "upcoming" | "completed";
}

export const MoveOutsList = ({ 
  notices, 
  inspections, 
  tenantProfiles, 
  onScheduleInspection, 
  onConductInspection,
  type
}: MoveOutsListProps) => {
  if (notices.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          {type === "upcoming" ? (
            <Home className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          ) : (
            <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          )}
          <h3 className="text-lg font-medium mb-2">
            {type === "upcoming" ? "No Upcoming Move-Outs" : "No Completed Move-Outs"}
          </h3>
          <p className="text-muted-foreground">
            {type === "upcoming" 
              ? "All tenants are staying put!" 
              : "Completed move-outs will appear here."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {notices.map((notice) => {
        const inspection = inspections?.find((i) => i.move_out_notice_id === notice.id);
        const tenant = tenantProfiles?.[notice.tenant_user_id];
        const daysUntil = differenceInDays(new Date(notice.intended_move_out_date), new Date());
        
        if (type === "completed") {
           return (
            <Card key={notice.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Home className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {notice.contract?.unit?.property?.name} - Unit {notice.contract?.unit?.unit_number}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {tenant?.full_name} • Moved out {format(new Date(notice.intended_move_out_date), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                  <MoveOutStatusBadge notice={notice} inspection={inspection} />
                </div>
              </CardContent>
            </Card>
          );
        }

        return (
          <Card key={notice.id} className={daysUntil <= 7 ? "border-destructive" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Home className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {notice.contract?.unit?.property?.name} - Unit {notice.contract?.unit?.unit_number}
                    </CardTitle>
                    <CardDescription>
                      {tenant?.full_name || "Tenant"} • {tenant?.email}
                    </CardDescription>
                  </div>
                </div>
                <MoveOutStatusBadge notice={notice} inspection={inspection} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Move-Out Date</span>
                  </div>
                  <p className="font-semibold">
                    {format(new Date(notice.intended_move_out_date), "MMM dd, yyyy")}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Days Left</span>
                  </div>
                  <p className={`font-semibold ${daysUntil <= 7 ? "text-destructive" : ""}`}>
                    {daysUntil} days
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Wallet className="h-4 w-4" />
                    <span className="text-sm">Deposit</span>
                  </div>
                  <p className="font-semibold">
                    {formatCurrency(notice.contract?.deposit_amount || 0)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <ClipboardCheck className="h-4 w-4" />
                    <span className="text-sm">Inspection</span>
                  </div>
                  <p className="font-semibold">
                    {inspection?.status === "scheduled" 
                      ? format(new Date(inspection.scheduled_date!), "MMM dd")
                      : inspection?.status === "completed"
                      ? "Done"
                      : "Not scheduled"}
                  </p>
                </div>
              </div>

              {notice.is_early_termination && (
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 mb-4">
                  <div className="flex items-center gap-2 text-warning">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Early Termination</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Reason: {notice.reason || "Not specified"}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                {!inspection && (
                  <Button 
                    onClick={() => onScheduleInspection(notice)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Inspection
                  </Button>
                )}
                {inspection?.status === "scheduled" && (
                  <Button 
                    onClick={() => onConductInspection(notice)}
                  >
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Conduct Inspection
                  </Button>
                )}
                {inspection?.status === "completed" && (
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    View Report
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
