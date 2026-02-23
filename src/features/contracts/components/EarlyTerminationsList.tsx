import { format } from "date-fns";
import { AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { EarlyTerminationRequest } from "../types";
import { formatCurrency } from "@/shared/utils/currency";

interface EarlyTerminationsListProps {
  requests: EarlyTerminationRequest[];
  onReview: (request: EarlyTerminationRequest) => void;
}

export const EarlyTerminationsList = ({ requests, onReview }: EarlyTerminationsListProps) => {
  if (requests.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="No Pending Requests"
        description="All early termination requests have been processed."
      />
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id} className="border-warning/50 bg-card/90 backdrop-blur-sm rounded-2xl hover:border-warning transition-all duration-300">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="gradient-icon-box">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <CardTitle className="text-lg">Early Termination Request</CardTitle>
                  <CardDescription>{request.contract?.unit?.property?.name} - Unit {request.contract?.unit?.unit_number}</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="rounded-full">Pending Approval</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {[
                { label: "Requested Date", value: format(new Date(request.requested_date), "MMM dd, yyyy") },
                { label: "Penalty Amount", value: formatCurrency(request.penalty_amount), className: "text-destructive" },
                { label: "Reason", value: request.reason || "Not specified" },
              ].map((item, i) => (
                <div key={i} className="p-3 rounded-xl bg-card/80 backdrop-blur-sm border border-border/30">
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className={`font-semibold ${item.className || ""}`}>{item.value}</p>
                </div>
              ))}
            </div>
            <Button onClick={() => onReview(request)} className="gradient-cta rounded-xl">
              Review Request
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
