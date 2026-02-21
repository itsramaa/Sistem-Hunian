import { Card, CardContent } from "@/shared/components/ui/card";
import { AlertCircle, AlertTriangle, CheckCircle, Clock, MessageSquare } from "lucide-react";

interface AdminDisputeStatsProps {
  totalCount: number;
  openCount: number;
  inProgressCount: number;
  urgentCount: number;
  resolvedCount: number;
}

export function AdminDisputeStats({
  totalCount,
  openCount,
  inProgressCount,
  urgentCount,
  resolvedCount,
}: AdminDisputeStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Disputes</p>
            <p className="text-2xl font-bold">{totalCount}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-warning/10">
            <Clock className="h-6 w-6 text-warning" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Open</p>
            <p className="text-2xl font-bold">{openCount}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-info/10">
            <MessageSquare className="h-6 w-6 text-info" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold">{inProgressCount}</p>
          </div>
        </CardContent>
      </Card>
      <Card className={urgentCount > 0 ? "border-destructive/50 bg-destructive/5" : ""}>
        <CardContent className="p-6 flex items-center gap-4">
          <div className={`p-3 rounded-lg ${urgentCount > 0 ? "bg-destructive/20" : "bg-muted"}`}>
            <AlertCircle
              className={`h-6 w-6 ${urgentCount > 0 ? "text-destructive" : "text-muted-foreground"}`}
            />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Urgent/High</p>
            <p className="text-2xl font-bold">{urgentCount}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-success/10">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Resolved</p>
            <p className="text-2xl font-bold">{resolvedCount}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
