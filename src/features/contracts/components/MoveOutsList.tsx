import { format, differenceInDays } from "date-fns";
import { 
  Home, Calendar, Clock, Wallet, ClipboardCheck, AlertTriangle, Eye 
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
  notices, inspections, tenantProfiles, onScheduleInspection, onConductInspection, type
}: MoveOutsListProps) => {
  if (notices.length === 0) {
    return (
      <Card className="bg-card/90 backdrop-blur-sm border border-border/40 rounded-2xl">
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 flex items-center justify-center mx-auto mb-4">
            {type === "upcoming" ? (
              <Home className="h-8 w-8 text-primary" />
            ) : (
              <ClipboardCheck className="h-8 w-8 text-primary" />
            )}
          </div>
          <h3 className="text-lg font-semibold mb-2">
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
            <Card key={notice.id} className="bg-card/90 backdrop-blur-sm border border-border/40 rounded-2xl hover:border-primary/30 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="gradient-icon-box">
                      <Home className="h-5 w-5 text-primary" />
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
          <Card key={notice.id} className={`bg-card/90 backdrop-blur-sm rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${daysUntil <= 7 ? "border-destructive/50" : "border-border/40 hover:border-primary/30"}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="gradient-icon-box">
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
                {[
                  { icon: Calendar, label: "Move-Out Date", value: format(new Date(notice.intended_move_out_date), "MMM dd, yyyy") },
                  { icon: Clock, label: "Days Left", value: `${daysUntil} days`, urgent: daysUntil <= 7 },
                  { icon: Wallet, label: "Deposit", value: formatCurrency(notice.contract?.deposit_amount || 0) },
                  { icon: ClipboardCheck, label: "Inspection", value: inspection?.status === "scheduled" ? format(new Date(inspection.scheduled_date!), "MMM dd") : inspection?.status === "completed" ? "Done" : "Not scheduled" },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-xl bg-card/80 backdrop-blur-sm border border-border/30">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <p className={`font-semibold ${item.urgent ? "text-destructive" : ""}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {notice.is_early_termination && (
                <div className="p-3 rounded-xl bg-warning/10 border border-warning/20 mb-4">
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
                  <Button onClick={() => onScheduleInspection(notice)} className="gradient-cta rounded-xl">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Inspection
                  </Button>
                )}
                {inspection?.status === "scheduled" && (
                  <Button onClick={() => onConductInspection(notice)} className="gradient-cta rounded-xl">
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Conduct Inspection
                  </Button>
                )}
                {inspection?.status === "completed" && (
                  <Button variant="outline" className="rounded-xl">
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
